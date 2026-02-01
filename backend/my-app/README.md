```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.cloudflare.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

### Deploy on Vercel

1. **Set project root** to this folder (`my-app`) when creating the Vercel project.
2. **Environment variables** (in Vercel Dashboard → Settings → Environment Variables):
   - `DATABASE_URL` – Prisma Accelerate connection string (or direct Postgres URL)
   - `DIRECT_URL` – Direct PostgreSQL URL (for Prisma migrations; optional for runtime)
   - `JWT_SECRET` – Secret used to sign/verify JWT tokens
3. Deploy with `vercel` or connect your Git repo. The default entry is `src/index.ts` (Vercel-compatible app).
4. **Note:** WebSocket (`/ws`) is not supported on Vercel serverless; it returns 501. Use Cloudflare Workers for WebSocket support.
