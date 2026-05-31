# Circle Agent Wallet

A step-by-step web UI for setting up a Circle Agent Wallet — following the official [Circle Agent Stack](https://agents.circle.com) setup flow.

## What This Does

Walks you through every step from `setup.md` (`https://agents.circle.com/skills/setup.md`) via a browser UI:

1. **Terms** — Load and accept Circle CLI Terms of Use
2. **Login** — Authenticate via email OTP
3. **Wallet** — List or create an agent wallet on BASE
4. **Balance** — Check USDC balances and get funding instructions
5. **Services** — Search the Agent Marketplace (537+ paid endpoints)

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm install -g @circle-fin/cli
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## How It Works

```
Browser UI (React)
      │
      │  REST API calls
      ▼
Express Server (server.ts)
      │
      │  execAsync(circle ...)
      ▼
Circle CLI (@circle-fin/cli)
      │
      │  HTTPS
      ▼
Circle Agent Stack API
```

The server wraps every Circle CLI command (`circle wallet status`, `circle wallet list`, etc.) as a REST endpoint, so the React frontend can drive the full setup flow through a browser.

## Funding Your Wallet

After creating a wallet, send USDC on the **BASE network** to your wallet address. Two options:

- **From an existing wallet** — Send USDC (BASE) to the displayed address
- **Fiat on-ramp** — Follow the link to [agents.circle.com](https://agents.circle.com)

## Paying for Services (CLI)

Once funded, pay for marketplace services directly from the terminal:

```bash
circle services search "eth price" --output json
circle services pay "<service-url>" --address <your-address> --chain BASE
```

## Project Structure

```
circle-agent-wallet/
├── .devcontainer/
│   └── devcontainer.json    # Codespaces config (auto-installs CLI)
├── src/
│   ├── App.tsx              # Step-by-step React UI
│   ├── main.tsx
│   └── index.css
├── server.ts                # Express + Circle CLI wrapper
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## References

- [agents.circle.com](https://agents.circle.com) — Official Circle Agent Stack portal
- [setup.md](https://agents.circle.com/skills/setup.md) — Official setup instructions
- [Circle Developer Docs](https://developers.circle.com) — Full API reference
