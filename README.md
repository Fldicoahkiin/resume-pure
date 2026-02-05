# Resume Pure

[![Next.js](https://skillicons.dev/icons?i=nextjs)](https://nextjs.org/)
[![TypeScript](https://skillicons.dev/icons?i=ts)](https://www.typescriptlang.org/)
[![Tailwind](https://skillicons.dev/icons?i=tailwind)](https://tailwindcss.com/)

[中文](#中文) | English

A dead-simple online resume editor. Pure means no clutter, no signup, no tracking.

**Live Demo: <https://fldicoahkiin.github.io/resume-pure>**

## Features

- **Live Preview** - 1:1 A4 rendering, what you see is what you get
- **Auto Save** - Data persists in localStorage
- **Multi-format Export** - PDF / PNG / JSON / YAML
- **Theme Settings** - Colors, fonts, sizes, spacing, line height
- **Section Control** - Reorder, show/hide sections
- **Custom Contacts** - Add any contact with custom icons

## Deploy

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Fldicoahkiin/resume-pure)

### GitHub Pages

Automatically deployed via GitHub Actions. Configure in:
Settings → Pages → Source → GitHub Actions

## Local Development

```bash
git clone https://github.com/Fldicoahkiin/resume-pure.git
cd resume-pure
pnpm install
pnpm dev
```

## Project Structure

```text
src/
├── app/
│   ├── builder/      # Editor page
│   └── page.tsx      # Home page
├── components/
│   ├── editor/       # Editor components
│   └── preview/      # Preview components
├── store/
│   └── resumeStore.ts
├── lib/
│   └── export.ts
└── types/
    └── resume.ts
```

## Credits

Inspired by [OpenResume](https://github.com/xitanggg/open-resume)

## License

MIT

---

## 中文

[English](#resume-pure) | 中文

在线简历编辑器。Pure = 纯粹，专注编辑体验，不搞花里胡哨。

**在线预览：<https://fldicoahkiin.github.io/resume-pure>**

## 功能

- **实时预览** - A4 尺寸 1:1 渲染，所见即所得
- **自动保存** - localStorage 持久化
- **多格式导出** - PDF / PNG / JSON / YAML
- **主题配置** - 颜色、字体、字号、间距、行高
- **Section 控制** - 排序、显隐
- **联系方式** - 自定义图标

## 部署

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Fldicoahkiin/resume-pure)

### GitHub Pages

通过 GitHub Actions 自动部署，配置路径：
Settings → Pages → Source → GitHub Actions

## 本地开发

```bash
git clone https://github.com/Fldicoahkiin/resume-pure.git
cd resume-pure
pnpm install
pnpm dev
```

## 目录结构

```text
src/
├── app/
│   ├── builder/      # 编辑器页面
│   └── page.tsx      # 首页
├── components/
│   ├── editor/       # 编辑器组件
│   └── preview/      # 预览组件
├── store/
│   └── resumeStore.ts
├── lib/
│   └── export.ts
└── types/
    └── resume.ts
```

## 致谢

灵感来自 [OpenResume](https://github.com/xitanggg/open-resume)

## License

MIT
