# AI Bridal Atelier

AI wedding dress design studio. The customer uploads one **overall** reference, adds optional **component** references (bodice, skirt, sleeves, back, train, details), gets one structured **design brief**, then one cohesive **design** that she refines with **text + drawing + extra references**. Every edit becomes a new **version**; nothing is ever overwritten.

> **Phase 1 — working foundation.** The complete workflow, data model, persistence, drawing engine and version system are real. AI generation is **not** connected yet: every AI step goes through a provider-agnostic service layer and honestly reports **"AI service not configured"** until a provider is plugged in on the server.

Stack: React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage) · Vercel Functions.

---

## Quick start

```bash
# 1. install (Node 20.19+ or 22)
npm install

# 2. environment
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local

# 3. run
npm run dev                        # http://localhost:5173
```

With an empty `.env.local` the app runs in **local mode**: no login, designs are stored in this browser (IndexedDB). This is enough to try the whole workflow.

Other commands:

```bash
npm run typecheck   # TypeScript strict check (app + vite config + api)
npm test            # unit tests (vitest)
npm run build       # production build → dist/
npm run preview     # serve the production build
```

To run the server-side AI endpoints locally as well, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev          # serves the app AND /api/ai/* on http://localhost:3000
```

---

## Environment variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | client | for accounts/cloud | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | for accounts/cloud | Supabase **anon** (public) key — protected by RLS |
| `VITE_AI_API_BASE` | client | no (default `/api`) | Base path of the AI API |
| `AI_PROVIDER` | **server only** | to enable AI | Name of the registered provider adapter |
| `AI_API_KEY` | **server only** | to enable AI | Provider secret key |
| `SUPABASE_URL` | **server only** | optional | Used by `/api` to verify user sessions |
| `SUPABASE_ANON_KEY` | **server only** | optional | Used by `/api` to verify user sessions |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | later | Privileged server jobs. **Never** prefix with `VITE_` |

Anything prefixed `VITE_` is bundled into the browser. Secrets must never use that prefix.

---

## Supabase setup (cloud mode)

1. Create a project at supabase.com.
2. Open **SQL Editor** → paste and run `supabase/migrations/0001_init.sql`.
   It creates `profiles`, `design_projects`, `reference_images`, `design_briefs`, `design_versions`, `library_images`, row level security policies, the private `bridal-designs` bucket (with per-user folder policies) and the public `bridal-library` bucket.
3. **Authentication → Providers → Email**: enabled (email + password).
4. Copy **Project URL** and **anon public key** into `.env.local` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, restart `npm run dev`.

Storage layout (private bucket, first folder = owner's user id):

```
bridal-designs/
  {userId}/user-uploads/{projectId}/…
  {userId}/generated-designs/{projectId}/…
  {userId}/design-versions/{projectId}/…
  {userId}/thumbnails/{projectId}/…
  {userId}/ai-video/{projectId}/…        (future)
```

Images are displayed through short-lived **signed URLs**; Postgres only stores paths and metadata.

Google login later: enable the Google provider in Supabase, then call `authService.signInWithGoogle()` from a button (already implemented in `src/services/auth/authService.ts`).

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as Vite (`vercel.json` included).
3. Add the environment variables above in **Settings → Environment Variables**.
4. Deploy. SPA routes are rewritten to `index.html`; `/api/*` is served by the functions in `api/`.

---

## Connecting an AI provider (Phase 2)

All AI calls flow: **UI → `src/services/ai/*` → `POST /api/ai/:action` → provider adapter**. Keys stay on the server.

1. Create `api/_lib/providers/<name>.ts` implementing `AiProvider` (`api/_lib/providers/types.ts`):
   `analyzeOverallReference`, `analyzeComponentReference`, `createDesignBrief`, `generateDress`, `editDress`, `analyzeDrawing` (+ future `makeItReal`, `createVideo`).
2. Register it in `api/_lib/providers/index.ts`.
3. Set `AI_PROVIDER=<name>` and `AI_API_KEY=…` in Vercel.

`GET /api/ai/status` then reports the provider's capabilities and the UI enables the matching buttons automatically.

Editing requests already contain everything a localized edit needs: current image, instruction, the vector drawing, a **black/white PNG mask** at image resolution (white = change; closed outlines are filled), a region summary (bounding box + upper/middle/lower zone), optional target part, extra reference images and the current brief so unchanged parts can be preserved.

> Images are sent as downscaled data URLs while they exist only in the browser (Vercel bodies are limited to ~4.5 MB). Once a project is saved to Supabase, only `storagePath` is sent and the server should sign it with the service role key.

---

## Project structure

```
api/                         Vercel Functions (server only)
  ai/[action].ts             /api/ai/status (GET) + all AI actions (POST)
  _lib/                      http helpers, auth check, validation, provider registry
src/
  App.tsx, main.tsx          routes + bootstrap (restores draft before first render)
  auth/                      AuthProvider (cloud/local mode), RequireAuth guard
  components/
    layout/                  AppShell (header, mobile menu, footer), ScrollToTop
    ui/                      Button, Notice, Modal, Spinner, StepHeader, ProgressSteps
    upload/                  ImageDropzone, useImagePicker (validation on every upload)
    viewer/                  ImageViewer (zoom/fit/reset/rotate/pan/pinch), ReferencePanel
    editor/                  EditorCanvas, DrawingToolbar, AiDesignerPanel, VersionPanel
    design/                  DesignImage (+ preview badge), FutureFeatures placeholders
  features/
    design/                  component catalog, designWorkflow (orchestrates AI steps)
    drawing/                 drawing engine: model, renderer, geometry, mask export, canvas, hook
    images/                  validation (magic bytes), processing (thumbnails), blob registry
    versions/                append-only version history (undo/redo/restore)
  services/
    ai/                      aiService, visionService, imageGenerationService, editingService
    auth/                    authService (Supabase Auth wrapper)
    db/                      DesignRepository interface + Supabase and IndexedDB implementations
    storage/                 Supabase Storage paths/signed URLs, IndexedDB wrapper
    library/                 paginated reference library
  state/                     designStore (external store + crash-safe draft autosave)
  pages/                     Landing, Login, Signup, design steps, Result, Editor, My Designs, Library
  types/                     DesignProject, ReferenceImage, DesignBrief, DrawingInstruction, …
supabase/migrations/         SQL schema + RLS + storage policies
```

## Routes

| Path | Page |
|---|---|
| `/` | Landing |
| `/login`, `/signup` | Email + password (Supabase Auth) |
| `/design` | Step 1 — overall vision |
| `/design/details` | Step 2 — component references (`?part=bodice…`) |
| `/design/brief` | Step 3 — design brief + Create my design |
| `/design/result` | Your bridal design |
| `/design/edit` | AI editing workspace |
| `/designs` | My Designs |
| `/library` | Shared reference library (future content) |

---

## What works now vs. what needs AI

**Fully functional now**
- Routing, landing, responsive layout (phone → desktop), mobile menu
- Email/password sign-up & login with Supabase; protected routes; local mode without Supabase
- Uploads with real validation (JPG/PNG/WEBP by file signature, 15 MB, max 8000 px, filenames ignored), thumbnails
- Full-image viewer: zoom, fit, reset, rotate, pan, wheel and pinch zoom, replace, remove — never cropped
- Overall + 6 component steps, optional notes per part, skip any part
- Design brief editor (customer can write it by hand)
- Drawing layer: pen, eraser, undo, redo, clear, size, opacity, colours; mouse, touch, stylus pressure; stored as vector data separate from the image; mask export
- Version system: append-only, undo/redo/restore, never deletes
- Save/load/delete projects (Supabase tables + private Storage, or IndexedDB locally), My Designs gallery with thumbnails
- Draft autosave and restore after refresh
- Honest "AI service not configured" states; optional clearly-labelled **preview mode** that uses the customer's own overall reference as a stand-in so the editor and saving can be tried

**Requires an AI provider (Phase 2)**
- Analysing the overall and component references
- Writing the design brief automatically
- Generating the dress image
- Applying edits (localized/masked editing)
- Interpreting drawings with AI (`analyzeDrawing`)
- Make it real (photorealistic image) and AI video — shown as "Not available yet"
- Populating the reference library (table + bucket are ready)

---

## Hướng dẫn nhanh (Tiếng Việt)

1. Cài Node.js 22, mở terminal trong thư mục dự án.
2. `npm install`
3. Sao chép `.env.example` thành `.env.local` (để trống vẫn chạy được ở chế độ local).
4. `npm run dev` rồi mở `http://localhost:5173`.
5. Muốn có tài khoản và lưu trên cloud: tạo project Supabase, chạy file `supabase/migrations/0001_init.sql` trong SQL Editor, điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
6. Đưa lên GitHub và Vercel theo các mục ở trên. Không bao giờ commit file `.env.local`.
