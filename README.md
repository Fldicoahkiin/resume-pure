# Resume Pure

纯粹的在线简历编辑器 - 专注内容，支持多格式导入导出

## ✨ 特性

- 📝 **实时编辑与预览** - 所见即所得的编辑体验
- 🎨 **高度自定义** - 组件级别的显示、顺序和布局控制
- 💾 **多格式导入导出** - 支持 JSON/YAML/PDF/PNG
- 🔒 **隐私优先** - 所有数据保存在本地浏览器
- 📱 **响应式设计** - 完美适配各种屏幕尺寸

## 🚀 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand + Persist
- **PDF 生成**: @react-pdf/renderer
- **数据格式**: JSON / YAML

## 📦 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/resume-pure.git

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用

## 🎯 核心功能

### 导入导出

- **JSON 格式** - 轻量、原生支持、易于 API 集成
- **YAML 格式** - 人类可读、支持注释、便于手动编辑
- **PDF 格式** - 打印友好的专业简历
- **PNG 格式** - 图片格式，便于分享

### 自定义配置

- 控制每个组件的显示/隐藏
- 自定义组件顺序
- 调整主题颜色、字体、间距
- 组件级别的布局配置

## 📁 项目结构

```
src/
├── app/              # Next.js App Router 页面
│   ├── builder/      # 简历编辑器页面
│   ├── layout.tsx
│   └── page.tsx
├── components/       # React 组件（待开发）
├── lib/              # 工具函数
│   ├── export.ts     # 导入导出逻辑
│   └── utils.ts
├── store/            # Zustand 状态管理
│   └── resumeStore.ts
└── types/            # TypeScript 类型定义
    └── resume.ts
```

## 🛠️ 开发

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
```

## 🎨 与 OpenResume 的区别

| 特性 | OpenResume | Resume Pure |
|------|-----------|-------------|
| PDF 导入 | ✅ | ❌ |
| ATS 解析器 | ✅ | ❌ |
| JSON/YAML 导入导出 | ❌ | ✅ |
| 组件级自定义 | 基础 | 增强 |
| 状态管理 | Redux Toolkit | Zustand |

## 📝 待办事项

- [ ] 完善编辑器组件
- [ ] 实现 PDF 导出功能
- [ ] 实现 PNG 导出功能
- [ ] 添加更多自定义选项
- [ ] 主题预设

## 📄 License

MIT

## 🙏 致谢

本项目灵感来源于 [OpenResume](https://github.com/xitanggg/open-resume)
