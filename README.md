# Resume Pure

[English](./README.en.md)

一个纯本地、零注册、零追踪的在线简历编辑器。你可以直接用表单编辑，也可以用 JSON/YAML 的 Raw 数据驱动简历内容，适合与 AI 工作流结合。

**在线体验：<https://fldicoahkiin.github.io/resume-pure>**

## 项目定位

Resume Pure 的核心目标是：

- 极简编辑体验：打开即写，不强制登录
- 本地优先：数据默认保存在浏览器 localStorage
- 格式可迁移：支持 JSON/YAML 导入导出
- 对 AI 友好：可通过 Raw 数据直接驱动简历生成

## 核心特性

- 实时预览：A4 1:1 渲染，所见即所得
- 多格式导出：PDF / PNG / JSON / YAML
- Raw 编辑模式：直接编辑 JSON/YAML 并即时生效
- 主题配置：主色、字体、字号、间距、行高、链接开关
- 模块管理：内置模块排序、显隐、自定义模块扩展
- PWA：支持安装到桌面，离线可用

## 为什么是 Pure

- 不做账号体系，不做在线简历托管
- 不绑复杂模板市场，专注基础能力
- 不依赖后端存储，降低隐私和运维成本

## 快速开始

### 本地开发

```bash
git clone https://github.com/Fldicoahkiin/resume-pure.git
cd resume-pure
pnpm install
pnpm dev
```

### 生产构建

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker build -t resume-pure .
docker run -p 3000:80 resume-pure
```

打开 <http://localhost:3000>

### GitHub Pages

项目已适配静态导出，可通过 GitHub Actions 自动部署。

### Vercel

#### 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Fldicoahkiin/resume-pure)

点击按钮后按向导完成 Import 即可，无需手动创建项目。

#### GitHub Actions 自动部署（进阶）

仓库已提供 Vercel 自动部署工作流：`/.github/workflows/vercel-deploy.yml`

在 GitHub 仓库中配置以下 Actions Secrets：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

触发策略：

- `pull_request` 到 `master`：部署 Preview
- `push` 到 `master`：部署 Production

## Raw 数据与 AI 工作流

## 1) 支持格式

- JSON（推荐）
- YAML

## 2) 设计原则（当前版本）

- 数据会在导入时经过归一化（字段类型修正、缺失默认值补齐）
- Raw 始终按最新结构处理，不要求 `schemaVersion`
- Raw 采用纯数据结构，不暴露内部渲染 `id`
- 未识别字段不会进入当前渲染管线（避免污染状态）

## 3) 最小可用 JSON 示例

```json
{
  "personalInfo": {
    "name": "张三",
    "title": "前端开发工程师",
    "email": "zhangsan@example.com",
    "phone": "13800000000",
    "location": "北京",
    "summary": "5 年前端经验，擅长 React 与工程化。"
  },
  "experience": [],
  "education": [],
  "projects": [],
  "skills": [],
  "customSections": [],
  "sections": [
    { "key": "summary", "title": "", "visible": true },
    { "key": "experience", "title": "", "visible": true },
    { "key": "education", "title": "", "visible": true },
    { "key": "projects", "title": "", "visible": true },
    { "key": "skills", "title": "", "visible": true }
  ],
  "theme": {
    "primaryColor": "#3b82f6",
    "fontFamily": "Noto Sans SC",
    "fontSize": 11,
    "spacing": 8,
    "lineHeight": 1.5,
    "enableLinks": true
  }
}
```

## 4) YAML 使用建议

- 日期建议加引号（如 `"2024-02-01"`），避免不同解析器行为差异
- 保证缩进为 2 空格，避免 tab

## 5) AI 生成 Raw 提示词模板

```text
请输出 Resume Pure 可导入的 JSON（不要 Markdown 代码块）：
1. 必须包含 personalInfo/experience/education/projects/skills/customSections/sections/theme
2. 所有日期字段输出字符串
3. sections 使用 key 字段，至少包含 summary/experience/education/projects/skills
4. 只输出合法 JSON
```

## 6) 当前兼容边界

- 支持：字段缺失、字段类型偏差、模块映射不完整的自动修正
- 不支持：任意未知结构的渲染（未知字段会被忽略）

## 项目结构

```text
src/
├── app/
│   ├── builder/            # 编辑器页面
│   └── page.tsx            # 介绍页
├── components/
│   ├── editor/             # 表单编辑与 Raw 编辑
│   ├── preview/            # 简历预览
│   └── export/             # 导出能力
├── lib/
│   ├── resumeData.ts       # Raw 归一化与迁移
│   ├── export.ts           # JSON/YAML 导入导出
│   ├── pdf.tsx             # PDF 导出
│   └── image.ts            # PNG 导出
├── store/
│   └── resumeStore.ts      # Zustand 状态管理
└── types/
    └── resume.ts
```

## 常见问题

## 导入后内容异常

优先检查：

- 是否是合法 JSON/YAML
- 是否包含必需根字段
- 日期是否为字符串

## 想重置所有本地数据

在应用内使用重置按钮，或手动清理浏览器 localStorage 中的 `resume-storage-v2`。

## 致谢

灵感来自 [OpenResume](https://github.com/xitanggg/open-resume)

## License

MIT
