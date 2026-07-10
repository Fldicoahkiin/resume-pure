import { describe, expect, it } from 'vitest';
import { parseSvgPath, svgPathToPdfOperators } from './svgPath';

describe('parseSvgPath', () => {
  it('解析绝对 M/L/H/V/Z', () => {
    const segments = parseSvgPath('M 10 20 L 30 40 H 50 V 60 Z');
    expect(segments).toEqual([
      { type: 'M', x: 10, y: 20 },
      { type: 'L', x: 30, y: 40 },
      { type: 'L', x: 50, y: 40 },
      { type: 'L', x: 50, y: 60 },
      { type: 'Z' },
    ]);
  });

  it('相对命令基于当前点累加', () => {
    const segments = parseSvgPath('m 10 10 l 5 5 h 5 v 5');
    expect(segments).toEqual([
      { type: 'M', x: 10, y: 10 },
      { type: 'L', x: 15, y: 15 },
      { type: 'L', x: 20, y: 15 },
      { type: 'L', x: 20, y: 20 },
    ]);
  });

  it('M 后的多组坐标按 SVG 规则隐式变为 L', () => {
    const segments = parseSvgPath('M 0 0 10 10 20 20');
    expect(segments.map((s) => s.type)).toEqual(['M', 'L', 'L']);
  });

  it('解析 lucide 风格的紧凑语法（负号分隔、s 平滑曲线）', () => {
    // HEADER_FALLBACK_ICON 的开头片段
    const segments = parseSvgPath('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
    expect(segments[0]).toEqual({ type: 'M', x: 12, y: 22 });
    expect(segments[segments.length - 1]).toEqual({ type: 'Z' });
    // s → C（平滑三次曲线），l 负坐标正确
    expect(segments.some((s) => s.type === 'C')).toBe(true);
  });

  it('解析粘连的 arc flag（"011.4" = 0,1,1.4）并转为三次曲线', () => {
    const segments = parseSvgPath('M 0 0 a2 2 0 011.4 0');
    expect(segments[0].type).toBe('M');
    const curves = segments.filter((s) => s.type === 'C');
    expect(curves.length).toBeGreaterThan(0);
    const last = curves[curves.length - 1] as { x: number; y: number };
    expect(last.x).toBeCloseTo(1.4, 5);
    expect(last.y).toBeCloseTo(0, 5);
  });

  it('解析省略前导零与科学计数法的数字', () => {
    const segments = parseSvgPath('M .5 -.5 L 1e1 -1.5e-1');
    expect(segments).toEqual([
      { type: 'M', x: 0.5, y: -0.5 },
      { type: 'L', x: 10, y: -0.15 },
    ]);
  });

  it('Q/T 二次曲线降为三次，T 反射控制点', () => {
    const segments = parseSvgPath('M 0 0 Q 5 10 10 0 T 20 0');
    const curves = segments.filter((s) => s.type === 'C');
    expect(curves).toHaveLength(2);
    const second = curves[1] as { x1: number; y1: number };
    // T 的隐式控制点 = 上一 Q 控制点 (5,10) 关于 (10,0) 的反射 = (15,-10)
    expect(second.x1).toBeCloseTo(10 + (2 / 3) * (15 - 10), 5);
    expect(second.y1).toBeCloseTo(0 + (2 / 3) * (-10 - 0), 5);
  });

  it('arc 端点精确落在目标坐标', () => {
    const segments = parseSvgPath('M 0 0 A 10 10 0 0 1 20 0');
    const last = segments[segments.length - 1] as { type: string; x: number; y: number };
    expect(last.type).toBe('C');
    expect(last.x).toBeCloseTo(20, 5);
    expect(last.y).toBeCloseTo(0, 5);
  });

  it('rx=0 的 arc 退化为直线段（重合控制点）', () => {
    const segments = parseSvgPath('M 0 0 A 0 5 0 0 1 10 10');
    const last = segments[segments.length - 1] as { x: number; y: number };
    expect(last.x).toBe(10);
    expect(last.y).toBe(10);
  });

  it('Z 后跟裸数字的畸形输入报错而非死循环', () => {
    expect(() => parseSvgPath('M 0 0 L 5 5 Z 7 7')).toThrow(/svg-path-number-after-close/);
  });

  it('显式的连续 Z 合法', () => {
    expect(() => parseSvgPath('M 0 0 L 5 5 Z Z')).not.toThrow();
  });
});

describe('svgPathToPdfOperators', () => {
  it('按变换映射并翻转 y 轴', () => {
    const operators = svgPathToPdfOperators('M 0 0 L 24 24', {
      x: 100,
      y: 700,
      scaleX: 0.5,
      scaleY: 0.5,
    });
    // moveTo(100, 700)、lineTo(100+12, 700-12)
    expect(operators).toHaveLength(2);
    const [move, line] = operators.map((op) => op.toString());
    expect(move).toBe('100 700 m');
    expect(line).toBe('112 688 l');
  });

  it('闭合命令输出 h 操作符', () => {
    const operators = svgPathToPdfOperators('M 0 0 L 1 1 Z', { x: 0, y: 0, scaleX: 1, scaleY: 1 });
    expect(operators[operators.length - 1].toString()).toBe('h');
  });
});
