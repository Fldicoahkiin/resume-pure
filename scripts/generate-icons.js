const fs = require('fs');
const si = require('simple-icons');
const path = require('path');

function getTopIcons() {
  // 定义高频使用的技术栈白名单
  const topSlugs = new Set([
    'javascript', 'typescript', 'python', 'go', 'rust', 'kotlin', 'swift', 'dart', 'php', 'ruby', 'cplusplus', 'c', 'lua', 'zig', 'elixir', 'haskell', 'solidity', 'webassembly', 'java', 'scala', 'clojure', 'r', 'objectivec', 'assemblyscript', 'perl', 'shell', 'bash', 'powershell', 'csharp', 'fsharp', 'ocaml', 'groovy',
    'react', 'nextdotjs', 'vuedotjs', 'angular', 'svelte', 'astro', 'remix', 'solid', 'qwik', 'preact', 'gatsby', 'emberdotjs', 'alpinejotjs', 'meteor',
    'tailwindcss', 'sass', 'styledcomponents', 'less', 'postcss', 'bootstrap', 'bulma', 'chakraui', 'materialdesign', 'antdesign', 'daisyui', 'css3', 'html5',
    'nodedotjs', 'express', 'nestjs', 'deno', 'bun', 'fastify', 'koa', 'spring', 'springboot', 'django', 'flask', 'fastapi', 'laravel', 'rubyonrails', 'dotnet', 'aspnet',
    'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'prisma', 'supabase', 'firebase', 'mariadb', 'oracle', 'microsoftsqlserver', 'cassandra', 'couchbase', 'neo4j', 'influxdb', 'elasticsearch', 'surrealdb', 'drizzle', 'sequelize', 'mongoose', 'typeorm',
    'vite', 'webpack', 'esbuild', 'rollupdotjs', 'parcel', 'gulp', 'grunt', 'babel', 'swc', 'turborepo', 'nx',
    'docker', 'kubernetes', 'nginx', 'linux', 'ubuntu', 'debian', 'centos', 'redhat', 'fedora', 'alpine', 'windows', 'macos', 'android', 'apple', 'ios', 'chrome', 'firefox', 'safari', 'edge',
    'googlecloud', 'microsoftazure', 'amazonwebservices', 'vercel', 'cloudflare', 'netlify', 'heroku', 'digitalocean', 'render', 'railway', 'flydotio', 'awsamplify', 'awslambda', 'amazonrds', 'amazons3', 'amazondynamodb', 'amazonelasticache', 'googlecomputeengine',
    'git', 'github', 'gitlab', 'bitbucket', 'gitea', 'githubactions', 'gitlabcicd', 'jenkins', 'travisci', 'circleci', 'azuredevops', 'bamboo', 'teamcity',
    'terraform', 'ansible', 'pulumi', 'chef', 'puppet', 'vagrant', 'dockercompose', 'helm', 'prometheus', 'grafana', 'datadog', 'newrelic', 'sentry', 'dynatrace', 'elk', 'splunk',
    'jest', 'vitest', 'cypress', 'playwright', 'puppeteer', 'selenium', 'mocha', 'chai', 'jasmine', 'karma', 'testinglibrary', 'storybook', 'eslint', 'prettier', 'stylelint', 'sonarcloud',
    'graphql', 'swagger', 'postman', 'insomnia', 'apollographql', 'trpc', 'grpc', 'webrtc', 'rabbitmq', 'apachekafka', 'socketdotio',
    'unity', 'unrealengine', 'godotengine', 'cocos', 'phaser', 'cryengine', 'steam', 'epicgames', 'blender', 'maya', 'zbrush',
    'figma', 'framer', 'sketch', 'invision', 'adobexd', 'adobephotoshop', 'adobeillustrator', 'adobeaftereffects', 'adobeindesign', 'adobepremierepro', 'canva',
    'markdown', 'latex', 'hexo', 'hugo', 'jekyll', 'docusaurus', 'eleventy', 'vuepress', 'vitepress', 'notion', 'obsidian', 'confluence', 'wordpress', 'ghost', 'medium', 'strapi',
    'redux', 'mobx', 'xstate', 'rxjs', 'reactquery', 'swr', 'jotai', 'recoil', 'zustand', 'pinia', 'valtio', 'effector',
    'electron', 'tauri', 'flutter', 'reactnative', 'ionic', 'capacitor', 'xamarin', 'nativescript', 'cordova', 'expo', 'qt',
    'tensorflow', 'pytorch', 'keras', 'scikitlearn', 'pandas', 'numpy', 'jupyter', 'opencv', 'apachespark', 'hadoop', 'rapidminer', 'huggingface',
    'planetscale', 'cockroachlabs'
  ]);

  let out = `// 内置技术栈图标 SVG path data（来自 simple-icons）\n// viewBox: 0 0 24 24\n// 该文件由 scripts/generate-icons.js 脚本自动生成，请勿手动修改！\n\ninterface IconData {\n  hex: string;\n  path: string;\n}\n\nconst ICON_DATA: Record<string, IconData> = {\n`;

  let count = 0;
  for (const key in si) {
    if (key.startsWith('si') && si[key] && si[key].slug) {
      if (topSlugs.has(si[key].slug)) {
        out += `  "${si[key].slug}": { hex: "${si[key].hex}", path: "${si[key].path}" },\n`;
        count++;
      }
    }
  }

  out += `};\n\nexport default ICON_DATA;\n`;
  
  // 将输出写入到 src/lib/iconData.ts
  const targetPath = path.resolve(__dirname, '../src/lib/iconData.ts');
  fs.writeFileSync(targetPath, out);
  
  console.log(`✅ [icons:update] 成功提取了 ${count} 个前端高频使用的 SVG 图标写入至 src/lib/iconData.ts！`);
}

getTopIcons();
