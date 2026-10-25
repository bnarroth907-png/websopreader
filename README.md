# SOP Reader

Official web library for reading and managing Standard Operating Procedures (SOPs).

## Features

- Browse procedures by category (Operations, Safety, Customer Service, Quality, Uploaded)
- Upload `.md`, `.txt`, and `.pdf` files; they are stored on the server under `storage/`
- Full-text search across titles, descriptions, categories, and markdown content
- Markdown rendering with sanitization
- PDF viewer (first 10 pages)
- Responsive layout, dark mode, and print
- Remove uploaded procedures (built-in library documents stay in place)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` to change the app name, storage directory, or upload size limit.

## Storage

| Path | Purpose |
| --- | --- |
| `storage/sops/library/{id}/` | Built-in procedures (`document.md` + `meta.json`) |
| `storage/sops/uploads/{id}/` | User uploads |
| `storage/logs/audit.jsonl` | Create/delete audit log |

## API

All JSON endpoints return `{ code, message, data, traceId }`.

- `GET /api/sops?page=&pageSize=&sort=&q=`
- `GET /api/sops/{id}`
- `GET /api/sops/{id}/file`
- `POST /api/sops` (multipart field `file`)
- `DELETE /api/sops/{id}` (uploads only)

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm start` — run the production server
