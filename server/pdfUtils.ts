import zlib from 'node:zlib';

/**
 * Cleanly unescapes PDF string literals (e.g. \(, \), \\, octal codes).
 */
function unescapePdfString(str: string): string {
  return str
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Extracts searchable text layer from a PDF Buffer without external packages,
 * using Node.js built-in zlib to decompress FlateDecode streams.
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const binary = buffer.toString('latin1');
  const textTokens: string[] = [];

  // Match all PDF streams: stream ... endstream
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binary)) !== null) {
    const rawStream = Buffer.from(match[1], 'latin1');
    const dictHeader = binary.slice(Math.max(0, match.index - 400), match.index);

    let decompressed = '';
    if (dictHeader.includes('/FlateDecode')) {
      try {
        decompressed = zlib.inflateSync(rawStream).toString('latin1');
      } catch {
        try {
          decompressed = zlib.unzipSync(rawStream).toString('latin1');
        } catch {
          decompressed = rawStream.toString('latin1');
        }
      }
    } else {
      decompressed = rawStream.toString('latin1');
    }

    // Match text blocks: BT ... ET
    const btRegex = /BT([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(decompressed)) !== null) {
      const block = btMatch[1];

      // 1. Text strings: (Hello World) Tj or ' or "
      const tjRegex = /\(((?:[^)\\]|\\.)*)\)\s*(?:Tj|'|")/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const text = unescapePdfString(tjMatch[1]).trim();
        if (text) textTokens.push(text);
      }

      // 2. Text arrays: [(Hello) 10 (World)] TJ
      const tjArrRegex = /\[([\s\S]*?)\]\s*TJ/g;
      let tjArrMatch: RegExpExecArray | null;
      while ((tjArrMatch = tjArrRegex.exec(block)) !== null) {
        const innerArray = tjArrMatch[1];
        const innerStrRegex = /\(((?:[^)\\]|\\.)*)\)/g;
        let innerMatch: RegExpExecArray | null;
        let lineParts: string[] = [];
        while ((innerMatch = innerStrRegex.exec(innerArray)) !== null) {
          const part = unescapePdfString(innerMatch[1]).trim();
          if (part) lineParts.push(part);
        }
        if (lineParts.length > 0) {
          textTokens.push(lineParts.join(' '));
        }
      }

      // 3. Hex strings: <48656c6c6f> Tj
      const hexRegex = /<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")/g;
      let hexMatch: RegExpExecArray | null;
      while ((hexMatch = hexRegex.exec(block)) !== null) {
        const hex = hexMatch[1].replace(/\s+/g, '');
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          const byte = parseInt(hex.slice(i, i + 2), 16);
          if (!isNaN(byte) && byte >= 32 && byte <= 255) {
            decoded += String.fromCharCode(byte);
          }
        }
        if (decoded.trim()) textTokens.push(decoded.trim());
      }
    }
  }

  const result = textTokens.join(' ').replace(/\s+/g, ' ').trim();
  if (!result || result.length < 5) {
    return '[Documento PDF sem camada de texto pesquisável / digitalizado exclusivamente como imagem sem OCR]';
  }
  return result;
}
