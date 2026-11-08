import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPdf } from '../../src/utils/pdf';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
const text = (b: Uint8Array) => Buffer.from(b).toString('latin1');

test('the file starts with a PDF 1.4 header and ends with an EOF marker', () => {
  const pdf = buildPdf(jpeg, 1240, 1754);
  assert.equal(text(pdf).startsWith('%PDF-1.4\n'), true);
  assert.equal(text(pdf).endsWith('%%EOF\n'), true);
});

test('the xref table points at each object header and every entry is 20 bytes', () => {
  const pdf = buildPdf(jpeg, 1240, 1754);
  const s = text(pdf);
  const xrefAt = Number(/startxref\n(\d+)\n/.exec(s)![1]);
  assert.equal(s.slice(xrefAt, xrefAt + 4), 'xref');
  const table = s.slice(xrefAt).split('\n');
  assert.equal(table[1], '0 6');
  for (let i = 1; i <= 5; i++) {
    const entry = table[2 + i];
    assert.equal(entry.length, 19, 'entry without the trailing newline is 19 characters');
    const offset = Number(entry.slice(0, 10));
    assert.equal(s.slice(offset, offset + `${i} 0 obj`.length), `${i} 0 obj`, `object ${i}`);
  }
});

test('the page draws the image full-bleed on A4 and the image stream declares its size and JPEG filter', () => {
  const s = text(buildPdf(jpeg, 1240, 1754));
  assert.match(s, /\/MediaBox \[0 0 595 842\]/);
  assert.match(s, /\/Width 1240 \/Height 1754/);
  assert.match(s, /\/Filter \/DCTDecode/);
  assert.match(s, /q 595 0 0 842 0 0 cm \/Im0 Do Q/);
});

test('the embedded JPEG bytes are copied unchanged', () => {
  const pdf = buildPdf(jpeg, 10, 10);
  const s = text(pdf);
  const start = s.indexOf('stream\n') + 'stream\n'.length;
  const bytes = Array.from(pdf.slice(start, start + jpeg.length));
  assert.deepEqual(bytes, Array.from(jpeg));
});
