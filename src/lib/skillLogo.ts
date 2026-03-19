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
};

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').trim();
}

export function resolveSkillLogo(name: string): SkillLogoMeta | undefined {
  const normalized = normalizeSkillName(name);

  // 先查别名
  const slug = ALIAS_MAP[normalized] || normalized;
  const icon = ICON_DATA[slug];

  if (!icon) return undefined;

  return {
    color: `#${icon.hex}`,
    svgPath: icon.path,
  };
}
