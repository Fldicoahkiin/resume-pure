# Resume Pure

[中文](./README.md)

A local-first, no-signup, no-tracking resume editor. You can edit with forms or drive the resume directly with JSON/YAML raw data, which works well with AI-assisted writing workflows.

**Live Demo:**

- <https://resume-pure.vercel.app/>
- <https://resume-pure.pages.dev/>
- <https://fldicoahkiin.github.io/resume-pure>

## Project Goal

Resume Pure is built around four principles:

- Simple editing flow: open and start writing
- Local-first storage: data stays in browser localStorage by default
- Portable data: import/export with JSON and YAML
- AI-friendly workflow: generate and update resume via raw data

## Features

- Live preview with 1:1 A4 rendering
- Multi-format export: PDF / PNG / JSON / YAML
- Raw mode for direct JSON/YAML editing
- Theme customization: color, fonts, size, spacing, line-height, links
- Section management: reorder, hide/show, custom sections
- PWA support for install and offline usage

## Quick Start

### Local Development

```bash
git clone https://github.com/Fldicoahkiin/resume-pure.git
cd resume-pure
pnpm install
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

### Docker

```bash
docker build -t resume-pure .
docker run -p 3000:80 resume-pure
```

Then open <http://localhost:3000>

### GitHub Pages

The project supports static export and can be deployed with GitHub Actions.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Fldicoahkiin/resume-pure)

Click the button and follow the import wizard. No manual project creation is required.

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.pages.cloudflare.com/?url=https://github.com/Fldicoahkiin/resume-pure)

Click the button, log in to your Cloudflare account, and follow the wizard to deploy.

You can also deploy manually:

1. Fork this repository to your GitHub account
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
3. Select Connect to Git and link your forked repository
4. Build settings:
   - **Framework preset**: `Next.js (Static HTML Export)`
   - **Build command**: `pnpm build`
   - **Build output directory**: `out`
5. Click Save and Deploy

### GitHub Actions Auto Deploy (Advanced)

The repository includes a Vercel deployment workflow: `/.github/workflows/vercel-deploy.yml`

Configure these GitHub Actions secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Trigger rules:

- `pull_request` to `master`: deploy Preview
- `push` to `master`: deploy Production

## Raw Data and AI Workflow

## 1) Supported Formats

- JSON (recommended)
- YAML

## 2) Current Data Rules

- Imported data goes through normalization (type fix + defaults)
- Raw data is always parsed as the latest structure without requiring `schemaVersion`
- Raw keeps pure domain data and does not expose internal render `id`
- Unknown fields are ignored by the current rendering pipeline

## 3) Minimal JSON Example

```json
{
  "personalInfo": {
    "name": "John Doe",
    "title": "Frontend Engineer",
    "email": "john@example.com",
    "phone": "+1-202-555-0123",
    "location": "San Francisco, CA",
    "summary": "Frontend engineer focused on React and performance."
  },
  "experience": [],
  "education": [],
  "projects": [],
  "skills": [],
  "customSections": [
    {
      "key": "Open Source",
      "type": "project",
      "items": [
        {
          "name": "Project Name",
          "role": "Core Contribution or Role",
          "startDate": "2024.01",
          "url": "https://github.com/pulls/1",
          "repoUrl": "https://github.com/someone/repo",
          "repoStars": 1000,
          "description": ["Fixed XXX issue", "Improved XXX performance"],
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
    { "key": "custom:Open Source", "title": "Open Source", "visible": true }
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

## 4) YAML Notes

- Quote date-like values (for example `"2024-02-01"`) for parser consistency
- Use 2-space indentation and avoid tabs

## 5) AI Prompt Template

```text
# Role & Goal
You are a senior tech resume consultant and data structure expert. Please generate structured resume data perfectly supported by the Resume Pure platform, based on the user's provided background (Use JSON format by default, or output YAML if explicitly requested).

# Core Data Structure Specifications:
1. **Required Standard Root Nodes**:
   `personalInfo`, `experience`, `education`, `projects`, `skills`, `customSections`, `sections`, `theme`.
2. **Formatting & Validation**:
   - All date fields (startDate, endDate, date, etc.) are strongly recommended to be exported as strings (e.g., `"2025.01"`, `"2024-02-01"`).
   - Only output the raw format code itself. Do not wrap it in Markdown code blocks or append unnecessary explanatory text.
3. **Sections Routing & Mapping**:
   - The `sections` array dictates the rendering order by referring to the root data nodes via the `key` field.
   - It must contain at least: `summary`, `experience`, `education`, `projects`, `skills`.
4. **Custom Sections Strict Rules**:
   - For non-standard experiences (e.g., Open Source Contributions, Tech Talks, Patents), you must organize them inside `customSections`.
   - Each custom module must contain a unique `key` (e.g., "Open Source Contributions").
   - It is **strongly recommended** to supply the `type` field (accepts `"project"`, `"experience"`, `"education"`, or `"skill"`, fallback is `"project"`). That ensures it behaves precisely like an underlying standard section model.
   - In the bottom `sections` array, the injected key for a custom module must have a `custom:` prefix (e.g., `{"key": "custom:Open Source Contributions", "title": "Open Source", "visible": true}`).
   - If `type` is `"project"` (the default and most used), rich item fields available: `name`, `role`, `startDate`, `endDate`, `url` (Proof Link), `repoUrl` (Associated Repository), `repoStars` (Repository Star Count: integer), `description` (Array of descriptions), `showStars` (boolean), `showLogo` (boolean), `showBulletPoints` (boolean). Please enrich the metadata as much as possible using these fields.

Please begin generating the mapped data based on my requests and personal experiences:
```

## 6) Compatibility Boundary

- Supported: missing fields, minor type drift, partial section mapping (auto-normalized)
- Not supported: arbitrary unknown structures for rendering

## Project Structure

```text
src/
├── app/
│   ├── builder/            # editor page
│   └── page.tsx            # landing page
├── components/
│   ├── editor/             # form editor + raw editor
│   ├── preview/            # resume preview
│   └── export/             # export features
├── lib/
│   ├── resumeData.ts       # raw normalization + migration
│   ├── export.ts           # JSON/YAML import/export
│   ├── pdf.tsx             # PDF export
│   └── image.ts            # PNG export
├── store/
│   └── resumeStore.ts      # Zustand store
└── types/
    └── resume.ts
```

## FAQ

## Imported data looks broken

Check the following first:

- valid JSON/YAML format
- required root fields exist
- date values are strings

## Reset all local data

Use the reset action in UI, or clear `resume-storage-v2` in browser localStorage.

## Credits

Inspired by [OpenResume](https://github.com/xitanggg/open-resume)

## License

MIT
