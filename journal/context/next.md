# Next — Context Bridge

## 2026-06-06 20:30 | Hero Demo Hardening & Superpowers Installation
- **Done:**
  - Implemented `ensureHumanAuth` in `scripts/demo/continuity.ts` to handle human-in-the-loop login during agent runs.
  - Integrated continuity check into `scripts/demo/hero-chatgpt-gmail.ts` (Google/Gmail only, ChatGPT blind).
  - Fixed `scripts/demo/hero-chatgpt-gmail.ts` to respect `FEATHER_DIR` and `FEATHER_WARM_WORKSPACE` environment variables, enabling isolated "burner" profile demos.
  - Installed `@obra/superpowers` extension for Gemini CLI (14 new skills).
  - Updated `README.md` with Hero Demo and Continuity feature details.
  - Verified continuity logic with unit tests (`tests/unit/scripts/continuity.test.ts`).
- **State:**
  - Burner directory prepared at `/run/user/1000/feather-demo` (RAM-backed, disposable on reboot).
  - User requested `/next` to verify work in a fresh conversation.
- **Next Action:**
  - User to run `/skills reload` in the fresh session.
  - User to verify the burner profile demo flow:
    1. Start server: `FEATHER_DIR="/run/user/1000/feather-demo" npm run dev`
    2. Warm burner: `FEATHER_DIR="/run/user/1000/feather-demo" FEATHER_WARM_WORKSPACE=demo npm run warm-session`
    3. Run Hero Demo: `FEATHER_DIR="/run/user/1000/feather-demo" FEATHER_WARM_WORKSPACE=demo npx ts-node scripts/demo/hero-chatgpt-gmail.ts`
  - Record the Hero Demo for LinkedIn debut.
