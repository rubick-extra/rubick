// lnk-parser.js
const fs = require('fs');

/**
 * 读取以指定编码并以 null 结尾的字符串（ANSI 或 UTF-16LE）
 * @param {Buffer} buf
 * @param {number} offset - 起始偏移
 * @param {'ansi'|'utf16'} encoding
 * @returns {{str:string, nextOffset:number}}
 */
function readNullTerminated(buf, offset, encoding) {
  if (encoding === 'utf16') {
    // 找到两个字节的 0x0000
    let i = offset;
    while (i + 1 < buf.length) {
      if (buf.readUInt16LE(i) === 0) break;
      i += 2;
    }
    const str = buf.toString('utf16le', offset, i);
    return { str, nextOffset: i + 2 };
  } else {
    // ansi (单字节)
    let i = offset;
    while (i < buf.length && buf[i] !== 0) i++;
    const str = buf.toString('binary', offset, i); // binary preserves raw bytes; we'll convert to utf8
    // convert from binary to utf8 safely:
    const utf8 = Buffer.from(str, 'binary').toString('utf8');
    return { str: utf8, nextOffset: i + 1 };
  }
}

/**
 * 从 .lnk 的 Buffer 中解析目标路径（尽量）
 * @param {Buffer} buf
 * @returns {string|null} 返回解析到的路径或 null（未找到）
 */
function parseLnkTarget(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 76) return null;

  // Shell Link Header 固定 4 bytes header size (should be 0x4C = 76)
  const headerSize = buf.readUInt32LE(0);
  if (headerSize < 0x4C) return null; // 非标准 .lnk

  // LinkFlags 在 offset 20 (0x14) 处的 4 bytes
  const LINKFLAGS_OFFSET = 0x14;
  const linkFlags = buf.readUInt32LE(LINKFLAGS_OFFSET);
  const HasLinkTargetIDList = !!(linkFlags & 0x00000001);
  const HasLinkInfo = !!(linkFlags & 0x00000002);
  const HasRelativePath = !!(linkFlags & 0x00000008);
  const IsUnicode = !!(linkFlags & 0x00000080);

  // 计算 LinkInfo 的起始偏移： headerSize（一般 76） + 可选的 LinkTargetIDList
  let offset = headerSize;

  if (HasLinkTargetIDList) {
    // IDListSize: 2 bytes (UInt16) at current offset，随后是 IDListSize bytes
    if (offset + 2 > buf.length) return null;
    const idListSize = buf.readUInt16LE(offset);
    offset += 2 + idListSize;
    if (offset > buf.length) return null;
  }

  // 现在 offset 指向可能的 LinkInfo 开头
  if (HasLinkInfo && offset + 4 <= buf.length) {
    const linkInfoSize = buf.readUInt32LE(offset);
    if (linkInfoSize > 0 && offset + linkInfoSize <= buf.length) {
      const linkInfoHeaderSize = buf.readUInt32LE(offset + 4);
      // LinkInfo header fields
      // Offsets inside LinkInfo (relative to LinkInfo start)
      // LinkInfoFlags @ offset+8
      // VolumeIDOffset @ offset+12
      // LocalBasePathOffset @ offset+16
      // CommonNetworkRelativeLinkOffset @ offset+20
      // CommonPathSuffixOffset @ offset+24
      // 如果 header size >= 0x24 (36)，会有 LocalBasePathOffsetUnicode (@ offset+... usually +0x1C)
      const localBasePathOffset = buf.readUInt32LE(offset + 16);
      let localBasePath: any = null;
      if (localBasePathOffset !== 0) {
        const abs = offset + localBasePathOffset;
        // LocalBasePath 通常是 ANSI（single-byte），以 null 结尾
        // 但若有 Unicode 版本，我们优先使用 Unicode
        try {
          const { str } = readNullTerminated(buf, abs, 'ansi');
          localBasePath = str;
        } catch (e) {
          localBasePath = null;
        }
      }

      let localBasePathUnicode: any = null;
      // LocalBasePathOffsetUnicode 在 LinkInfo header 中的相对位置（如果 header >= 0x24）
      if (linkInfoHeaderSize >= 0x24) {
        // LocalBasePathOffsetUnicode 位于 LinkInfo start + 0x1C (28)
        const localBasePathOffsetUnicode = buf.readUInt32LE(offset + 0x1C);
        if (localBasePathOffsetUnicode !== 0) {
          const abs = offset + localBasePathOffsetUnicode;
          try {
            const { str } = readNullTerminated(buf, abs, 'utf16');
            localBasePathUnicode = str;
          } catch (e) {
            localBasePathUnicode = null;
          }
        }
      }

      // 如果有 Unicode 版本优先返回
      if (localBasePathUnicode && localBasePathUnicode.length > 0) return localBasePathUnicode;
      if (localBasePath && localBasePath.length > 0 && localBasePath !== 'C:\\Users\\') return localBasePath;

      // 如果 LinkInfo 中没有 LocalBasePath，再尝试 LinkInfo 的 CommonPathSuffix (offset+24)
      try {
        const commonPathSuffixOffset = buf.readUInt32LE(offset + 24);
        if (commonPathSuffixOffset) {
          const abs = offset + commonPathSuffixOffset;
          const { str } = readNullTerminated(buf, abs, 'ansi');
          if (str?.length) return localBasePath ? localBasePath + str : str;
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // 到这里 LinkInfo 解析失败或没有目标路径，尝试解析 StringData (RelativePath 等)
  // StringData 在 LinkInfo 之后（如果没有 LinkInfo，则在当前 offset）
  // StringData 字段顺序（如果对应 flag 为 true）：NAME_STRING, RELATIVE_PATH, WORKING_DIR, COMMAND_LINE_ARGUMENTS, ICON_LOCATION
  // 编码由 IsUnicode 决定：如果 IsUnicode 则 UTF-16LE 否则 ANSI
  let strOffset = offset;
  // 如果有 LinkInfo 并且我们刚才读取了 linkInfoSize，就把 strOffset 推到 LinkInfo 之后
  if (HasLinkInfo && offset + 4 <= buf.length) {
    try {
      const maybeLinkInfoSize = buf.readUInt32LE(offset);
      if (maybeLinkInfoSize > 0) {
        strOffset = offset + maybeLinkInfoSize;
      }
    } catch (e) {
      // 忽略
    }
  }

  const enc = IsUnicode ? 'utf16' : 'ansi';

  // helper: 依次按 flags 读字符串，返回第 n 个存在的字符串（或 null）
  const strings: any = {};
  const fieldOrder = [
    { flagMask: 0x00000004, key: 'NameString' },         // HasName
    { flagMask: 0x00000008, key: 'RelativePath' },       // HasRelativePath
    { flagMask: 0x00000010, key: 'WorkingDir' },         // HasWorkingDir
    { flagMask: 0x00000020, key: 'CommandLineArguments' }, // HasArguments
    { flagMask: 0x00000040, key: 'IconLocation' },       // HasIconLocation
  ];

  for (const f of fieldOrder) {
    if (linkFlags & f.flagMask) {
      if (strOffset >= buf.length) break;
      const res = readNullTerminated(buf, strOffset, enc);
      strings[f.key] = res.str;
      strOffset = res.nextOffset;
    }
  }

  if (strings.RelativePath?.length) return strings.RelativePath;

  // 最后尝试一些启发式方法：寻找 ASCII 的 ":\\" （如 C:\）或 unicode "C:\0"（utf16）。从头到尾搜索第一个看起来像路径的子串
  const ascii = buf.toString('binary');
  const pathMatch = ascii.match(/[A-Za-z]:\\\\[^\\\r\n]*/);

  if (pathMatch) return pathMatch[0].replace(/\\\\/g, '\\');

  // utf16 scan
  try {
    const u16 = buf.toString('utf16le');
    const m = u16.match(/[A-Za-z]:\\[^\\\r\n]*/);
    if (m) return m[0];
  } catch (e) {}

  // 未找到
  return null;
}

export function resolveLnk(path: string) {
  const buffer = fs.readFileSync(path);
  return  parseLnkTarget(buffer);
}
