import ICON_DATA from './iconData';
import {
  CUSTOM_SKILL_LOGOS,
  type SkillLogoMeta,
} from './skillLogoData';

export type { SkillLogoMeta, SkillLogoPath, SkillLogoViewBox } from './skillLogoData';

const SIMPLE_ICON_VIEW_BOX = {
  x: 0,
  y: 0,
  width: 24,
  height: 24,
};

// 名称 → slug 别名映射
const ALIAS_MAP: Record<string, string> = {
  react: 'react',
  reactjs: 'react',
  'react.js': 'react',
  nextjs: 'nextdotjs',
  'next.js': 'nextdotjs',
  next: 'nextdotjs',
  vue: 'vuedotjs',
  'vue.js': 'vuedotjs',
  vuejs: 'vuedotjs',
  nuxt: 'nuxtdotjs',
  'nuxt.js': 'nuxtdotjs',
  nuxtjs: 'nuxtdotjs',
  node: 'nodedotjs',
  'node.js': 'nodedotjs',
  nodejs: 'nodedotjs',
  js: 'javascript',
  ts: 'typescript',
  golang: 'go',
  postgres: 'postgresql',
  mongo: 'mongodb',
  tailwind: 'tailwindcss',
  k8s: 'kubernetes',
  aws: 'amazonwebservices',
  gcp: 'googlecloud',
  azure: 'microsoftazure',
  'c++': 'cplusplus',
  cpp: 'cplusplus',
  'c#': 'csharp',
  dotnet: 'csharp',
  '.net': 'csharp',
  scss: 'sass',
  tf: 'terraform',
  pw: 'playwright',
  githubactions: 'githubactions',
  'ci/cd': 'githubactions',
  wasm: 'webassembly',
  webassembly: 'webassembly',
  rollup: 'rollupdotjs',
  'rollup.js': 'rollupdotjs',
  ios: 'apple',
  macos: 'apple',
  kafka: 'apachekafka',
  mq: 'rabbitmq',
  'styled-components': 'styledcomponents',
  ue: 'unrealengine',
  unrealengine: 'unrealengine',
  godot: 'godotengine',
  godotengine: 'godotengine',
  'unity3d': 'unity',
  'egui': 'rust',
  'steamworkssdk': 'steam',
  'bash3.2+': 'gnubash',
  'claudecode': 'claude',
  'suimove': 'sui',
  'vdf': 'steam',
  'cdp': 'googlechrome',
  'agent/mcp': 'mcp',
  'agent/mcp/toolcalling': 'mcp',
  'agent/mcp工作流': 'mcp',
  'canvaskit': 'webassembly',
  'ci/release': 'githubactions',
  'ci/发布': 'githubactions',
  'giscus': 'github',
};

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').trim();
}

function canUseFuzzyMatch(input: string, candidate: string): boolean {
  return input.length >= 5 && candidate.length >= 5;
}

function resolveLogoSlug(slug: string): SkillLogoMeta | undefined {
  const customLogo = CUSTOM_SKILL_LOGOS[slug];
  if (customLogo) return customLogo;

  const icon = ICON_DATA[slug];
  if (!icon) return undefined;

  return {
    slug,
    viewBox: SIMPLE_ICON_VIEW_BOX,
    paths: [{
      d: icon.path,
      fill: `#${icon.hex}`,
    }],
  };
}

function resolveExactLogo(name: string) {
  const normalized = normalizeSkillName(name);
  const slug = ALIAS_MAP[normalized] || normalized;
  return resolveLogoSlug(slug);
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export function resolveSkillLogo(name: string): SkillLogoMeta | undefined {
  const normalized = normalizeSkillName(name);

  const slug = ALIAS_MAP[normalized] || normalized;
  let logo = resolveLogoSlug(slug);

  if (!logo && name.includes('/')) {
    const leadingTechnology = name.split('/', 1)[0].trim();
    logo = resolveExactLogo(leadingTechnology);
  }

  if (!logo) {
    const candidates = [
      ...Object.keys(ICON_DATA),
      ...Object.keys(CUSTOM_SKILL_LOGOS),
      ...Object.keys(ALIAS_MAP),
    ];
    let bestCandidate = '';
    let minScore = Infinity;

    for (const candidate of candidates) {
      if (canUseFuzzyMatch(normalized, candidate)) {
        if (normalized.includes(candidate) || candidate.includes(normalized)) {
          const score = Math.abs(normalized.length - candidate.length);
          if (score < minScore) {
            minScore = score;
            bestCandidate = candidate;
          }
        }
      }

      if (canUseFuzzyMatch(normalized, candidate) && normalized[0] === candidate[0]) {
        const dist = levenshteinDistance(normalized, candidate);
        const maxLength = Math.max(normalized.length, candidate.length);
        if (dist <= 2 && dist / maxLength <= 0.2 && dist < minScore) {
          minScore = dist;
          bestCandidate = candidate;
        }
      }
    }

    if (bestCandidate) {
      const mappedSlug = ALIAS_MAP[bestCandidate] || bestCandidate;
      logo = resolveLogoSlug(mappedSlug);
    }
  }

  return logo;
}
