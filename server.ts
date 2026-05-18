import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper: run Circle CLI and return parsed JSON output
  const runCircle = async (args: string) => {
    try {
      const { stdout, stderr } = await execAsync(
        `npx --no-install @circle-fin/cli ${args}`
      );
      if (stderr && !stdout) throw new Error(stderr);
      return JSON.parse(stdout);
    } catch (error: any) {
      console.error(`Circle CLI Error: ${error.message}`);
      try {
        return JSON.parse(error.stdout || error.message);
      } catch {
        throw error;
      }
    }
  };

  // ── Terms ────────────────────────────────────────────────
  app.get("/api/terms/status", async (_req, res) => {
    try {
      res.json(await runCircle("terms show --output json"));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/terms/info", async (_req, res) => {
    try {
      res.json(await runCircle("terms show --init --output json"));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/terms/accept", async (_req, res) => {
    try {
      res.json(await runCircle("terms accept --output json"));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Auth ─────────────────────────────────────────────────
  app.get("/api/wallet/status", async (_req, res) => {
    try {
      res.json(await runCircle("wallet status --output json"));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/wallet/login/init", async (req, res) => {
    const { email } = req.body;
    try {
      const { stdout } = await execAsync(
        `npx --no-install @circle-fin/cli wallet login ${email} --init`
      );
      const match = stdout.match(/--request ([a-f0-9-]+)/);
      const requestId = match ? match[1] : null;
      res.json({ success: true, requestId, message: stdout });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/wallet/login/complete", async (req, res) => {
    const { requestId, otp } = req.body;
    try {
      const { stdout } = await execAsync(
        `npx --no-install @circle-fin/cli wallet login --request ${requestId} --otp ${otp}`
      );
      res.json({ success: true, message: stdout });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Wallet ────────────────────────────────────────────────
  app.get("/api/wallet/list", async (_req, res) => {
    try {
      res.json(
        await runCircle("wallet list --chain BASE --type agent --output json")
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/wallet/create", async (_req, res) => {
    try {
      res.json(await runCircle("wallet create --output json"));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/wallet/balance", async (req, res) => {
    const { address } = req.query;
    try {
      res.json(
        await runCircle(
          `wallet balance --address ${address} --chain BASE --output json`
        )
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Services Marketplace ──────────────────────────────────
  app.get("/api/services/search", async (req, res) => {
    const { q } = req.query;
    try {
      res.json(await runCircle(`services search "${q}" --output json`));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/services/inspect", async (req, res) => {
    const { url } = req.query;
    try {
      res.json(await runCircle(`services inspect "${url}" --output json`));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/services/pay", async (req, res) => {
    const { url, address, chain, data } = req.body;
    try {
      const dataFlag = data ? ` --data '${JSON.stringify(data)}'` : "";
      res.json(
        await runCircle(
          `services pay "${url}" --address ${address} --chain ${chain}${dataFlag} --output json`
        )
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Gateway ───────────────────────────────────────────────
  app.get("/api/gateway/balance", async (req, res) => {
    const { chain } = req.query;
    try {
      res.json(
        await runCircle(`gateway balance --chain ${chain ?? "BASE"} --output json`)
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/gateway/deposit", async (req, res) => {
    const { amount, address, chain, method } = req.body;
    try {
      res.json(
        await runCircle(
          `gateway deposit --amount ${amount} --address ${address} --chain ${chain} --method ${method ?? "eco"} --output json`
        )
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Frontend ──────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Circle Agent Wallet running at http://localhost:${PORT}\n`);
  });
}

startServer();
