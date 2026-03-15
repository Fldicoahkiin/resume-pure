export interface SkillLogoMeta {
  src: string;
  color: string;
}

interface SkillLogoConfig {
  slug: string;
  color: string;
}

const SIMPLE_ICONS_BASE_URL = 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons';

const SKILL_LOGO_MAP: Record<string, SkillLogoConfig> = {
  react: { slug: 'react', color: '#61DAFB' },
  'reactjs': { slug: 'react', color: '#61DAFB' },
  nextjs: { slug: 'nextdotjs', color: '#111827' },
  'next.js': { slug: 'nextdotjs', color: '#111827' },
  javascript: { slug: 'javascript', color: '#F7DF1E' },
  js: { slug: 'javascript', color: '#F7DF1E' },
  typescript: { slug: 'typescript', color: '#3178C6' },
  ts: { slug: 'typescript', color: '#3178C6' },
  vue: { slug: 'vuedotjs', color: '#42B883' },
  'vue.js': { slug: 'vuedotjs', color: '#42B883' },
  nuxt: { slug: 'nuxtdotjs', color: '#00DC82' },
  'nuxt.js': { slug: 'nuxtdotjs', color: '#00DC82' },
  node: { slug: 'nodedotjs', color: '#5FA04E' },
  'node.js': { slug: 'nodedotjs', color: '#5FA04E' },
  express: { slug: 'express', color: '#111827' },
  nestjs: { slug: 'nestjs', color: '#E0234E' },
  python: { slug: 'python', color: '#3776AB' },
  go: { slug: 'go', color: '#00ADD8' },
  golang: { slug: 'go', color: '#00ADD8' },
  rust: { slug: 'rust', color: '#000000' },
  docker: { slug: 'docker', color: '#2496ED' },
  kubernetes: { slug: 'kubernetes', color: '#326CE5' },
  postgres: { slug: 'postgresql', color: '#4169E1' },
  postgresql: { slug: 'postgresql', color: '#4169E1' },
  mysql: { slug: 'mysql', color: '#4479A1' },
  mongodb: { slug: 'mongodb', color: '#47A248' },
  redis: { slug: 'redis', color: '#DC382D' },
  graphql: { slug: 'graphql', color: '#E10098' },
  tailwind: { slug: 'tailwindcss', color: '#06B6D4' },
  tailwindcss: { slug: 'tailwindcss', color: '#06B6D4' },
  git: { slug: 'git', color: '#F05032' },
  github: { slug: 'github', color: '#181717' },
  linux: { slug: 'linux', color: '#FCC624' },
  nginx: { slug: 'nginx', color: '#009639' },
  aws: { slug: 'amazonwebservices', color: '#FF9900' },
  vercel: { slug: 'vercel', color: '#000000' },
  cloudflare: { slug: 'cloudflare', color: '#F38020' },
  pnpm: { slug: 'pnpm', color: '#F69220' },
  bun: { slug: 'bun', color: '#FBF0DF' },
  vite: { slug: 'vite', color: '#646CFF' },
  jest: { slug: 'jest', color: '#C21325' },
  playwright: { slug: 'playwright', color: '#2EAD33' },
  prisma: { slug: 'prisma', color: '#2D3748' },
  figma: { slug: 'figma', color: '#F24E1E' },
};

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '').trim();
}

export function resolveSkillLogo(name: string): SkillLogoMeta | undefined {
  const config = SKILL_LOGO_MAP[normalizeSkillName(name)];
  if (!config) {
    return undefined;
  }

  return {
    src: `${SIMPLE_ICONS_BASE_URL}/${config.slug}.svg`,
    color: config.color,
  };
}
