#!/usr/bin/env bun

import { spawn, type ChildProcess } from 'node:child_process';
import { access, mkdir, readFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { parseResumeCliArgs, RESUME_CLI_USAGE } from '../src/lib/resumeCli';

const HOST = '127.0.0.1';
const SERVER_START_TIMEOUT_MS = 60_000;
const EXPORT_TIMEOUT_MS = 90_000;

function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not allocate a local port'));
        return;
      }
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function waitForBuilder(url: string, process: ChildProcess) {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Resume Pure exited before the builder was ready (${process.exitCode})`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // The local Next.js server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Resume Pure did not start within ${SERVER_START_TIMEOUT_MS / 1000} seconds`);
}

async function startResumePure() {
  const port = await findAvailablePort();
  const builderUrl = `http://${HOST}:${port}/builder/`;
  const nextCli = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [
    nextCli,
    'dev',
    '--webpack',
    '--hostname',
    HOST,
    '--port',
    String(port),
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  let stderr = '';
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', (chunk: string) => {
    stderr = `${stderr}${chunk}`.slice(-4_000);
  });

  try {
    await waitForBuilder(builderUrl, child);
    return {
      builderUrl,
      stop: () => child.kill('SIGTERM'),
    };
  } catch (error) {
    child.kill('SIGTERM');
    if (stderr.trim()) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}\n${stderr.trim()}`);
    }
    throw error;
  }
}

async function run() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log(RESUME_CLI_USAGE);
    return;
  }

  const options = parseResumeCliArgs(rawArgs);
  await access(options.inputPath);
  const resume = JSON.parse(await readFile(options.inputPath, 'utf8')) as {
    personalInfo?: { name?: string };
  };
  await mkdir(path.dirname(options.outputPath), { recursive: true });

  const localServer = options.url ? null : await startResumePure();
  const builderUrl = options.url || localServer?.builderUrl;
  if (!builderUrl) throw new Error('No Resume Pure builder URL is available');
  if (options.allowRemote) {
    console.warn(`Loading resume data into the remote builder at ${builderUrl}`);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(EXPORT_TIMEOUT_MS);
    await page.addInitScript(() => {
      window.localStorage.setItem('i18nextLng', 'en');
    });
    await page.goto(builderUrl, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Raw', exact: true }).click();
    await page.locator('input[accept=".json,.yaml,.yml,.md,.markdown"]').setInputFiles(options.inputPath);

    const expectedName = resume.personalInfo?.name;
    if (expectedName) {
      await page.waitForFunction((name) => {
        const editor = document.querySelector('textarea');
        return editor instanceof HTMLTextAreaElement && editor.value.includes(String(name));
      }, expectedName);
    }

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: options.format.toUpperCase(), exact: true }).click();
    const download = await downloadPromise;
    await download.saveAs(options.outputPath);
    await context.close();
  } finally {
    await browser.close();
    localServer?.stop();
  }

  console.log(`Exported ${options.format.toUpperCase()} to ${options.outputPath}`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Resume export failed: ${message}`);
  process.exitCode = 1;
});
