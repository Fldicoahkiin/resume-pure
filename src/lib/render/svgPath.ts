/**
 * SVG path 数据 → PDF 路径操作符。
 *
 * pdf-lib 自带的 drawSvgPath 解析器处理不了图标库的紧凑语法
 * （如 "22s8-4"、arc 的粘连 flag "01 1.4"），这里按 SVG 规范完整实现：
 * M/L/H/V/C/S/Q/T/A/Z 的大小写命令，Q/T/A 全部降为三次贝塞尔。
 */
import {
  appendBezierCurve,
  closePath,
  lineTo,
  moveTo,
  type PDFOperator,
} from 'pdf-lib';

type PathSegment =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Z' };

class PathScanner {
  private index = 0;

  constructor(private readonly source: string) {}

  private skipSeparators() {
    while (this.index < this.source.length && /[\s,]/.test(this.source[this.index])) {
      this.index += 1;
    }
  }

  readCommand(): string | null {
    this.skipSeparators();
    const char = this.source[this.index];
    if (char && /[a-zA-Z]/.test(char)) {
      this.index += 1;
      return char;
    }
    return null;
  }

  hasMoreNumbers(): boolean {
    this.skipSeparators();
    const char = this.source[this.index];
    return char !== undefined && /[-+.\d]/.test(char);
  }

  readNumber(): number {
    this.skipSeparators();
    const match = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(this.source.slice(this.index));
    if (!match) {
      throw new Error(`svg-path-number-expected:${this.source.slice(this.index, this.index + 12)}`);
    }
    this.index += match[0].length;
    return parseFloat(match[0]);
  }

  /** arc 的 large-arc/sweep flag 是单字符，允许与后续数字粘连（"011.4" = 0,1,1.4） */
  readFlag(): number {
    this.skipSeparators();
    const char = this.source[this.index];
    if (char !== '0' && char !== '1') {
      throw new Error(`svg-path-flag-expected:${this.source.slice(this.index, this.index + 12)}`);
    }
    this.index += 1;
    return char === '1' ? 1 : 0;
  }
}

/** 椭圆弧 → 三次贝塞尔（SVG 规范 F.6.5 端点参数转中心参数，再按 ≤90° 分段拟合） */
function arcToCubics(
  x1: number, y1: number,
  rxIn: number, ryIn: number,
  rotationDeg: number,
  largeArc: number, sweep: number,
  x2: number, y2: number,
): Array<{ x1: number; y1: number; x2: number; y2: number; x: number; y: number }> {
  if (x1 === x2 && y1 === y2) {
    return [];
  }

  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) {
    return [{ x1, y1, x2, y2, x: x2, y: y2 }];
  }

  const phi = (rotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const numerator = rxSq * rySq - rxSq * y1p * y1p - rySq * x1p * x1p;
  const denominator = rxSq * y1p * y1p + rySq * x1p * x1p;
  const radicand = Math.max(0, numerator / denominator);
  let coefficient = Math.sqrt(radicand);
  if (largeArc === sweep) {
    coefficient = -coefficient;
  }

  const cxp = (coefficient * rx * y1p) / ry;
  const cyp = (-coefficient * ry * x1p) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const angleBetween = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    let angle = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) {
      angle = -angle;
    }
    return angle;
  };

  const startVectorX = (x1p - cxp) / rx;
  const startVectorY = (y1p - cyp) / ry;
  const theta1 = angleBetween(1, 0, startVectorX, startVectorY);
  let deltaTheta = angleBetween(startVectorX, startVectorY, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

  if (sweep === 0 && deltaTheta > 0) {
    deltaTheta -= 2 * Math.PI;
  } else if (sweep === 1 && deltaTheta < 0) {
    deltaTheta += 2 * Math.PI;
  }

  const segmentCount = Math.max(1, Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2)));
  const segmentDelta = deltaTheta / segmentCount;
  const t = (4 / 3) * Math.tan(segmentDelta / 4);

  const cubics: Array<{ x1: number; y1: number; x2: number; y2: number; x: number; y: number }> = [];
  let theta = theta1;

  const pointAt = (angle: number) => ({
    x: cx + rx * Math.cos(angle) * cosPhi - ry * Math.sin(angle) * sinPhi,
    y: cy + rx * Math.cos(angle) * sinPhi + ry * Math.sin(angle) * cosPhi,
  });
  const derivativeAt = (angle: number) => ({
    x: -rx * Math.sin(angle) * cosPhi - ry * Math.cos(angle) * sinPhi,
    y: -rx * Math.sin(angle) * sinPhi + ry * Math.cos(angle) * cosPhi,
  });

  for (let segment = 0; segment < segmentCount; segment += 1) {
    const thetaEnd = theta + segmentDelta;
    const start = pointAt(theta);
    const end = pointAt(thetaEnd);
    const startDerivative = derivativeAt(theta);
    const endDerivative = derivativeAt(thetaEnd);

    cubics.push({
      x1: start.x + t * startDerivative.x,
      y1: start.y + t * startDerivative.y,
      x2: end.x - t * endDerivative.x,
      y2: end.y - t * endDerivative.y,
      x: end.x,
      y: end.y,
    });
    theta = thetaEnd;
  }

  return cubics;
}

export function parseSvgPath(data: string): PathSegment[] {
  const scanner = new PathScanner(data);
  const segments: PathSegment[] = [];

  let command: string | null = null;
  let currentX = 0;
  let currentY = 0;
  let subpathStartX = 0;
  let subpathStartY = 0;
  let lastCubicControlX: number | null = null;
  let lastCubicControlY: number | null = null;
  let lastQuadControlX: number | null = null;
  let lastQuadControlY: number | null = null;

  const pushCubic = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
    segments.push({ type: 'C', x1, y1, x2, y2, x, y });
    lastCubicControlX = x2;
    lastCubicControlY = y2;
    lastQuadControlX = null;
    lastQuadControlY = null;
    currentX = x;
    currentY = y;
  };

  const pushQuad = (qx: number, qy: number, x: number, y: number) => {
    // 二次 → 三次：控制点取 1/3、2/3 处
    const c1x = currentX + (2 / 3) * (qx - currentX);
    const c1y = currentY + (2 / 3) * (qy - currentY);
    const c2x = x + (2 / 3) * (qx - x);
    const c2y = y + (2 / 3) * (qy - y);
    segments.push({ type: 'C', x1: c1x, y1: c1y, x2: c2x, y2: c2y, x, y });
    lastQuadControlX = qx;
    lastQuadControlY = qy;
    lastCubicControlX = null;
    lastCubicControlY = null;
    currentX = x;
    currentY = y;
  };

  const resetControlPoints = () => {
    lastCubicControlX = null;
    lastCubicControlY = null;
    lastQuadControlX = null;
    lastQuadControlY = null;
  };

  for (;;) {
    const nextCommand = scanner.readCommand();
    if (nextCommand) {
      command = nextCommand;
    } else if (!scanner.hasMoreNumbers() || command === null) {
      break;
    } else if (command === 'Z' || command === 'z') {
      // 命令缺省时按 SVG 规则重复上一命令，但 Z 不消费数字——
      // "Z 后跟裸数字"的畸形输入会让扫描指针停滞，报错而非死循环
      throw new Error(`svg-path-number-after-close:${data.slice(0, 24)}`);
    }

    const activeCommand: string = command;
    const isRelative = activeCommand === activeCommand.toLowerCase();
    const upper = activeCommand.toUpperCase();

    switch (upper) {
      case 'M': {
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        segments.push({ type: 'M', x, y });
        currentX = x;
        currentY = y;
        subpathStartX = x;
        subpathStartY = y;
        resetControlPoints();
        command = isRelative ? 'l' : 'L';
        break;
      }
      case 'L': {
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        segments.push({ type: 'L', x, y });
        currentX = x;
        currentY = y;
        resetControlPoints();
        break;
      }
      case 'H': {
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        segments.push({ type: 'L', x, y: currentY });
        currentX = x;
        resetControlPoints();
        break;
      }
      case 'V': {
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        segments.push({ type: 'L', x: currentX, y });
        currentY = y;
        resetControlPoints();
        break;
      }
      case 'C': {
        const x1 = scanner.readNumber() + (isRelative ? currentX : 0);
        const y1 = scanner.readNumber() + (isRelative ? currentY : 0);
        const x2 = scanner.readNumber() + (isRelative ? currentX : 0);
        const y2 = scanner.readNumber() + (isRelative ? currentY : 0);
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        pushCubic(x1, y1, x2, y2, x, y);
        break;
      }
      case 'S': {
        const x1 = lastCubicControlX !== null ? 2 * currentX - lastCubicControlX : currentX;
        const y1 = lastCubicControlY !== null ? 2 * currentY - lastCubicControlY : currentY;
        const x2 = scanner.readNumber() + (isRelative ? currentX : 0);
        const y2 = scanner.readNumber() + (isRelative ? currentY : 0);
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        pushCubic(x1, y1, x2, y2, x, y);
        break;
      }
      case 'Q': {
        const qx = scanner.readNumber() + (isRelative ? currentX : 0);
        const qy = scanner.readNumber() + (isRelative ? currentY : 0);
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        pushQuad(qx, qy, x, y);
        break;
      }
      case 'T': {
        const qx = lastQuadControlX !== null ? 2 * currentX - lastQuadControlX : currentX;
        const qy = lastQuadControlY !== null ? 2 * currentY - lastQuadControlY : currentY;
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        pushQuad(qx, qy, x, y);
        break;
      }
      case 'A': {
        const rx = scanner.readNumber();
        const ry = scanner.readNumber();
        const rotation = scanner.readNumber();
        const largeArc = scanner.readFlag();
        const sweep = scanner.readFlag();
        const x = scanner.readNumber() + (isRelative ? currentX : 0);
        const y = scanner.readNumber() + (isRelative ? currentY : 0);
        for (const cubic of arcToCubics(currentX, currentY, rx, ry, rotation, largeArc, sweep, x, y)) {
          pushCubic(cubic.x1, cubic.y1, cubic.x2, cubic.y2, cubic.x, cubic.y);
        }
        currentX = x;
        currentY = y;
        break;
      }
      case 'Z': {
        segments.push({ type: 'Z' });
        currentX = subpathStartX;
        currentY = subpathStartY;
        resetControlPoints();
        break;
      }
      default:
        throw new Error(`svg-path-unknown-command:${activeCommand}`);
    }
  }

  return segments;
}

export interface SvgPathTransform {
  /** 图形左上角的 PDF x 坐标（pt） */
  x: number;
  /** 图形左上角的 PDF y 坐标（pt，PDF y 轴向上） */
  y: number;
  scaleX: number;
  scaleY: number;
}

/** 解析 path 并转换为 PDF 路径操作符（含 y 翻转与缩放） */
export function svgPathToPdfOperators(data: string, transform: SvgPathTransform): PDFOperator[] {
  const mapX = (value: number) => transform.x + value * transform.scaleX;
  const mapY = (value: number) => transform.y - value * transform.scaleY;

  const operators: PDFOperator[] = [];
  for (const segment of parseSvgPath(data)) {
    switch (segment.type) {
      case 'M':
        operators.push(moveTo(mapX(segment.x), mapY(segment.y)));
        break;
      case 'L':
        operators.push(lineTo(mapX(segment.x), mapY(segment.y)));
        break;
      case 'C':
        operators.push(appendBezierCurve(
          mapX(segment.x1), mapY(segment.y1),
          mapX(segment.x2), mapY(segment.y2),
          mapX(segment.x), mapY(segment.y),
        ));
        break;
      case 'Z':
        operators.push(closePath());
        break;
    }
  }

  return operators;
}
