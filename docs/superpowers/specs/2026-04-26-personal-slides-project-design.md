# 個人簡報網站 — 設計規格

- 日期：2026-04-26
- 作者：yoyo930021
- 狀態：草案（待 user review）

## 目標

建立一個個人專案，集中管理多份 Slidev 製作的演講簡報，並提供一個 landing page 給觀眾瀏覽所有場次。整站部署到 GitHub Pages。

## 範圍與假設

- 簡報數量：少量（5 個以內），偶爾新增（一年數次）
- 部署目標：GitHub Pages（`https://yoyo930021.github.io/<repo>/`）
- 不需要：CMS、文章/部落格、評論、留言、搜尋／篩選 UI、登入、PR preview deploy
- 需要：完整 landing page（個人簡介、演講列表、聯絡方式、社群連結）

## 技術選型

| 項目 | 選擇 | 備註 |
|---|---|---|
| 套件管理器 | pnpm | 全域偏好 |
| Node 版本 | 22 LTS | CI 鎖定 |
| 簡報引擎 | `@slidev/cli` 最新穩定版 | 一份 `slides.md` 為一場 talk |
| Landing 框架 | Vite + Vue 3（`<script setup>` + TypeScript） | 與 Slidev 同生態 |
| 樣式 | UnoCSS | 與 Slidev 內建一致，class 寫法可互通 |
| 路由 | 不引入 vue-router，單頁 + 錨點 | YAGNI |
| 主題 | light/dark 自動依系統偏好 | CSS 變數 + `prefers-color-scheme` |
| 字型 | Inter（西文）+ Noto Sans TC（中文） | 從 Google Fonts 載入 |
| 腳本語言 | Node.js（zx）| 全域偏好；不寫 Python |
| 測試 | Vitest（僅針對 `scan-talks.mjs`） | 其他層刻意不寫測試 |
| Lint | ESLint + `@antfu/eslint-config` | Vue/TS 開箱即用 |
| 型別檢查 | `vue-tsc --noEmit` | CI 必跑 |
| CI/CD | GitHub Actions → GitHub Pages | `peaceiris/actions-*` 不必，使用官方 `actions/deploy-pages` |
| PDF 匯出 | `slidev export`（透過 Playwright Chromium） | 預設開啟，可逐 deck 關閉 |

## 專案結構

```
slides/
├── package.json              ← 統管所有依賴（單一）
├── pnpm-lock.yaml
├── tsconfig.json
├── eslint.config.js
├── README.md
├── landing/                  ← 個人首頁
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── components/
│       │   ├── Hero.vue
│       │   ├── About.vue
│       │   ├── TalkList.vue
│       │   └── Socials.vue
│       ├── data/
│       │   ├── profile.ts            ← 個人資訊（手寫）
│       │   └── talks.generated.json  ← 由 scan-talks 產生
│       └── styles/
├── talks/                    ← 每個演講一個資料夾
│   └── <slug>/
│       ├── slides.md         ← Slidev 入口；frontmatter 含 talk 中繼資料
│       ├── components/       ← (選用) deck 專屬元件
│       └── public/           ← (選用) deck 專屬靜態資源
├── shared/                   ← (選用) 跨 deck 共用素材；初始為空
├── scripts/
│   ├── scan-talks.mjs        ← 掃描 talks/* 並產生 talks.generated.json
│   ├── build-all.mjs         ← 編排整個 build 流程
│   └── new-talk.mjs          ← (選用) scaffold 新 talk
├── .github/
│   └── workflows/
│       └── deploy.yml
└── .gitignore
```

**設計原則**：

- 每個 talk 一個資料夾（不是單一 .md 檔），讓 talk 可擁有自己的 components/public 而互不污染。
- `shared/` 預設不建立、不引入；只在真的出現重複時才動。避免過度抽象。
- 個人資料集中在 `landing/src/data/profile.ts`；社群連結、avatar、tagline 都從這裡讀，不散落各 component。

## Talks 中繼資料與自動掃描

### Frontmatter 慣例

每個 `talks/<slug>/slides.md` 必須在第一頁含下列 frontmatter：

```yaml
---
# Slidev 原生欄位
theme: default
title: <演講標題>
info: |
  <Slidev info；自由文字>

# 自訂命名空間：給 landing / 建置流程使用
talk:
  date: 2026-04-15            # 必填，ISO date
  event: <活動名稱>            # 必填
  location: <地點>             # 選填
  description: <一段簡短描述>  # 必填，landing 卡片用
  tags: [tag1, tag2]           # 選填，預設 []
  draft: false                 # 選填，true 時 landing 不顯示且不 build
  exportPdf: true              # 選填，預設 true；false 跳過該 deck 的 PDF
  slug: <override>             # 選填；預設取資料夾名
---
```

### `scan-talks.mjs` 行為

1. `glob('talks/*/slides.md')`
2. 用 `gray-matter` 解析 frontmatter
3. 驗證必填欄位（見「錯誤處理」）
4. 過濾 `talk.draft: true`
5. 依 `talk.date` 由新到舊排序
6. 寫入 `landing/src/data/talks.generated.json`

執行時機：

- `pnpm dev:landing` 啟動前先跑一次；之後用 `chokidar` watch `talks/**/slides.md`，frontmatter 改動就 regenerate JSON，觸發 Vite HMR
- `pnpm build` 在 build 任何東西前先跑
- CI 內由 `pnpm build` 涵蓋

### `talks.generated.json` Schema

```jsonc
[
  {
    "slug": "2026-04-rust-intro",
    "title": "Rust 入門：從 ownership 開始",
    "date": "2026-04-15",
    "event": "XX 社群 Meetup #42",
    "location": "台北",
    "description": "從 ownership / borrowing 出發...",
    "tags": ["rust", "language", "intro"],
    "url": "/<repo>/talks/2026-04-rust-intro/",
    "pdfUrl": "/<repo>/talks/2026-04-rust-intro/slides-export.pdf"
  }
]
```

`url` / `pdfUrl` 的前綴 `/<repo>/` 由 build 時的 `BASE_PATH` 環境變數帶入；本機 dev 為 `/`。`pdfUrl` 在 `exportPdf: false` 時為 `null`。

## Landing 頁版面

由上而下：

1. **Hero**：名字、tagline、簡短介紹、CTA（「看演講列表」錨點 + 「GitHub」）
2. **Talks**：卡片列，標題／日期／活動／簡介／tags；點卡片 → 對應 deck，旁邊小按鈕 → PDF 下載（若有）
3. **About**：較長一段個人介紹，可含頭像
4. **Footer / Socials**：GitHub、Email 等社群連結，從 `profile.ts` 讀

排序：依日期由新到舊。**不**做篩選／搜尋 UI（量少時瀏覽器 Cmd+F 即可）。

`profile.ts` 結構：

```ts
export const profile = {
  name: string,
  tagline: string,
  bio: string,
  avatar: string,           // 路徑相對 landing/public/
  socials: Array<{ type: 'github' | 'email' | 'twitter' | 'other', label: string, url: string }>,
}
```

## Build 與部署

### `pnpm build` 編排（`scripts/build-all.mjs`）

1. 跑 `scan-talks` → 產出 `talks.generated.json`
2. 平行 build 每個 talk：
   ```
   slidev build talks/<slug>/slides.md \
     --base $BASE_PATH/talks/<slug>/ \
     --out  dist/talks/<slug>
   ```
3. Build landing：`vite build`，base 為 `$BASE_PATH/`，輸出 `dist/`
4. 對每個 `exportPdf !== false` 的 talk 跑 `slidev export ... --output dist/talks/<slug>/slides-export.pdf`

任一步驟非 0 退出，整個 build 失敗。

### 最終 `dist/` 結構

```
dist/
├── index.html
├── assets/...
├── avatar.jpg
└── talks/
    └── <slug>/
        ├── index.html
        ├── slides-export.pdf   (若有)
        └── assets/...
```

### Base Path

- 由環境變數 `BASE_PATH` 控制，預設 `/`（本機 dev）
- CI 內帶入 `/${{ github.event.repository.name }}/`
- 改用 custom domain 時 `BASE_PATH=/`

### GitHub Actions（`.github/workflows/deploy.yml`）

觸發：`push` 到 `main` 或手動 `workflow_dispatch`。**不**啟用 PR preview。

權限：`contents: read`、`pages: write`、`id-token: write`。Concurrency group `pages`，不取消進行中的 deploy。

兩個 job：

- `build`：checkout → 安裝 pnpm/node → `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `pnpm typecheck` → `pnpm lint` → `pnpm test` → `pnpm build`（帶 `BASE_PATH`） → `actions/upload-pages-artifact`
- `deploy`：`actions/deploy-pages`，依賴 `build`

## 開發者工作流程

| 指令 | 行為 |
|---|---|
| `pnpm dev:landing` | scan + Vite dev server；watch talks frontmatter，自動 regenerate JSON |
| `pnpm dev <slug>` | `slidev talks/<slug>/slides.md`，正常 Slidev 演講者模式 |
| `pnpm build` | 全部 build，產出 `dist/` |
| `pnpm preview` | `pnpm build` 後 `vite preview`，模擬 GH Pages 環境（含 `BASE_PATH`） |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm new <slug>` | (選用) scaffold `talks/<slug>/slides.md` 模板 |

## 錯誤處理

### Frontmatter 驗證

| 情境 | 行為 |
|---|---|
| 找不到 frontmatter | Build 失敗，列出檔案路徑 |
| 缺 `title` 或 `talk.date` 或 `talk.event` 或 `talk.description` | Build 失敗，列出缺哪些欄位 |
| `talk.date` 不是合法 ISO date | Build 失敗 |
| 兩個 talk slug 撞名 | Build 失敗，列出衝突 talk |
| `talk.draft: true` | 跳過（不放 JSON、不 build deck、不 export PDF），印 `[skip] talks/<slug> (draft)` |
| `talk.tags` 缺 | 視為 `[]` |

哲學：fail fast。frontmatter 寫錯就讓 CI 紅。

### Slidev build 失敗

任一 deck build 失敗 → 整個 `build-all.mjs` 退出非 0。**不**嘗試略過壞掉的 deck。

### Talks 互相影響

單一 `package.json` 意味升級任一 addon 會影響所有 deck。對策：CI 在每次 push 都跑全部 build，問題會立刻被 CI 抓到。

## 測試策略

| 層 | 是否測試 | 工具 / 理由 |
|---|---|---|
| `scan-talks.mjs` | 是 | Vitest；fixtures 涵蓋合法 / 缺欄位 / draft / 撞 slug / 非法日期 |
| `build-all.mjs` 編排 | 否 | CI 每次 push 跑完整 build = 最佳整合測試 |
| Landing 元件 | 否 | 內容靜態、邏輯極少 |
| 個別 Slidev deck | 否 | Slidev 自身 build 即驗證 |
| TypeScript | 是 | `vue-tsc --noEmit`，CI 必跑 |
| Lint | 是 | ESLint，CI 必跑 |

## 不在這次範圍內（YAGNI 排除清單）

- 全文搜尋／tag 篩選 UI
- 文章／部落格區塊
- 多語系 i18n
- 評論、留言系統
- 訪客分析（Google Analytics 等）
- PR preview deploy
- 自訂 Slidev 主題包成獨立 npm 套件
- pnpm workspace 結構

以上若日後規模成長再評估。

## 開放決策

無。所有需要使用者決定的點均已於 brainstorming 階段確認。
