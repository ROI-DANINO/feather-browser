import * as http from "http";

export interface Fixture {
  baseUrl: string;
  received: string[];
  close(): Promise<void>;
}

export async function startLeakFixture(): Promise<Fixture> {
  const received: string[] = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://localhost");
    if (req.method === "GET" && url.pathname === "/login") {
      res.end(
        `<!doctype html><title>Login</title><form method="POST" action="/login">` +
          `<input type="password" id="pw" name="pw"><button id="submit">Go</button></form>`,
      );
    } else if (req.method === "GET" && url.pathname === "/echo-form") {
      res.end(
        `<!doctype html><title>Echo</title><form method="POST" action="/echo">` +
          `<input type="text" id="msg" name="msg"><button id="submit">Go</button></form>`,
      );
    } else if (req.method === "GET" && url.pathname === "/track") {
      res.end(`<!doctype html><title>Tracked</title><body>tracked</body>`);
    } else if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        received.push(body);
        if (url.pathname === "/echo") {
          const msg = new URLSearchParams(body).get("msg") || "";
          res.end(`<!doctype html><title>Echoed</title><body><h1 id="out">${msg}</h1></body>`);
        } else {
          res.end(`<!doctype html><title>Account</title><body>Logged in.</body>`);
        }
      });
    } else {
      res.statusCode = 404;
      res.end("nope");
    }
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address() as { port: number };
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    received,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
