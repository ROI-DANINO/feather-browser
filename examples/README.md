# Examples

## `quickstart.sh` — the 60-second demo

Runs the full Feather session loop against a live server:
**health → launch → navigate → snapshot → extract → screenshot → debug-bundle → close.**

### Prerequisites

- Node.js 20+ and `curl`
- Feather running in another terminal:

  ```bash
  npm run dev
  ```

  Leave it running. It prints an `Endpoint:` line — the demo finds it automatically.

### Run

```bash
./examples/quickstart.sh
```

If it can't find the server, set the endpoint path explicitly to the `Endpoint:` line the
server printed:

```bash
FEATHER_ENDPOINT_FILE=/path/to/feather/run/endpoint.json ./examples/quickstart.sh
```

The script exits non-zero and prints the failing step if anything goes wrong. It uses a
disposable profile against a public page, so it is safe to re-run.
