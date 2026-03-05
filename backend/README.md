# Backend

Go backend for Nexus frontend. It proxies GitHub API calls and provides aggregated endpoints so the frontend does not call GitHub directly.

Tech stack:

- Gin (`github.com/gin-gonic/gin`)
- Gin CORS middleware (`github.com/gin-contrib/cors`)

## Project Structure

- `cmd/server/main.go`: app entrypoint
- `internal/handler`: HTTP handlers and routing
- `internal/service`: business logic
- `internal/repository`: data access abstraction
- `internal/model`: GitHub response models
- `internal/dto`: API response DTOs
- `config/cors.go`: CORS whitelist config
- `internal/middleware`: legacy middlewares (kept for compatibility)
- `internal/github`: GitHub HTTP client
- `internal/database`: in-memory cache
- `data/`: runtime data placeholder

## API Endpoints

- `GET /healthz`
- `GET /api/pages`
- `GET /api/github/user/{username}`
- `GET /api/github/repos/{owner}/{repo}`
- `GET /api/github/repos/{owner}/{repo}/contents?path=...`
- `GET /api/github/repos/{owner}/{repo}/commits/latest?path=...`
- `GET /api/github/repos/{owner}/{repo}/releases`

## Local Run

1. Copy env file:

```bash
cp .env.example .env
```

1. Set `GITHUB_TOKEN` in `.env` (recommended to avoid rate limits).

1. CORS whitelist is configured in `config/cors.go` and supports these frontend origins by default:

- `https://diewehmut.github.io`
- `https://www.hc-dsw-nexus.me`
- `https://hc-dsw-nexus.vercel.app`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

You can override with `ALLOWED_ORIGINS` (comma-separated).

1. Run server:

```bash
go run ./cmd/server
```

Server runs on `http://localhost:8080` by default.

## Frontend API Base

Frontend now reads `VITE_API_BASE`:

- `frontend/.env.development` -> `http://localhost:8080`
- `frontend/.env.production` -> `https://dieWehmut-nexus-backend.hf.space`

This allows local testing and Hugging Face deployment without code changes.

## Hugging Face Deployment

This backend supports Docker Spaces.

1. Push `backend/` to your HF Space repository.
2. Ensure `Dockerfile` is at the repository root in the Space (or set Space root accordingly).
3. Add Space secrets/variables:
   - `GITHUB_TOKEN`
   - `ALLOWED_ORIGINS` (your frontend domain)
   - `PORT` (optional, defaults to `7860` in Docker image)

The container listens on `PORT`, compatible with HF runtime.
