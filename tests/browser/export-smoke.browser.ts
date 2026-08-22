import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const FIXTURE_PATH = path.join(REPO_ROOT, 'tests/fixtures/export-smoke.json');
const A4_WIDTH_CSS_PX = 794;
const A4_HEIGHT_CSS_PX = 1123;
const CSS_PX_TO_PDF_POINT = 72 / 96;
const PAGE_GAP_CSS_PX = 16;

function runCli(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('bun', ['scripts/export-resume.ts', ...args], {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    let errorOutput = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => { output += chunk; });
    child.stderr.on('data', (chunk: string) => { errorOutput += chunk; });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Resume CLI exited with ${code}\n${output}${errorOutput}`));
    });
  });
}

function readPngDimensions(bytes: Buffer) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.subarray(0, pngSignature.length)).toEqual(pngSignature);

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

test('exports matching A4 PDF pages and a gap-free continuous PNG', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(180_000);
  expect(baseURL).toBeTruthy();

  const pdfPath = testInfo.outputPath('resume-smoke.pdf');
  const pngPath = testInfo.outputPath('resume-smoke.png');
  const builderUrl = new URL('/builder/', baseURL).toString();

  await runCli([FIXTURE_PATH, '--format', 'pdf', '--output', pdfPath, '--url', builderUrl]);
  await runCli([FIXTURE_PATH, '--format', 'png', '--output', pngPath, '--url', builderUrl]);

  await page.addInitScript(() => window.localStorage.setItem('i18nextLng', 'en'));
  await page.goto('/builder/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Raw', exact: true }).click();
  await page.locator('input[accept=".json,.yaml,.yml,.md,.markdown"]').setInputFiles(FIXTURE_PATH);
  await expect(page.locator('textarea')).toContainText('Lin Chen');

  const preview = page.locator('#resume-preview');
  await expect(preview).toBeVisible();

  const pdf = await PDFDocument.load(await readFile(pdfPath));
  const pages = pdf.getPages();
  expect(pages.length).toBeGreaterThan(1);
  for (const pdfPage of pages) {
    const size = pdfPage.getSize();
    expect(size.width).toBeCloseTo(A4_WIDTH_CSS_PX * CSS_PX_TO_PDF_POINT, 5);
    expect(size.height).toBeCloseTo(A4_HEIGHT_CSS_PX * CSS_PX_TO_PDF_POINT, 5);
  }
  const expectedPreviewSize = {
    width: A4_WIDTH_CSS_PX,
    height: pages.length * A4_HEIGHT_CSS_PX + (pages.length - 1) * PAGE_GAP_CSS_PX,
  };
  await expect.poll(async () => preview.evaluate((element) => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).toEqual(expectedPreviewSize);
  const previewSize = expectedPreviewSize;

  const pngBytes = await readFile(pngPath);
  const pngSize = readPngDimensions(pngBytes);
  expect(pngSize.width).toBe(A4_WIDTH_CSS_PX * 2);
  expect(pngSize.height).toBeGreaterThan(0);
  expect(pngSize.height).toBeLessThan(previewSize.height * 2);

  const transparentRows = await page.evaluate(async ({ dataUrl }) => {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const rows: number[] = [];
    for (let y = 0; y < canvas.height; y += 1) {
      let hasVisiblePixel = false;
      for (let x = 0; x < canvas.width; x += 8) {
        if (pixels[(y * canvas.width + x) * 4 + 3] !== 0) {
          hasVisiblePixel = true;
          break;
        }
      }
      if (!hasVisiblePixel) rows.push(y);
    }
    return rows;
  }, { dataUrl: `data:image/png;base64,${pngBytes.toString('base64')}` });
  expect(transparentRows).toEqual([]);
});
