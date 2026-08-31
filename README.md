

# Resume Pure

[English](./README.en.md)

一个纯本地、零注册、零追踪的在线简历编辑器。你可以直接用表单编辑，也可以用 JSON/YAML 的 Raw 数据驱动简历内容，适合与 AI 工作流结合。

**在线体验：**

- <https://resume.pure.flacier.com/>
- <https://resume-pure.vercel.app/>
- <https://resume-pure.pages.dev/>
- <https://fldicoahkiin.github.io/resume-pure>

## 项目定位

Resume Pure 的目标是：

- 极简编辑体验：打开即写，不强制登录
- 本地优先：数据默认保存在浏览器 localStorage
- 格式可迁移：支持 JSON/YAML 导入导出
- 对 AI 友好：可通过 Raw 数据直接驱动简历生成

## 功能

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
bun install
bun dev
```

### 生产构建

```bash
bun run build
bun run start
```

### 命令行导出

首次使用时安装与当前 Playwright 版本匹配的 Chromium：

```bash
bunx playwright install chromium
```

随后可直接把本地 JSON 导出到指定 PDF 或 PNG 文件。命令会临时启动本地 Resume Pure，完成后自动关闭：

```bash
bun run export:resume -- ./resume.json --format pdf --output ./exports/resume.pdf
bun run export:resume -- ./resume.json --format png --output ./exports/resume.png
```

PDF 保留预览中的纸张尺寸与分页；PNG 使用相同宽度、字体和内容布局导出为无分页间隔的连续长图。

如果 Resume Pure 已经在运行，可跳过临时服务器：

```bash
bun run export:resume -- ./resume.json --format pdf --output ./resume.pdf \
  --url http://127.0.0.1:3000/builder/
```

### 渲染字体生成

预览与 PDF 导出共用 `public/fonts/` 下的子集字体：Noto Sans SC 正体、粗体和 Noto Emoji。
这些文件已随仓库提交，仅在需要更新字体时重新生成：

```bash
brew install fonttools   # 首次生成字体时安装 pyftsubset
bash scripts/generate-render-fonts.sh
```

脚本从 Google Fonts 官方 static 字体子集化，保证 name 表与 cmap 正确。
生成的 PDF 文本可以复制，也可以被 ATS 解析。字符集清单见 `scripts/render-font-unicodes.txt`。

### Docker

```bash
docker build -t resume-pure .
docker run -p 3000:80 resume-pure
```

打开 <http://localhost:3000>

### GitHub Pages

项目已适配静态导出，可通过 GitHub Actions 自动部署（`/.github/workflows/deploy.yml`）。

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Fldicoahkiin/resume-pure)

点击按钮后按向导完成 Import 即可，无需手动创建项目。

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.pages.cloudflare.com/?url=https://github.com/Fldicoahkiin/resume-pure)

点击按钮后登录 Cloudflare 账号，按向导完成部署即可。也可以手动部署：

1. Fork 本仓库到自己的 GitHub 账号
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
3. 选择 Connect to Git，关联你 Fork 的仓库
4. 构建设置：
   - **Framework preset**: `Next.js (Static HTML Export)`
   - **Build command**: `bun run build`
   - **Build output directory**: `out`
5. 点击 Save and Deploy

### GitHub Actions 自动部署

仓库已提供 Vercel 自动部署工作流：`/.github/workflows/vercel-deploy.yml`

在 GitHub 仓库中配置以下 Actions Secrets：

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

触发策略：

- `pull_request` 到 `master`：部署 Preview
- `push` 到 `master`：部署 Production

## Raw 数据与 AI 工作流

### 1) 支持格式

- JSON
- YAML

### 2) 数据规则

- 数据在导入时归一化，包括字段类型修正和缺失默认值补齐
- Raw 始终按最新结构处理，不要求 `schemaVersion`
- Raw 采用纯数据结构，不暴露内部渲染 `id`
- 未识别字段不会进入渲染管线

### 3) 最小可用 JSON 示例

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
  "customSections": [
    {
      "key": "开源贡献",
      "type": "project",
      "items": [
        {
          "name": "项目名称",
          "role": "核心贡献或角色",
          "startDate": "2024.01",
          "url": "https://github.com/pulls/1",
          "repoUrl": "https://github.com/someone/repo",
          "repoStars": 1000,
          "description": ["修复了 XXX 问题", "提升了 XXX 性能"],
          "showStars": true,
          "showLogo": true
        }
      ]
    }
  ],
  "sections": [
    { "key": "summary", "title": "", "visible": true },
    { "key": "experience", "title": "", "visible": true },
    { "key": "education", "title": "", "visible": true },
    { "key": "projects", "title": "", "visible": true },
    { "key": "skills", "title": "", "visible": true },
    { "key": "custom:开源贡献", "title": "开源贡献", "visible": true }
  ],
  "theme": {
    "primaryColor": "#3b82f6",
    "fontFamily": "Noto Sans SC",
    "fontSize": 11,
    "spacing": 8,
    "lineHeight": 1.5,
    "enableLinks": true,
    "paperSize": "A4"
  }
}
```

### 4) YAML 说明

- 日期使用引号，例如 `"2024-02-01"`，避免不同解析器产生不同结果
- 保证缩进为 2 空格，避免 tab

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
│   ├── rawData.ts          # Raw 与内部数据转换
│   ├── export.ts           # JSON/YAML 导入导出
│   ├── markdownFormat.ts   # Markdown 导入导出
│   ├── pdf.tsx             # PDF 导出
│   ├── image.ts            # PNG 导出
│   └── skillLogo.ts        # 技能图标匹配
├── store/
│   └── resumeStore.ts      # Zustand 状态管理
└── types/
    └── resume.ts
```

## 常见问题

### 导入后内容异常

优先检查：

- 是否是合法 JSON/YAML
- 是否包含必需根字段
- 日期是否为字符串

### 想重置所有本地数据

在应用内使用重置按钮，或手动清理浏览器 localStorage 中的 `resume-storage`。

## 致谢

灵感来自 [OpenResume](https://github.com/xitanggg/open-resume)

## License

MIT
