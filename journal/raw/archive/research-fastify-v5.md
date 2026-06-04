# Research: Fastify v5 Migration
# Date: 2026-06-02 | Source: Web research pass

## Urgency

Fastify v4 LTS ended June 30, 2025. We are running an unsupported version.
No security patches, no bug fixes for v4 going forward.
Migrate to v5 before Phase 4 work starts (or as Phase 4 Task 0).

---

## Node.js Compatibility

v5 requires Node.js v20+. We're on Node 20. No problem.

---

## Breaking Changes That Affect Feather

### 1. Full JSON schema required (HIGH — likely affects us)
v4 allowed shorthand schema (just `type: 'object'`).
v5 requires full JSON schema for querystring, params, and body.
Check all route schemas in `src/transport/routes.ts` and `src/transport/sse.ts`.
`jsonShortHand` option removed.

### 2. DELETE with empty body (LOW — check)
v4 allowed `DELETE` requests with `Content-Type: application/json` and empty body.
v5 rejects this. We have a `DELETE /v1/sessions/:sessionId` route — check if any
callers send Content-Type header with empty body.

### 3. Plugin API mixing (MEDIUM — check plugins)
v4 allowed plugins mixing callback and promise API.
v5 disallows this. Check `src/transport/http.ts` plugin registration and `sse.ts`.

### 4. `.listen()` signature changed (LOW)
Variadic arguments removed. Must use object form:
```ts
// v4 (still works if we use object form)
app.listen({ port: 3000, host: '127.0.0.1' })
// v5 ONLY accepts object form — check our listen() call in src/server.ts
```

### 5. request.connection removed
Use `request.socket` instead. Grep: `request.connection` in src/.

### 6. request.hostname now returns hostname only (not host:port)
v4: `req.hostname` included port. v5: separate `req.host`, `req.hostname`, `req.port`.
Check if we use `req.hostname` anywhere and expect port to be included.

### 7. getDefaultRoute / setDefaultRoute removed
Check if we use these anywhere.

---

## Breaking Changes That DON'T Affect Feather

- NestJS migration (not using NestJS)
- VPS deployment docs (not relevant)
- Fastify CLI changes (not using)

---

## Performance Gain

v5 is ~5-10% faster than v4. Minor win for a local API.

---

## Migration Steps (When Ready)

```bash
npm install fastify@latest
```

Then:
1. Run tests — see what breaks
2. Fix schema issues (most likely culprit)
3. Fix plugin API mixing if any
4. Fix `.listen()` if using variadic form
5. Fix `request.connection` → `request.socket` if used
6. Re-run full test suite (129 unit + 32 integration)

Official migration guide: https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/

---

## Compatibility with Our Dependencies

- `fastify-sse-v2` (our SSE plugin): CHECK if it has a v5-compatible release
  before migrating. This is the most likely blocker.
- `@fastify/cors`, etc.: check each plugin for v5 compatibility.

---

## Sources
- https://fastify.dev/docs/latest/Guides/Migration-Guide-V5/
- https://encore.dev/blog/fastify-v5
