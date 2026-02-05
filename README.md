# Resume Pure

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

在线简历编辑器。Pure = 纯粹，专注编辑体验，不搞花里胡哨。

## 为什么要做这个

用过不少在线简历工具，要么功能太复杂，要么要注册登录，要么导出要付费。

Resume Pure 想做的很简单：打开网页就能用，数据存在本地，导出免费。

## 功能

- ⚡ 实时预览 - A4 尺寸 1:1 渲染，边写边看
- 💾 自动保存 - 数据存 localStorage，刷新不丢
- 📄 多格式导出 - PDF / PNG / JSON / YAML
- 🎨 主题配置 - 颜色、字体、字号、行高、间距可调
- 🏷️ Section 控制 - 排序、显隐随心调整
- 📱 联系方式 - 支持自定义图标

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 目录结构

```
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
