import { describe, expect, it } from 'vitest';
import { parseResumeCliArgs } from './resumeCli';

describe('resume export CLI arguments', () => {
  it('resolves a PDF export command from the working directory', () => {
    expect(parseResumeCliArgs([
      './resume.json',
      '--format',
      'pdf',
      '--output',
      './exports/resume.pdf',
    ], '/workspace')).toEqual({
      inputPath: '/workspace/resume.json',
      format: 'pdf',
      outputPath: '/workspace/exports/resume.pdf',
      language: 'en',
      url: undefined,
    });
  });

  it('accepts short PNG options and an existing builder URL', () => {
    expect(parseResumeCliArgs([
      'resume.json',
      '-f',
      'png',
      '-o',
      'resume.png',
      '--url',
      'http://127.0.0.1:3000/builder/',
    ], '/workspace')).toEqual({
      inputPath: '/workspace/resume.json',
      format: 'png',
      outputPath: '/workspace/resume.png',
      language: 'en',
      url: 'http://127.0.0.1:3000/builder/',
    });
  });

  it('accepts an explicit export language', () => {
    expect(parseResumeCliArgs([
      'resume.json',
      '--format',
      'pdf',
      '--output',
      'resume.pdf',
      '--language',
      'zh',
    ], '/workspace')).toMatchObject({
      language: 'zh',
    });
  });

  it('requires explicit consent before sending resume data to a remote builder', () => {
    expect(() => parseResumeCliArgs([
      'resume.json',
      '--format',
      'pdf',
      '--output',
      'resume.pdf',
      '--url',
      'https://resume.example.com/builder/',
    ], '/workspace')).toThrow('--allow-remote is required');
  });

  it('accepts a remote builder when the user opts in', () => {
    expect(parseResumeCliArgs([
      'resume.json',
      '--format',
      'pdf',
      '--output',
      'resume.pdf',
      '--url',
      'https://resume.example.com/builder/',
      '--allow-remote',
    ], '/workspace')).toMatchObject({
      url: 'https://resume.example.com/builder/',
      allowRemote: true,
    });
  });

  it('rejects unsupported formats', () => {
    expect(() => parseResumeCliArgs([
      'resume.json',
      '--format',
      'svg',
      '--output',
      'resume.svg',
    ])).toThrow('--format must be pdf or png');
  });

  it('rejects unsupported languages', () => {
    expect(() => parseResumeCliArgs([
      'resume.json',
      '--format',
      'pdf',
      '--output',
      'resume.pdf',
      '--language',
      'fr',
    ])).toThrow('--language must be zh, en, zh-TW, or ja');
  });

  it('rejects an output extension that does not match the format', () => {
    expect(() => parseResumeCliArgs([
      'resume.json',
      '--format',
      'pdf',
      '--output',
      'resume.png',
    ])).toThrow('Output file must end with .pdf');
  });
});
