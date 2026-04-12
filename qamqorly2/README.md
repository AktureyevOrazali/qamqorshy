## Qamqorshy

Frontend for the Qamqorshy caregiving platform.

## Architecture

- Frontend: Next.js App Router
- Backend: FastAPI on `http://127.0.0.1:8080`
- Database: PostgreSQL used only by the FastAPI backend
- Frontend API access: all requests go through Next.js rewrites from `/api/*` to `http://127.0.0.1:8080/api/*`

## Run locally

1. Start PostgreSQL and configure the backend in `backend_fastapi/.env`.
2. Start the FastAPI backend on port `8080`.
3. Install frontend dependencies:

```bash
npm install
```

4. Create the frontend env file:

```bash
copy .env.example .env
```

5. Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `NEXT_PUBLIC_API_URL` - backend base URL, default `http://127.0.0.1:8080`
