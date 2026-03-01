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

## Raw 数据与 AI 工作流

## 1) 支持格式

- JSON（推荐）
- YAML

## 2) 设计原则（当前版本）

- 数据会在导入时经过归一化（字段类型修正、缺失默认值补齐）
- 数据包含 `schemaVersion`，用于后续迁移与兼容
- 未识别字段不会进入当前渲染管线（避免污染状态）

## 3) 最小可用 JSON 示例

```json
{
  "schemaVersion": 1,
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
    { "id": "summary", "title": "", "visible": true, "order": 1 },
    { "id": "experience", "title": "", "visible": true, "order": 2 },
    { "id": "education", "title": "", "visible": true, "order": 3 },
    { "id": "projects", "title": "", "visible": true, "order": 4 },
    { "id": "skills", "title": "", "visible": true, "order": 5 }
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
1. 必须包含 schemaVersion=1
2. 必须包含 personalInfo/experience/education/projects/skills/customSections/sections/theme
3. 所有日期字段输出字符串
4. sections 必须包含 summary/experience/education/projects/skills，order 从 1 开始
5. 只输出合法 JSON
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

在应用内使用重置按钮，或手动清理浏览器 localStorage 中的 `resume-storage`。

## 致谢

灵感来自 [OpenResume](https://github.com/xitanggg/open-resume)

## License

MIT
