import fontkit from '@pdf-lib/fontkit';

/**
 * 运行时字体子集：只保留简历实际用到的码点，产出可被 pdf-lib 完整嵌入
 * （subset: false 路径）的小字体。
 *
 * 两条现成路径都不可用：
 * - pdf-lib 的 `embedFont(..., { subset: true })` 组装 CIDToGIDMap 有缺陷，丢字形；
 * - @pdf-lib/fontkit 1.1.1 的 glyf 编码器（createSubset/encodeStream）会损坏部分字形
 *   （实测拉丁字母子集后轮廓数据越界）。
 *
 * 因此这里自实现 TrueType 子集：用 fontkit 仅做解析（decode 无缺陷）拿到码点对应的
 * 字形 id，然后直接搬运原字体的字形字节重建 glyf/loca/hmtx，补一个只覆盖用到码点的
 * cmap（format 12），并沿用原 name 表。Noto Sans SC / Noto Emoji 的字形均为 simple
 * glyph（无复合引用），故字形字节可原样搬运，无需改写 component 索引。
 */

interface FontkitGlyph {
  id: number;
}
interface FontkitFont {
  glyphForCodePoint(codePoint: number): FontkitGlyph | null;
}

interface TableRecord {
  offset: number;
  length: number;
}

function mergeUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

function parseSfntTables(bytes: Uint8Array): Map<string, TableRecord> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numTables = view.getUint16(4);
  const tables = new Map<string, TableRecord>();

  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    const tag = String.fromCharCode(
      bytes[recordOffset],
      bytes[recordOffset + 1],
      bytes[recordOffset + 2],
      bytes[recordOffset + 3],
    );
    tables.set(tag, {
      offset: view.getUint32(recordOffset + 8),
      length: view.getUint32(recordOffset + 12),
    });
  }

  return tables;
}

/** 影响文本 shaping 度量的 OpenType/AAT layout 表 */
const LAYOUT_TABLE_TAGS = new Set(['GSUB', 'GPOS', 'GDEF', 'BASE', 'JSTF', 'kern', 'kerx', 'morx', 'feat']);

/**
 * 剥离字体的 layout 表（kerning/连字等）。
 *
 * 预览用 CanvasKit 排版（会应用 GPOS kerning），PDF 用运行时子集绘制（子集只保留
 * glyf/hmtx，无 GPOS）。若加载的字体带 kerning，两侧 advance 不一致，行内元素
 * 的间隙在 PDF 中会被吃掉。统一在加载入口剥离，保证两个渲染后端度量一致。
 * 对已无这些表的字体（本地预子集产物）原样返回。
 */
export function stripLayoutTables(buffer: ArrayBuffer): ArrayBuffer {
  const src = new Uint8Array(buffer);
  const records = parseSfntTables(src);

  const kept = new Map<string, Uint8Array>();
  let dropped = false;
  for (const [tag, record] of Array.from(records.entries())) {
    if (LAYOUT_TABLE_TAGS.has(tag)) {
      dropped = true;
      continue;
    }

    if (tag === 'head') {
      // 表集合变了，整表校验和不再成立；置 0（渲染器均不校验）
      const headCopy = src.slice(record.offset, record.offset + record.length);
      new DataView(headCopy.buffer).setUint32(8, 0);
      kept.set(tag, headCopy);
      continue;
    }

    kept.set(tag, src.subarray(record.offset, record.offset + record.length));
  }

  if (!dropped) {
    return buffer;
  }

  const repacked = repackSfnt(kept);
  return repacked.buffer.slice(repacked.byteOffset, repacked.byteOffset + repacked.byteLength) as ArrayBuffer;
}

function groupContiguous(codeToGid: Map<number, number>) {
  const sorted = Array.from(codeToGid.entries()).sort((left, right) => left[0] - right[0]);
  const groups: Array<{ start: number; end: number; startGid: number }> = [];

  for (const [codePoint, gid] of sorted) {
    const last = groups[groups.length - 1];
    if (last && codePoint === last.end + 1 && gid === last.startGid + (last.end - last.start + 1)) {
      last.end = codePoint;
    } else {
      groups.push({ start: codePoint, end: codePoint, startGid: gid });
    }
  }

  return groups;
}

/** cmap 表：单个 format 12 subtable（platform 3 / encoding 10，覆盖含 BMP 外的全部 Unicode） */
function buildCmapTable(codeToGid: Map<number, number>): Uint8Array {
  const groups = groupContiguous(codeToGid);
  const subtableLength = 16 + groups.length * 12;
  const bytes = new Uint8Array(4 + 8 + subtableLength);
  const view = new DataView(bytes.buffer);

  view.setUint16(0, 0); // version
  view.setUint16(2, 1); // numTables
  view.setUint16(4, 3); // platformID: Windows
  view.setUint16(6, 10); // encodingID: UCS-4
  view.setUint32(8, 12); // subtable offset

  let offset = 12;
  view.setUint16(offset, 12); // format 12
  view.setUint16(offset + 2, 0); // reserved
  view.setUint32(offset + 4, subtableLength);
  view.setUint32(offset + 8, 0); // language
  view.setUint32(offset + 12, groups.length);
  offset += 16;

  for (const group of groups) {
    view.setUint32(offset, group.start);
    view.setUint32(offset + 4, group.end);
    view.setUint32(offset + 8, group.startGid);
    offset += 12;
  }

  return bytes;
}

function computeTableChecksum(data: Uint8Array): number {
  let sum = 0;
  const fullWords = Math.floor(data.length / 4);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  for (let index = 0; index < fullWords; index += 1) {
    sum = (sum + view.getUint32(index * 4)) >>> 0;
  }

  const remaining = data.length % 4;
  if (remaining > 0) {
    let tail = 0;
    for (let index = 0; index < remaining; index += 1) {
      tail |= data[fullWords * 4 + index] << (24 - index * 8);
    }
    sum = (sum + (tail >>> 0)) >>> 0;
  }

  return sum;
}

/** 按 sfnt 规范重新序列化：表按 tag 排序、4 字节对齐、逐表 checksum */
function repackSfnt(tables: Map<string, Uint8Array>): Uint8Array {
  const tags = Array.from(tables.keys()).sort();
  const numTables = tags.length;

  let dataOffset = 12 + numTables * 16;
  const layout = tags.map((tag) => {
    const data = tables.get(tag) as Uint8Array;
    const record = { tag, data, offset: dataOffset, length: data.length };
    dataOffset += (data.length + 3) & ~3;
    return record;
  });

  const bytes = new Uint8Array(dataOffset);
  const view = new DataView(bytes.buffer);
  const maxPower = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** maxPower * 16;

  view.setUint32(0, 0x00010000); // sfnt version: TrueType outlines
  view.setUint16(4, numTables);
  view.setUint16(6, searchRange);
  view.setUint16(8, maxPower);
  view.setUint16(10, numTables * 16 - searchRange);

  let recordOffset = 12;
  for (const record of layout) {
    for (let index = 0; index < 4; index += 1) {
      bytes[recordOffset + index] = record.tag.charCodeAt(index);
    }
    view.setUint32(recordOffset + 4, computeTableChecksum(record.data));
    view.setUint32(recordOffset + 8, record.offset);
    view.setUint32(recordOffset + 12, record.length);
    bytes.set(record.data, record.offset);
    recordOffset += 16;
  }

  return bytes;
}

export function subsetFont(buffer: ArrayBuffer, codePoints: Set<number>): Uint8Array {
  const src = new Uint8Array(buffer);
  const view = new DataView(src.buffer, src.byteOffset, src.byteLength);
  const font = fontkit.create(src as unknown as Buffer) as unknown as FontkitFont;
  const tables = parseSfntTables(src);

  const head = tables.get('head');
  const maxp = tables.get('maxp');
  const hhea = tables.get('hhea');
  const loca = tables.get('loca');
  const glyf = tables.get('glyf');
  const hmtx = tables.get('hmtx');
  const name = tables.get('name');
  if (!head || !maxp || !hhea || !loca || !glyf || !hmtx || !name) {
    throw new Error('font-subset-missing-required-table');
  }

  const isLongLoca = view.getInt16(head.offset + 50) === 1;
  const numHMetrics = view.getUint16(hhea.offset + 34);
  const readLocaEntry = (index: number) =>
    isLongLoca
      ? view.getUint32(loca.offset + index * 4)
      : view.getUint16(loca.offset + index * 2) * 2;
  const readAdvance = (gid: number) =>
    view.getUint16(hmtx.offset + Math.min(gid, numHMetrics - 1) * 4);
  const readLeftSideBearing = (gid: number) =>
    gid < numHMetrics
      ? view.getInt16(hmtx.offset + gid * 4 + 2)
      : view.getInt16(hmtx.offset + numHMetrics * 4 + (gid - numHMetrics) * 2);

  const codeToOldGid = new Map<number, number>();
  for (const codePoint of Array.from(codePoints)) {
    const glyph = font.glyphForCodePoint(codePoint);
    if (glyph) {
      codeToOldGid.set(codePoint, glyph.id);
    }
  }

  // GID 0（.notdef）必须保留；其余按用到的字形升序重新编号
  const usedOldGids = Array.from(new Set<number>([0, ...Array.from(codeToOldGid.values())])).sort(
    (left, right) => left - right,
  );
  const oldToNewGid = new Map<number, number>(usedOldGids.map((oldGid, newGid) => [oldGid, newGid]));
  const newNumGlyphs = usedOldGids.length;

  // 重建 glyf / loca（long 格式），字形字节原样搬运
  const glyphParts: Uint8Array[] = [];
  const newLocaOffsets: number[] = [0];
  let glyfCursor = 0;
  for (const oldGid of usedOldGids) {
    const start = readLocaEntry(oldGid);
    const end = readLocaEntry(oldGid + 1);
    const glyphBytes = src.subarray(glyf.offset + start, glyf.offset + end);
    glyphParts.push(glyphBytes);
    glyfCursor += glyphBytes.length;
    if (glyfCursor % 2 !== 0) {
      glyphParts.push(new Uint8Array(1));
      glyfCursor += 1;
    }
    newLocaOffsets.push(glyfCursor);
  }
  const newGlyf = mergeUint8Arrays(glyphParts);
  const newLoca = new Uint8Array(newLocaOffsets.length * 4);
  const locaView = new DataView(newLoca.buffer);
  newLocaOffsets.forEach((value, index) => locaView.setUint32(index * 4, value));

  // 重建 hmtx：每个新字形都写入 (advanceWidth, lsb)，numberOfHMetrics = newNumGlyphs
  const newHmtx = new Uint8Array(newNumGlyphs * 4);
  const hmtxView = new DataView(newHmtx.buffer);
  usedOldGids.forEach((oldGid, newGid) => {
    hmtxView.setUint16(newGid * 4, readAdvance(oldGid));
    hmtxView.setInt16(newGid * 4 + 2, readLeftSideBearing(oldGid));
  });

  const newMaxp = src.slice(maxp.offset, maxp.offset + maxp.length);
  new DataView(newMaxp.buffer).setUint16(4, newNumGlyphs);

  const newHhea = src.slice(hhea.offset, hhea.offset + hhea.length);
  new DataView(newHhea.buffer).setUint16(34, newNumGlyphs);

  const newHead = src.slice(head.offset, head.offset + head.length);
  new DataView(newHead.buffer).setUint32(8, 0); // checkSumAdjustment：整表校验，置 0

  const newName = src.slice(name.offset, name.offset + name.length);

  // post 表：pdf-lib 的 FontDescriptor 需要 italicAngle。取原表 header 32 字节并降为
  // version 3.0（丢弃与新 GID 不匹配的 glyph names，保留 italicAngle / underline 等）。
  const post = tables.get('post');
  const newPost = post
    ? src.slice(post.offset, post.offset + 32)
    : new Uint8Array(32);
  new DataView(newPost.buffer).setUint32(0, 0x00030000);

  const cmapCodeToNew = new Map<number, number>();
  for (const [codePoint, oldGid] of Array.from(codeToOldGid.entries())) {
    const newGid = oldToNewGid.get(oldGid);
    if (newGid !== undefined) {
      cmapCodeToNew.set(codePoint, newGid);
    }
  }

  return repackSfnt(
    new Map<string, Uint8Array>([
      ['cmap', buildCmapTable(cmapCodeToNew)],
      ['glyf', newGlyf],
      ['head', newHead],
      ['hhea', newHhea],
      ['hmtx', newHmtx],
      ['loca', newLoca],
      ['maxp', newMaxp],
      ['name', newName],
      ['post', newPost],
    ]),
  );
}
