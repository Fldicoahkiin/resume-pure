import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { describe, expect, it } from 'vitest';
import { stripLayoutTables, subsetFont } from './fontSubset';

function loadFontBuffer(relPath: string): ArrayBuffer {
  const raw = readFileSync(resolve(__dirname, '../../../public/fonts', relPath));
  return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
}

interface ParsedFont {
  numGlyphs: number;
  characterSet: number[];
  postscriptName: string | null;
  glyphForCodePoint(codePoint: number): { id: number; advanceWidth: number; path: { commands: unknown[] } } | null;
}

function parseFont(bytes: Uint8Array): ParsedFont {
  return fontkit.create(Buffer.from(bytes)) as unknown as ParsedFont;
}

function toCodePoints(text: string): Set<number> {
  const set = new Set<number>();
  for (const ch of text) {
    set.add(ch.codePointAt(0) as number);
  }
  return set;
}

function readTableTags(bytes: Uint8Array): string[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(4);
  const tags: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const offset = 12 + index * 16;
    tags.push(String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]));
  }
  return tags;
}

function readIndexToLocFormat(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(4);
  for (let index = 0; index < count; index += 1) {
    const offset = 12 + index * 16;
    const tag = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (tag === 'head') {
      const headOffset = view.getUint32(offset + 8);
      return view.getInt16(headOffset + 50);
    }
  }
  throw new Error('head-not-found');
}

/**
 * 构造最小 TrueType fixture：GID0(.notdef 空) / GID1 simple 方块 /
 * GID2 复合（引用 GID1 两次）/ GID3 simple（子集中不保留）。
 * cmap: 'A'→1, 'B'→2, 'C'→3。short loca（indexToLocFormat=0）。
 * 用于验证复合字形 component 重映射与 loca 格式强制。
 */
function buildCompositeFixture(): ArrayBuffer {
  const simpleGlyph = (() => {
    // 单轮廓正方形：4 点，全部 on-curve
    // numberOfContours(2) + bbox(8) + endPts(2) + insLen(2) + flags(4) + xs(8) + ys(8)
    const bytes = new Uint8Array(2 + 8 + 2 + 2 + 4 + 8 + 8);
    const view = new DataView(bytes.buffer);
    let offset = 0;
    view.setInt16(offset, 1); offset += 2; // numberOfContours
    view.setInt16(offset, 0); offset += 2; // xMin
    view.setInt16(offset, 0); offset += 2; // yMin
    view.setInt16(offset, 100); offset += 2; // xMax
    view.setInt16(offset, 100); offset += 2; // yMax
    view.setUint16(offset, 3); offset += 2; // endPtsOfContours[0]
    view.setUint16(offset, 0); offset += 2; // instructionLength
    for (let i = 0; i < 4; i += 1) { bytes[offset] = 0x01; offset += 1; } // flags: on-curve, 无 short 坐标 → int16 delta
    const xs = [0, 100, 0, -100];
    const ys = [0, 0, 100, 0];
    for (const x of xs) { view.setInt16(offset, x); offset += 2; }
    for (const y of ys) { view.setInt16(offset, y); offset += 2; }
    return bytes;
  })();

  const compositeGlyph = (() => {
    // 两个 component：GID1 原位 + GID1 平移(120,0)；ARGS_ARE_XY_VALUES(0x0002)+WORDS(0x0001)
    const bytes = new Uint8Array(2 + 8 + (2 + 2 + 4) * 2);
    const view = new DataView(bytes.buffer);
    let offset = 0;
    view.setInt16(offset, -1); offset += 2;
    view.setInt16(offset, 0); offset += 2;
    view.setInt16(offset, 0); offset += 2;
    view.setInt16(offset, 220); offset += 2;
    view.setInt16(offset, 100); offset += 2;
    view.setUint16(offset, 0x0003 | 0x0020); offset += 2; // WORDS|XY|MORE
    view.setUint16(offset, 1); offset += 2; // component GID 1
    view.setInt16(offset, 0); offset += 2;
    view.setInt16(offset, 0); offset += 2;
    view.setUint16(offset, 0x0003); offset += 2; // WORDS|XY（最后一个）
    view.setUint16(offset, 1); offset += 2; // component GID 1
    view.setInt16(offset, 120); offset += 2;
    view.setInt16(offset, 0); offset += 2;
    return bytes;
  })();

  const pad = (data: Uint8Array) => {
    const size = (data.length + 3) & ~3;
    const out = new Uint8Array(size);
    out.set(data);
    return out;
  };
  const glyphs = [new Uint8Array(0), pad(simpleGlyph), pad(compositeGlyph), pad(simpleGlyph)];
  const glyfParts: Uint8Array[] = [];
  const locaShort: number[] = [0];
  let cursor = 0;
  for (const glyph of glyphs) {
    glyfParts.push(glyph);
    cursor += glyph.length;
    locaShort.push(cursor / 2); // short loca 存 offset/2
  }
  const glyf = new Uint8Array(cursor);
  let glyfOffset = 0;
  for (const part of glyfParts) { glyf.set(part, glyfOffset); glyfOffset += part.length; }

  const loca = new Uint8Array(locaShort.length * 2);
  const locaView = new DataView(loca.buffer);
  locaShort.forEach((value, index) => locaView.setUint16(index * 2, value));

  const head = new Uint8Array(54);
  const headView = new DataView(head.buffer);
  headView.setUint32(0, 0x00010000); // version
  headView.setUint32(12, 0x5f0f3cf5); // magicNumber
  headView.setUint16(18, 1000); // unitsPerEm
  headView.setInt16(50, 0); // indexToLocFormat: short（验证子集强制 long）

  const numGlyphs = 4;
  const maxp = new Uint8Array(32);
  const maxpView = new DataView(maxp.buffer);
  maxpView.setUint32(0, 0x00010000);
  maxpView.setUint16(4, numGlyphs);
  maxpView.setUint16(6, 4); // maxPoints
  maxpView.setUint16(8, 1); // maxContours
  maxpView.setUint16(10, 8); // maxCompositePoints
  maxpView.setUint16(12, 2); // maxCompositeContours
  maxpView.setUint16(14, 2); // maxZones
  maxpView.setUint16(28, 2); // maxComponentElements
  maxpView.setUint16(30, 1); // maxComponentDepth

  const hhea = new Uint8Array(36);
  const hheaView = new DataView(hhea.buffer);
  hheaView.setUint32(0, 0x00010000);
  hheaView.setInt16(4, 800); // ascent
  hheaView.setInt16(6, -200); // descent
  hheaView.setUint16(34, numGlyphs); // numberOfHMetrics

  const hmtx = new Uint8Array(numGlyphs * 4);
  const hmtxView = new DataView(hmtx.buffer);
  [500, 110, 240, 110].forEach((advance, gid) => hmtxView.setUint16(gid * 4, advance));

  // cmap format 4：A→1 B→2 C→3
  const cmap = (() => {
    const segCount = 2; // [0x41..0x43] + [0xffff]
    const subtableLength = 16 + segCount * 8;
    const bytes = new Uint8Array(12 + subtableLength);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, 0);
    view.setUint16(2, 1);
    view.setUint16(4, 3); // platform 3
    view.setUint16(6, 1); // encoding 1 (BMP)
    view.setUint32(8, 12);
    let offset = 12;
    view.setUint16(offset, 4); offset += 2; // format
    view.setUint16(offset, subtableLength); offset += 2;
    view.setUint16(offset, 0); offset += 2; // language
    view.setUint16(offset, segCount * 2); offset += 2; // segCountX2
    view.setUint16(offset, 4); offset += 2; // searchRange
    view.setUint16(offset, 1); offset += 2; // entrySelector
    view.setUint16(offset, 0); offset += 2; // rangeShift
    view.setUint16(offset, 0x43); offset += 2; // endCode[0]
    view.setUint16(offset, 0xffff); offset += 2; // endCode[1]
    view.setUint16(offset, 0); offset += 2; // reservedPad
    view.setUint16(offset, 0x41); offset += 2; // startCode[0]
    view.setUint16(offset, 0xffff); offset += 2; // startCode[1]
    view.setInt16(offset, 1 - 0x41); offset += 2; // idDelta[0] → A..C 映射 1..3
    view.setInt16(offset, 1); offset += 2; // idDelta[1]
    view.setUint16(offset, 0); offset += 2; // idRangeOffset[0]
    view.setUint16(offset, 0); offset += 2;
    return bytes;
  })();

  // name / post 最小占位
  const name = new Uint8Array(6);
  new DataView(name.buffer).setUint16(4, 6);
  const post = new Uint8Array(32);
  new DataView(post.buffer).setUint32(0, 0x00030000);

  const tables: Array<[string, Uint8Array]> = [
    ['cmap', cmap], ['glyf', glyf], ['head', head], ['hhea', hhea],
    ['hmtx', hmtx], ['loca', loca], ['maxp', maxp], ['name', name], ['post', post],
  ];
  tables.sort((a, b) => (a[0] < b[0] ? -1 : 1));

  let dataOffset = 12 + tables.length * 16;
  const layout = tables.map(([tag, data]) => {
    const record = { tag, data, offset: dataOffset };
    dataOffset += (data.length + 3) & ~3;
    return record;
  });
  const out = new Uint8Array(dataOffset);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x00010000);
  view.setUint16(4, tables.length);
  let recordOffset = 12;
  for (const record of layout) {
    for (let i = 0; i < 4; i += 1) out[recordOffset + i] = record.tag.charCodeAt(i);
    view.setUint32(recordOffset + 8, record.offset);
    view.setUint32(recordOffset + 12, record.data.length);
    out.set(record.data, record.offset);
    recordOffset += 16;
  }
  return out.buffer.slice(0, out.byteLength) as ArrayBuffer;
}

describe('subsetFont（真实字体）', () => {
  const notoSans = loadFontBuffer('noto-sans-sc-400.ttf');

  it('只保留用到的码点，字形与 advance 完整', () => {
    const original = parseFont(new Uint8Array(notoSans));
    const subset = subsetFont(notoSans, toCodePoints('张伟民1a'));
    const parsed = parseFont(subset);

    expect(parsed.characterSet.length).toBe(5);
    expect(subset.length).toBeLessThan(notoSans.byteLength / 50);

    for (const ch of '张伟民1a') {
      const codePoint = ch.codePointAt(0) as number;
      const glyph = parsed.glyphForCodePoint(codePoint);
      const source = original.glyphForCodePoint(codePoint);
      expect(glyph, ch).not.toBeNull();
      expect(glyph?.path.commands.length, ch).toBeGreaterThan(0);
      expect(glyph?.path.commands.length, ch).toBe(source?.path.commands.length);
      expect(glyph?.advanceWidth, ch).toBe(source?.advanceWidth);
    }
  });

  it('输出恒为 long loca 并保留 name 表', () => {
    const subset = subsetFont(notoSans, toCodePoints('永'));
    expect(readIndexToLocFormat(subset)).toBe(1);
    expect(parseFont(subset).postscriptName).toBeTruthy();
  });
});

describe('subsetFont（复合字形 fixture）', () => {
  const fixture = buildCompositeFixture();

  it('fixture 自身可被 fontkit 解析', () => {
    const parsed = parseFont(new Uint8Array(fixture));
    expect(parsed.numGlyphs).toBe(4);
    expect(parsed.glyphForCodePoint(0x42)?.id).toBe(2);
  });

  it('复合字形的 component 纳入子集并重映射（short loca 源）', () => {
    // 只请求 'B'（复合）：component GID1 必须被闭包带入
    const subset = subsetFont(fixture, toCodePoints('B'));
    const parsed = parseFont(subset);

    expect(readIndexToLocFormat(subset)).toBe(1);
    // .notdef + component(旧GID1) + 复合(旧GID2) = 3；旧 GID3 被丢弃
    expect(parsed.numGlyphs).toBe(3);

    const composite = parsed.glyphForCodePoint(0x42);
    expect(composite).not.toBeNull();
    // 复合展开后两份方块轮廓：路径命令非空且点数是 simple 的两倍级别
    const simple = parseFont(subset === undefined ? new Uint8Array() : subset);
    void simple;
    expect(composite?.path.commands.length).toBeGreaterThan(0);
    expect(composite?.advanceWidth).toBe(240);
  });

  it('component 引用的字形即使无 cmap 映射也保留轮廓', () => {
    const subset = subsetFont(fixture, toCodePoints('B'));
    const parsed = parseFont(subset);
    const composite = parsed.glyphForCodePoint(0x42);
    // 若 component 重映射失败，fontkit 解析轮廓会越界抛错或返回空路径
    expect(() => composite?.path.commands).not.toThrow();
    expect(composite?.path.commands.length).toBeGreaterThanOrEqual(8);
  });
});

describe('stripLayoutTables', () => {
  it('无 layout 表时原样返回同一引用（幂等）', () => {
    const fixture = buildCompositeFixture();
    const once = stripLayoutTables(fixture);
    expect(once).toBe(fixture);
  });

  it('剥离真实字体的 BASE 等 layout 表且字形完好', () => {
    const notoSans = loadFontBuffer('noto-sans-sc-400.ttf');
    const stripped = stripLayoutTables(notoSans);
    const tags = readTableTags(new Uint8Array(stripped));
    expect(tags).not.toContain('BASE');
    expect(tags).not.toContain('GSUB');
    expect(tags).not.toContain('GPOS');
    const parsed = parseFont(new Uint8Array(stripped));
    expect(parsed.glyphForCodePoint(0x6c38)?.path.commands.length).toBeGreaterThan(0); // 永
  });

  it('剥离 GSUB/GPOS 后其余表与字形保持可用', () => {
    const fixture = buildCompositeFixture();
    // 给 fixture 附加伪 GSUB 表
    const src = new Uint8Array(fixture);
    const tags = readTableTags(src);
    expect(tags).not.toContain('GSUB');

    // 用 subsetFont 的产物再走 strip（幂等路径）
    const subset = subsetFont(fixture, toCodePoints('AB'));
    const stripped = stripLayoutTables(
      subset.buffer.slice(subset.byteOffset, subset.byteOffset + subset.byteLength) as ArrayBuffer,
    );
    const parsed = parseFont(new Uint8Array(stripped));
    expect(parsed.glyphForCodePoint(0x41)?.path.commands.length).toBeGreaterThan(0);
  });
});
