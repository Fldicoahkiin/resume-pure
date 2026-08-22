import path from 'node:path';

export type ResumeExportFormat = 'pdf' | 'png';

export interface ResumeCliOptions {
  inputPath: string;
  format: ResumeExportFormat;
  outputPath: string;
  url?: string;
}

export const RESUME_CLI_USAGE = `Usage:
  bun run export:resume -- <resume.json> --format <pdf|png> --output <file>

Options:
  --format, -f   Export format: pdf or png
  --output, -o   Output file path
  --url          Use an existing Resume Pure builder URL instead of starting locally
  --help, -h     Show this help

Examples:
  bun run export:resume -- ./resume.json --format pdf --output ./resume.pdf
  bun run export:resume -- ./resume.json -f png -o ./resume.png`;

function readOptionValue(args: string[], index: number, option: string) {
  const value = args[index + 1];
  if (!value || value.startsWith('-')) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

export function parseResumeCliArgs(args: string[], cwd: string = process.cwd()): ResumeCliOptions {
  let input: string | undefined;
  let format: ResumeExportFormat | undefined;
  let output: string | undefined;
  let url: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--format' || argument === '-f') {
      const value = readOptionValue(args, index, argument);
      if (value !== 'pdf' && value !== 'png') {
        throw new Error('--format must be pdf or png');
      }
      format = value;
      index += 1;
      continue;
    }

    if (argument === '--output' || argument === '-o') {
      output = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }

    if (argument === '--url') {
      url = readOptionValue(args, index, argument);
      index += 1;
      continue;
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    }

    if (input) {
      throw new Error('Only one resume JSON file can be exported at a time');
    }
    input = argument;
  }

  if (!input) throw new Error('A resume JSON file is required');
  if (!format) throw new Error('--format is required');
  if (!output) throw new Error('--output is required');

  const outputExtension = path.extname(output).toLowerCase();
  if (outputExtension !== `.${format}`) {
    throw new Error(`Output file must end with .${format}`);
  }

  if (url) {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('--url must use http or https');
    }
  }

  return {
    inputPath: path.resolve(cwd, input),
    format,
    outputPath: path.resolve(cwd, output),
    url,
  };
}
