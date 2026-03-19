import ICON_DATA from './iconData';

interface SkillLogoMeta {
  color: string;
  svgPath: string;
}

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
  'tailwind css': 'tailwindcss',
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
  'github actions': 'githubactions',
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
  'unreal engine': 'unrealengine',
  godot: 'godotengine',
  'godot engine': 'godotengine',
  'unity3d': 'unity',
  'egui': 'rust',
  'steamworkssdk': 'steam',
  'steamworks': 'steam',
};

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').trim();
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

  // 1. 先查别名或精准命中
  const slug = ALIAS_MAP[normalized] || normalized;
  let icon = ICON_DATA[slug];

  // 2. 如果未精确命中，启动智能模糊搜索/容错（错字兜底 / 包含版本号兜底等）
  if (!icon) {
    const candidates = [...Object.keys(ICON_DATA), ...Object.keys(ALIAS_MAP)];
    let bestCandidate = '';
    let minScore = Infinity;

    for (const candidate of candidates) {
      // a. 包含关系：例如输入 "Vuejs3" 或 "React Native" 或 "Spring Boot" 这种长尾版，包含了基座库 Vue/React/Spring
      // 避免字母太少（如 c）被所有词包含而引发重大误伤
      if (candidate.length >= 3 && normalized.length >= 3) {
        if (normalized.includes(candidate) || candidate.includes(normalized)) {
          // 偏差值即两者长度差距，越小说明越匹配
          const score = Math.abs(normalized.length - candidate.length);
          if (score < minScore) {
            minScore = score;
            bestCandidate = candidate;
          }
        }
      }

      // b. Levenshtein 编辑距离算法：如用户打错： "typscript" (漏e) 或 "javascirpt" (打反)
      if (normalized.length >= 4) {
        const dist = levenshteinDistance(normalized, candidate);
        // 允许最高容忍 2 个字宽的拼写错误，并且分数比包含关系更好才拿走
        if (dist <= 2 && dist < minScore) {
          minScore = dist;
          bestCandidate = candidate;
        }
      }
    }

    if (bestCandidate) {
      const mappedSlug = ALIAS_MAP[bestCandidate] || bestCandidate;
      icon = ICON_DATA[mappedSlug];
    }
  }

  if (!icon) return undefined;

  return {
    color: `#${icon.hex}`,
    svgPath: icon.path,
  };
}
