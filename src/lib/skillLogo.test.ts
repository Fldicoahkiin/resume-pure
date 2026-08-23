import { describe, expect, it } from 'vitest';
import { parseSvgPath } from './render/svgPath';
import { resolveSkillLogo } from './skillLogo';

describe('resolveSkillLogo', () => {
  it.each([
    'Zustand',
    'Yjs',
    'Playwright',
    'MCP',
    'Walrus',
    'Hono',
    'Sui Move',
    'Bash 3.2+',
    'SVG',
    'Claude Code',
    'Agent / MCP',
    'CanvasKit',
    'CI / 发布',
    'Giscus',
    'Mermaid',
  ])('resolves the technology logo for %s', (name) => {
    const logo = resolveSkillLogo(name);

    expect(logo?.paths.length).toBeGreaterThan(0);
  });

  it.each([
    ['Sui / Walrus', 'sui'],
    ['Rust / egui', 'rust'],
    ['Hono/Cloudflare Workers', 'hono'],
    ['Steamworks SDK', 'steam'],
    ['CDP', 'googlechrome'],
    ['Agent / MCP / Tool Calling', 'mcp'],
    ['CanvasKit', 'webassembly'],
    ['CI / Release', 'githubactions'],
    ['Giscus', 'github'],
  ])('uses the leading technology for the composite label %s', (name, expectedSlug) => {
    expect(resolveSkillLogo(name)?.slug).toBe(expectedSlug);
  });

  it.each(['产品策划', '需求分析', '版本规划'])('keeps non-brand capability label %s text-only', (name) => {
    expect(resolveSkillLogo(name)).toBeUndefined();
  });

  it.each(['Zustand', 'Yjs', 'Playwright', 'MCP', 'Walrus'])('uses renderer-compatible paths for %s', (name) => {
    const logo = resolveSkillLogo(name);

    expect(() => logo?.paths.forEach((path) => parseSvgPath(path.d))).not.toThrow();
  });
});
