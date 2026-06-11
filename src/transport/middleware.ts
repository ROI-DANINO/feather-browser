import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";

export function injectRequestId(request: FastifyRequest): void {
  (request as any).requestId = `req_${randomUUID().slice(0, 8)}`;
}

// ── Transport hardening (Gate A / A0) ────────────────────────────────────────
// A0 closes two browser-driven attack classes against the local control plane without touching the
// capability model (A1): DNS-rebinding (a hostile DNS answer pointing evil.com at 127.0.0.1) and the
// cross-origin CSRF drive-by (a page the warmed browser is sitting on POSTing to 127.0.0.1). See
// docs/specs/2026-06-11-a0-transport-hardening-plan.md and adr-0010 §3.

const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1"]);

// Origin/Referer is only enforced on state-changing methods: a cross-origin *GET* is just a human
// opening the resume link (possibly from an agent UI on another port) and must not be blocked; the
// CSRF threat is the cross-origin POST/PUT/PATCH/DELETE, which browsers always tag with an Origin.
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Split a Host authority ("127.0.0.1:8080", "localhost", "[::1]:8080") into hostname + port. */
function parseAuthority(value: string): { hostname: string; port: string } | null {
  if (!value) return null;
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end === -1) return null;
    const rest = value.slice(end + 1);
    return { hostname: value.slice(1, end), port: rest.startsWith(":") ? rest.slice(1) : "" };
  }
  const idx = value.lastIndexOf(":");
  if (idx === -1) return { hostname: value, port: "" };
  return { hostname: value.slice(0, idx), port: value.slice(idx + 1) };
}

/** Hostname + port from an Origin/Referer URL ("http://127.0.0.1:8080"). */
function parseUrlAuthority(value: string): { hostname: string; port: string } | null {
  try {
    const u = new URL(value);
    const hostname = u.hostname.startsWith("[") && u.hostname.endsWith("]")
      ? u.hostname.slice(1, -1)
      : u.hostname;
    return { hostname, port: u.port };
  } catch {
    return null;
  }
}

/** Loopback hostname required; port must match the bound port when present (lenient when absent). */
function isLoopback(authority: { hostname: string; port: string } | null, localPort: number): boolean {
  if (!authority) return false;
  if (!LOOPBACK_HOSTNAMES.has(authority.hostname)) return false;
  return authority.port === "" || authority.port === String(localPort);
}

/**
 * Global onRequest guard. Rejects (403) any request whose `Host` is not a loopback name (kills
 * DNS-rebinding) and any state-changing request whose `Origin`/`Referer` is cross-origin (kills the
 * CSRF drive-by). Absent Origin/Referer is allowed — non-browser callers (the agent's HTTP client,
 * curl) legitimately send none. Applies to every route, authenticated or not, and runs before token
 * auth and body parsing.
 */
export function createOriginHostGuard() {
  return async function originHostGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const requestId = (request as any).requestId ?? "unknown";
    const localPort = request.socket.localPort ?? 0;

    const host = parseAuthority(request.headers.host ?? "");
    if (!isLoopback(host, localPort)) {
      return reply.status(403).send({
        ok: false,
        requestId,
        error: { code: "FORBIDDEN_HOST", message: "Host header is not a recognized loopback address." },
      });
    }

    if (UNSAFE_METHODS.has(request.method)) {
      const originHeader = request.headers.origin ?? request.headers.referer;
      if (originHeader !== undefined && !isLoopback(parseUrlAuthority(originHeader), localPort)) {
        return reply.status(403).send({
          ok: false,
          requestId,
          error: { code: "FORBIDDEN_ORIGIN", message: "Cross-origin request to a local-only control plane." },
        });
      }
    }
  };
}

export function createTokenAuth(token: string) {
  return async function tokenAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const provided = request.headers["x-feather-token"];
    if (provided !== token) {
      return reply.status(401).send({
        ok: false,
        requestId: (request as any).requestId ?? "unknown",
        error: { code: "UNAUTHORIZED", message: "Invalid or missing X-Feather-Token." },
      });
    }
  };
}
