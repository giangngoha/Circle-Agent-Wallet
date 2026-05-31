import type React from "react";
import { useState, useEffect } from "react";

type Step = "terms" | "login" | "wallet" | "balance" | "services";
type Wallet = { address: string; chain: string; id?: string; createDate?: string };
type Service = {
  name: string; url: string; price?: string;
  description?: string; supportsGateway?: boolean; supportsVanilla?: boolean;
};
type Receipt = {
  txHash?: string; amount?: string; chain?: string;
  serviceUrl?: string; result?: any; paidAt?: string; scheme?: string;
};

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  return res.json();
};

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: "terms", label: "Terms", icon: "◎" },
  { id: "login", label: "Login", icon: "⌘" },
  { id: "wallet", label: "Wallet", icon: "◈" },
  { id: "balance", label: "Balance", icon: "◑" },
  { id: "services", label: "Services", icon: "◆" },
];

// ── Design tokens ──────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #080a0f;
    --surface: #0d1117;
    --surface2: #161b22;
    --border: #21262d;
    --border2: #30363d;
    --text: #e6edf3;
    --text2: #8b949e;
    --text3: #484f58;
    --accent: #2563eb;
    --accent2: #1d4ed8;
    --green: #3fb950;
    --green-bg: #0d1f0f;
    --yellow: #d29922;
    --yellow-bg: #1c1a00;
    --red: #f85149;
    --red-bg: #1c0a0a;
    --purple: #8b5cf6;
    --purple-bg: #1a0f2e;
    --mono: 'DM Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.08) 0%, transparent 60%);
  }

  button { cursor: pointer; border: none; font-family: var(--sans); }
  input, select { font-family: var(--mono); }

  .wrap { max-width: 680px; margin: 0 auto; padding: 48px 24px 80px; }

  /* Header */
  .hd { display: flex; align-items: center; gap: 16px; margin-bottom: 48px; }
  .hd-logo {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, #1d4ed8, #7c3aed);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 800; color: #fff;
    box-shadow: 0 0 24px rgba(37,99,235,0.3);
  }
  .hd-title { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .hd-sub { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-top: 2px; }

  /* Stepper */
  .stepper { display: flex; align-items: center; gap: 0; margin-bottom: 40px; overflow-x: auto; padding-bottom: 4px; }
  .step-item { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
  .step-dot {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; transition: all .2s;
    border: 1px solid var(--border);
    background: var(--surface); color: var(--text3);
  }
  .step-dot.done { background: var(--accent); border-color: var(--accent); color: #fff; }
  .step-dot.active {
    background: linear-gradient(135deg, #1d4ed8, #7c3aed);
    border-color: transparent; color: #fff;
    box-shadow: 0 0 16px rgba(37,99,235,0.4);
  }
  .step-label { font-size: 11px; font-weight: 600; margin-left: 8px; color: var(--text3); letter-spacing: 0.5px; text-transform: uppercase; }
  .step-label.active { color: var(--text); }
  .step-label.done { color: var(--accent); }
  .step-line { width: 32px; height: 1px; background: var(--border); margin: 0 8px; flex-shrink: 0; }
  .step-line.done { background: var(--accent); }

  /* Card */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent);
  }
  .card-tag { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--accent); font-family: var(--mono); margin-bottom: 10px; }
  .card-title { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 8px; }
  .card-desc { font-size: 13px; color: var(--text2); line-height: 1.7; margin-bottom: 20px; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 8px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.2px;
    transition: all .15s; white-space: nowrap;
  }
  .btn-primary {
    background: var(--accent); color: #fff;
    box-shadow: 0 0 0 1px rgba(37,99,235,0.3);
  }
  .btn-primary:hover { background: var(--accent2); box-shadow: 0 0 16px rgba(37,99,235,0.3); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: var(--text2); border: 1px solid var(--border2); }
  .btn-ghost:hover { border-color: var(--text3); color: var(--text); }
  .btn-green { background: rgba(63,185,80,0.15); color: var(--green); border: 1px solid rgba(63,185,80,0.3); }
  .btn-green:hover { background: rgba(63,185,80,0.25); }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; }

  /* Inputs */
  .inp {
    width: 100%; padding: 10px 14px;
    background: var(--surface2); border: 1px solid var(--border2);
    border-radius: 8px; color: var(--text); font-size: 13px;
    transition: border-color .15s; outline: none; margin-bottom: 12px;
  }
  .inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .inp::placeholder { color: var(--text3); }
  select.inp { cursor: pointer; }

  /* Items */
  .item {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px 16px; margin-bottom: 8px;
  }
  .item-label { font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text3); font-family: var(--mono); margin-bottom: 6px; }
  .item-value { font-size: 14px; font-weight: 600; }

  /* Tags */
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; font-family: var(--mono);
  }
  .tag-green { background: var(--green-bg); color: var(--green); border: 1px solid rgba(63,185,80,0.2); }
  .tag-blue { background: rgba(37,99,235,0.1); color: #60a5fa; border: 1px solid rgba(37,99,235,0.2); }
  .tag-yellow { background: var(--yellow-bg); color: var(--yellow); border: 1px solid rgba(210,153,34,0.2); }
  .tag-purple { background: var(--purple-bg); color: var(--purple); border: 1px solid rgba(139,92,246,0.2); }

  /* Alerts */
  .alert { border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-top: 12px; line-height: 1.5; }
  .alert-error { background: var(--red-bg); border: 1px solid rgba(248,81,73,0.2); color: var(--red); }
  .alert-success { background: var(--green-bg); border: 1px solid rgba(63,185,80,0.2); color: var(--green); }

  /* Code block */
  .code {
    background: #010409; border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 16px; font-family: var(--mono);
    font-size: 12px; color: #79c0ff; overflow-x: auto;
    margin-bottom: 16px; white-space: pre-wrap; line-height: 1.6;
  }

  /* Service card */
  .svc-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; margin-bottom: 10px;
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 16px;
    transition: border-color .15s;
  }
  .svc-card:hover { border-color: var(--border2); }
  .svc-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .svc-desc { font-size: 12px; color: var(--text2); margin-bottom: 8px; line-height: 1.5; }
  .svc-url { font-size: 11px; color: var(--text3); font-family: var(--mono); word-break: break-all; }

  /* Receipt */
  .receipt-amount { font-size: 36px; font-weight: 800; color: var(--green); letter-spacing: -1px; }
  .receipt-sub { font-size: 13px; color: var(--text2); margin-top: 4px; }

  /* Overlay */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 16px;
    animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 20px; padding: 28px; max-width: 500px; width: 100%;
    max-height: 85vh; overflow-y: auto;
    animation: slideUp .2s ease;
    position: relative; z-index: 10000;
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }

  /* Divider */
  .divider { border-top: 1px solid var(--border); margin: 20px 0; }

  /* Row */
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  /* Tx history */
  .tx-item {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;
    cursor: pointer; transition: border-color .15s;
  }
  .tx-item:hover { border-color: var(--accent); }

  /* Suggestions */
  .suggestion {
    background: transparent; border: 1px solid var(--border);
    border-radius: 20px; padding: 5px 12px; font-size: 12px;
    color: var(--text2); font-family: var(--mono);
    transition: all .15s; cursor: pointer;
  }
  .suggestion:hover { border-color: var(--accent); color: var(--accent); }

  /* Search bar */
  .search-wrap { display: flex; gap: 10px; align-items: center; }
  .search-inp {
    flex: 1; padding: 12px 16px;
    background: var(--surface2); border: 1px solid var(--border2);
    border-radius: 10px; color: var(--text); font-size: 14px;
    outline: none; transition: border-color .15s; font-family: var(--mono);
  }
  .search-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  .search-inp::placeholder { color: var(--text3); }
`;

// ── Stepper Component ─────────────────────────────────────
function Stepper({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s.id} className="step-item">
          <div className={`step-dot ${i < idx ? "done" : i === idx ? "active" : ""}`}>
            {i < idx ? "✓" : s.icon}
          </div>
          <span className={`step-label ${i === idx ? "active" : i < idx ? "done" : ""}`}>{s.label}</span>
          {i < STEPS.length - 1 && <div className={`step-line ${i < idx ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────
function ReceiptModal({ r, onClose }: { r: Receipt; onClose: () => void }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="tag tag-green" style={{ marginBottom: 12 }}>✓ Payment Confirmed</div>
            <div className="receipt-amount">{r.amount ?? "—"}</div>
            <div className="receipt-sub">paid via {r.scheme ?? "Circle Gateway"} on {r.chain ?? "Base"}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {r.serviceUrl && (
          <div className="item">
            <div className="item-label">Service Endpoint</div>
            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--text2)", wordBreak: "break-all" }}>{r.serviceUrl}</div>
          </div>
        )}
        {r.txHash && (
          <div className="item">
            <div className="item-label">Transaction Hash</div>
            <div style={{ fontSize: 12, fontFamily: "var(--mono)", color: "#79c0ff", wordBreak: "break-all" }}>{r.txHash}</div>
          </div>
        )}
        {r.paidAt && (
          <div className="item">
            <div className="item-label">Timestamp</div>
            <div style={{ fontSize: 13, color: "var(--text2)" }}>{new Date(r.paidAt).toLocaleString()}</div>
          </div>
        )}
        {r.result && (
          <div className="item">
            <div className="item-label">Service Response</div>
            <pre style={{ fontSize: 12, color: "var(--text)", overflow: "auto", maxHeight: 200 }}>
              {JSON.stringify(r.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pay Modal ─────────────────────────────────────────────
function PayModal({ service, wallets, balances, onClose, onSuccess }: {
  service: Service; wallets: Wallet[];
  balances: Record<string, string>;
  onClose: () => void; onSuccess: (r: Receipt) => void;
}) {
  // Auto-select wallet with highest USDC balance
  const defaultWallet = wallets.reduce((best, w) => {
    const bal = parseFloat(balances[w.address] ?? "0");
    const bestBal = parseFloat(balances[best] ?? "0");
    return bal > bestBal ? w.address : best;
  }, wallets[0]?.address ?? "");

  const [wallet, setWallet] = useState(defaultWallet);
  const [chain, setChain] = useState("BASE");
  const [queryParams, setQueryParams] = useState(
    service.url.includes("by-symbol") ? "?symbols=ETH" :
    service.url.includes("by-address") ? "?addresses=0x..." : ""
  );
  const [inspectData, setInspectData] = useState<any>(null);
  const [gatewayBal, setGatewayBal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"setup" | "confirm" | "paying" | "deposit">("setup");
  const [error, setError] = useState("");
  const [depositAmt, setDepositAmt] = useState("0.5");
  const [depositMethod, setDepositMethod] = useState<"eco" | "direct">("direct");

  const inspect = async () => {
    setLoading(true); setError("");
    try {
      const d = await api(`/services/inspect?url=${encodeURIComponent(service.url)}`);
      setInspectData(d?.data ?? d);
      const gw = await api(`/gateway/balance?chain=${chain}&address=${wallet}`);
      setGatewayBal(gw?.data?.total ?? "0");
      setPhase("confirm");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const pay = async () => {
    setLoading(true); setPhase("paying"); setError("");
    try {
      const payUrl = service.url + queryParams;
      const d = await api("/services/pay", {
        method: "POST",
        body: JSON.stringify({ url: payUrl, address: wallet, chain }),
      });
      if (d?.error) {
        setPhase("confirm");
        setError(typeof d.error === "object" ? (d.error.message ?? JSON.stringify(d.error)) : String(d.error));
        return;
      }
      onSuccess({
        serviceUrl: service.url, paidAt: new Date().toISOString(),
        amount: d?.data?.payment?.amount ?? service.price,
        chain: d?.data?.payment?.chain ?? chain,
        scheme: d?.data?.payment?.scheme,
        txHash: d?.data?.payment?.txHash,
        result: d?.data?.response ?? d?.data?.result,
      });
    } catch (e: any) { setPhase("confirm"); setError(e.message); }
    finally { setLoading(false); }
  };

  const deposit = async () => {
    setLoading(true); setError("");
    try {
      const d = await api("/gateway/deposit", {
        method: "POST",
        body: JSON.stringify({ amount: depositAmt, address: wallet, chain, method: depositMethod }),
      });
      if (d?.error) { setError(typeof d.error === "object" ? (d.error.message ?? JSON.stringify(d.error)) : String(d.error)); return; }
      const gw = await api(`/gateway/balance?chain=${chain}&address=${wallet}`);
      setGatewayBal(gw?.data?.total ?? "0");
      setPhase("confirm");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="tag tag-blue" style={{ marginBottom: 10 }}>Pay for Service</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{service.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 4, wordBreak: "break-all" }}>{service.url}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Price badge */}
        {service.price && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <span className="tag tag-green">◎ {String(service.price)} USDC per call</span>
            {service.supportsGateway && <span className="tag tag-purple">Gateway ✓</span>}
            {service.supportsVanilla && <span className="tag tag-blue">Vanilla x402 ✓</span>}
          </div>
        )}

        {/* Setup phase */}
        {phase === "setup" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <div className="item-label" style={{ marginBottom: 6 }}>Wallet</div>
              <select className="inp" value={wallet} onChange={e => setWallet(e.target.value)}>
                {wallets.map(w => {
                  const bal = balances[w.address] ?? "0";
                  const funded = parseFloat(bal) > 0;
                  return (
                    <option key={w.address} value={w.address}>
                      {w.address.slice(0, 18)}… — {funded ? `${bal} USDC` : "0 USDC"}
                    </option>
                  );
                })}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="item-label" style={{ marginBottom: 6 }}>Chain</div>
              <select className="inp" value={chain} onChange={e => setChain(e.target.value)}>
                {["BASE", "MATIC", "ETH", "ARB", "OP"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {queryParams !== undefined && (
              <div style={{ marginBottom: 20 }}>
                <div className="item-label" style={{ marginBottom: 6 }}>Query Params <span style={{ color: "var(--text3)" }}>(optional)</span></div>
                <input
                  className="inp"
                  placeholder="e.g. ?symbols=ETH or ?symbols=ETH,BTC"
                  value={queryParams}
                  onChange={e => setQueryParams(e.target.value)}
                />
                <div style={{ fontSize: 11, color: "var(--text3)" }}>
                  Will be appended to URL: <span style={{ color: "var(--accent)", fontFamily: "var(--mono)" }}>{service.url}{queryParams}</span>
                </div>
              </div>
            )}
            <button className="btn btn-primary" onClick={inspect} disabled={loading}>
              {loading ? "Inspecting…" : "→ Inspect & Continue"}
            </button>
            {error && <div className="alert alert-error">{error}</div>}
          </>
        )}

        {/* Confirm phase */}
        {phase === "confirm" && inspectData && (
          <>
            <div className="divider" />
            {inspectData.price && (
              <div className="item" style={{ marginBottom: 10 }}>
                <div className="item-label">Price per call</div>
                <div className="item-value" style={{ color: "var(--green)", fontSize: 22 }}>
                  {(() => {
                    const p = inspectData.price;
                    if (typeof p === "object") return p.formatted ?? p.amount ?? "?";
                    // Remove any existing "USDC" or "$" from string
                    return String(p).replace(/USDC/gi, "").replace(/\$/g, "").trim();
                  })()} USDC
                </div>
              </div>
            )}
            {gatewayBal !== null && (
              <div className="item" style={{ marginBottom: 16 }}>
                <div className="item-label">Gateway Balance ({chain})</div>
                <div className="item-value" style={{ color: parseFloat(gatewayBal) > 0 ? "var(--green)" : "var(--yellow)" }}>
                  {gatewayBal} USDC
                </div>
              </div>
            )}
            <div className="row">
              <button className="btn btn-green" onClick={pay} disabled={loading}>
                {loading ? "Processing…" : "◎ Pay Now"}
              </button>
              <button className="btn btn-ghost" onClick={() => setPhase("deposit")}>
                ⚡ Fund Gateway
              </button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
          </>
        )}

        {/* Paying phase */}
        {phase === "paying" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ color: "var(--text2)", fontSize: 14 }}>Broadcasting payment on {chain}…</div>
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}

        {/* Deposit phase */}
        {phase === "deposit" && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Fund Gateway Balance</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>
              Gateway enables gasless, instant payments. Min deposit: 0.5 USDC.
            </div>
            <div className="row" style={{ marginBottom: 16 }}>
              <button
                className={`btn ${depositMethod === "direct" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDepositMethod("direct")}
              >
                ⚡ Direct (BASE, ~15min)
              </button>
              <button
                className={`btn ${depositMethod === "eco" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDepositMethod("eco")}
              >
                ♻ Eco (Polygon, ~30s)
              </button>
            </div>
            {depositMethod === "eco" && (
              <div className="alert" style={{ background: "var(--yellow-bg)", border: "1px solid rgba(210,153,34,0.2)", color: "var(--yellow)", marginBottom: 12 }}>
                ⚠ Eco deposits settle on Polygon — pay services must also use MATIC chain
              </div>
            )}
            <div className="item-label" style={{ marginBottom: 6 }}>Amount (USDC)</div>
            <input className="inp" type="number" min="0.5" step="0.1" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
            <div className="row">
              <button className="btn btn-primary" onClick={deposit} disabled={loading}>
                {loading ? "Depositing…" : "◎ Deposit"}
              </button>
              <button className="btn btn-ghost" onClick={() => setPhase(inspectData ? "confirm" : "setup")}>← Back</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState<Step>("terms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [termsInfo, setTermsInfo] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [email, setEmail] = useState("");
  const [requestId, setRequestId] = useState("");
  const [otp, setOtp] = useState("");
  const [loginPhase, setLoginPhase] = useState<"email" | "otp">("email");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [payingService, setPayingService] = useState<Service | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError(""); setMsg("");
    try { await fn(); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    run(async () => {
      const d = await api("/terms/status");
      if (d?.data?.accepted) {
        setTermsAccepted(true);
        const s = await api("/wallet/status");
        if (!s?.error) { setStep("wallet"); loadWallets(); }
        else setStep("login");
      }
    });
  }, []);

  const loadWallets = () => run(async () => {
    const d = await api("/wallet/list");
    // Sort by createDate ascending (oldest first = main wallet)
    const list: Wallet[] = (d?.data?.wallets || []).sort((a: any, b: any) =>
      new Date(a.createDate ?? 0).getTime() - new Date(b.createDate ?? 0).getTime()
    );
    setWallets(list);
  });

  const searchServices = () => run(async () => {
    const d = await api(`/services/search?q=${encodeURIComponent(query)}`);
    const list = d?.data?.services ?? [];
    setServices(Array.isArray(list) ? list : []);
    setHasSearched(true);
  });

  const checkBalances = () => run(async () => {
    const results: Record<string, string> = {};
    for (const w of wallets) {
      const d = await api(`/wallet/balance?address=${w.address}`);
      results[w.address] = d?.data?.balances?.find((t: any) => t.token?.symbol?.includes("USDC"))?.amount || "0";
    }
    setBalances(results);
    setStep("balance");
  });

  const handlePaySuccess = (r: Receipt) => {
    setPayingService(null);
    setViewReceipt(r);
    setReceipts(prev => [r, ...prev]);
  };

  const goBack = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  return (
    <>
      <style>{css}</style>
      {payingService && <PayModal service={payingService} wallets={wallets} balances={balances} onClose={() => setPayingService(null)} onSuccess={handlePaySuccess} />}
      {viewReceipt && <ReceiptModal r={viewReceipt} onClose={() => setViewReceipt(null)} />}

      <div className="wrap">
        {/* Header */}
        <div className="hd">
          <div className="hd-logo">◎</div>
          <div>
            <div className="hd-title">Circle Agent Wallet</div>
            <div className="hd-sub">agents.circle.com — agentic economy infrastructure</div>
          </div>
        </div>

        <Stepper current={step} />

        {/* ── Step 1: Terms ── */}
        {step === "terms" && (
          <div className="card">
            <div className="card-tag">Step 1 — Terms of Use</div>
            <div className="card-title">Accept Circle Terms</div>
            <div className="card-desc">The Circle CLI requires you to review and accept its Terms of Use before any wallet commands can run.</div>
            {!termsInfo ? (
              <button className="btn btn-primary" onClick={() => run(async () => { const d = await api("/terms/info"); setTermsInfo(d?.data); })} disabled={loading}>
                {loading ? "Loading…" : "Load Terms →"}
              </button>
            ) : (
              <>
                <div className="code">{termsInfo.termsOfUseUrl}{"\n"}{termsInfo.privacyPolicyUrl}{"\n\n"}{termsInfo.termsNotice}</div>
                <div className="row">
                  <button className="btn btn-primary" disabled={loading} onClick={() => run(async () => {
                    const d = await api("/terms/accept", { method: "POST" });
                    if (d?.data?.acceptance?.accepted) { setTermsAccepted(true); setMsg("Terms accepted!"); setTimeout(() => setStep("login"), 1000); }
                    else setError(JSON.stringify(d));
                  })}>
                    {loading ? "Accepting…" : "✓ Accept & Continue"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setTermsInfo(null)}>Cancel</button>
                </div>
              </>
            )}
            {termsAccepted && <div className="alert alert-success">✓ Terms already accepted on this machine</div>}
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}

        {/* ── Step 2: Login ── */}
        {step === "login" && (
          <div className="card">
            <div className="card-tag">Step 2 — Authentication</div>
            <div className="card-title">Login to Circle CLI</div>
            <div className="card-desc">Enter your Circle account email to receive a one-time passcode.</div>
            {loginPhase === "email" && (
              <>
                <input className="inp" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && run(async () => {
                  const d = await api("/wallet/login/init", { method: "POST", body: JSON.stringify({ email }) });
                  if (d.success && d.requestId) { setRequestId(d.requestId); setLoginPhase("otp"); setMsg(`OTP sent to ${email}`); }
                  else setError(d.error || "Failed");
                })} />
                <button className="btn btn-primary" disabled={loading || !email} onClick={() => run(async () => {
                  const d = await api("/wallet/login/init", { method: "POST", body: JSON.stringify({ email }) });
                  if (d.success && d.requestId) { setRequestId(d.requestId); setLoginPhase("otp"); setMsg(`OTP sent to ${email}`); }
                  else setError(d.error || "Failed");
                })}>
                  {loading ? "Sending…" : "Send OTP →"}
                </button>
              </>
            )}
            {loginPhase === "otp" && (
              <>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
                  Code sent to <span style={{ color: "var(--text)" }}>{email}</span>
                </div>
                <input className="inp" type="text" placeholder="Enter 6-digit code" value={otp} onChange={e => setOtp(e.target.value)} onKeyDown={e => e.key === "Enter" && run(async () => {
                  const d = await api("/wallet/login/complete", { method: "POST", body: JSON.stringify({ requestId, otp }) });
                  if (d.success) { setMsg("Logged in!"); setTimeout(() => { setStep("wallet"); loadWallets(); }, 800); }
                  else setError(d.error || "Invalid OTP");
                })} />
                <button className="btn btn-primary" disabled={loading || !otp} onClick={() => run(async () => {
                  const d = await api("/wallet/login/complete", { method: "POST", body: JSON.stringify({ requestId, otp }) });
                  if (d.success) { setMsg("Logged in!"); setTimeout(() => { setStep("wallet"); loadWallets(); }, 800); }
                  else setError(d.error || "Invalid OTP");
                })}>
                  {loading ? "Verifying…" : "Verify →"}
                </button>
              </>
            )}
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}

        {/* ── Step 3: Wallet ── */}
        {step === "wallet" && (
          <div className="card">
            <div className="card-tag">Step 3 — Agent Wallet</div>
            <div className="card-title">Wallets on BASE</div>
            <div className="card-desc">Your agent-controlled wallets that can hold USDC and pay for services autonomously.</div>
            {wallets.length === 0 ? (
              <>
                <div style={{ color: "var(--yellow)", fontSize: 13, marginBottom: 16 }}>No agent wallets found on BASE.</div>
                <div className="row">
                  <button className="btn btn-primary" disabled={loading} onClick={() => run(async () => {
                    await api("/wallet/create", { method: "POST" });
                    setMsg("Wallet created on BASE!"); await loadWallets();
                  })}>
                    {loading ? "Creating…" : "+ Create Wallet"}
                  </button>
                  <button className="btn btn-ghost" onClick={loadWallets} disabled={loading}>↻ Refresh</button>
                </div>
              </>
            ) : (
              <>
                {wallets.map((w, idx) => (
                  <div key={w.id ?? w.address} className="item">
                    <div className="row" style={{ marginBottom: 6 }}>
                      <span className="tag tag-blue">BASE</span>
                      <span className="tag tag-purple">Agent</span>
                      {idx === 0 && <span className="tag tag-green">★ Primary</span>}
                      {(w as any).createDate && (
                        <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>
                          {new Date((w as any).createDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text2)", wordBreak: "break-all" }}>{w.address}</div>
                  </div>
                ))}
                <div className="row" style={{ marginTop: 16 }}>
                  <button className="btn btn-primary" disabled={loading} onClick={checkBalances}>
                    {loading ? "Checking…" : "Check Balances →"}
                  </button>
                  <button className="btn btn-ghost" onClick={loadWallets} disabled={loading}>↻ Refresh</button>
                </div>
              </>
            )}
            {msg && <div className="alert alert-success">{msg}</div>}
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}

        {/* ── Step 4: Balance ── */}
        {step === "balance" && (
          <div className="card">
            <div className="card-tag">Step 4 — USDC Balance</div>
            <div className="card-title">Wallet Balances</div>
            <div className="card-desc">
              Send USDC on <strong>BASE network</strong> to your wallet address to fund it.
              Then deposit into Gateway for gasless payments.
            </div>
            {wallets.map(w => {
              const bal = balances[w.address] ?? "—";
              const funded = parseFloat(bal) > 0;
              return (
                <div key={w.id} className="item">
                  <div className="row" style={{ marginBottom: 8 }}>
                    <span className={`tag ${funded ? "tag-green" : "tag-yellow"}`}>
                      {funded ? `◎ ${bal} USDC` : "0 USDC — needs funding"}
                    </span>
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text3)" }}>{w.address}</div>
                </div>
              );
            })}
            <div className="row" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setStep("services")}>
                Explore Services →
              </button>
              <button className="btn btn-ghost" disabled={loading} onClick={checkBalances}>↻ Refresh</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
          </div>
        )}

        {/* ── Step 5: Services ── */}
        {step === "services" && (
          <>
            <div className="card">
              <div className="card-tag">Step 5 — Agent Marketplace</div>
              <div className="card-title">Discover & Pay Services</div>
              <div className="card-desc">
                537+ paid API endpoints. Pay with USDC via Circle Gateway — gasless, instant, with an on-chain receipt.
              </div>
              <div className="search-wrap">
                <input
                  className="search-inp"
                  placeholder='Search services… e.g. "eth price", "nft", "twitter"'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchServices()}
                />
                <button className="btn btn-primary" disabled={loading || !query} onClick={searchServices}>
                  {loading ? "…" : "Search"}
                </button>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                {["eth price", "nft", "bitcoin", "twitter", "domain"].map(q => (
                  <button key={q} className="suggestion" onClick={() => setQuery(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {services.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 16 }}>
                  {services.length} endpoint{services.length !== 1 ? "s" : ""} found
                </div>
                {services.map((s, i) => (
                  <div key={i} className="svc-card">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="svc-name">{s.name || "Service"}</div>
                      {s.description && <div className="svc-desc">{s.description}</div>}
                      <div className="row">
                        {s.price && <span className="tag tag-green">◎ {s.price} USDC</span>}
                        {s.supportsGateway && <span className="tag tag-purple">Gateway</span>}
                        {s.supportsVanilla && <span className="tag tag-blue">Vanilla</span>}
                      </div>
                      <div className="svc-url" style={{ marginTop: 8 }}>{s.url}</div>
                    </div>
                    <button className="btn btn-green btn-sm" onClick={() => setPayingService(s)}>
                      ◎ Pay
                    </button>
                  </div>
                ))}
              </div>
            )}

            {services.length === 0 && !loading && hasSearched && (
              <div className="card">
                <div style={{ color: "var(--yellow)", fontSize: 13 }}>No results for "{query}" — try "eth price" or "nft"</div>
              </div>
            )}

            {/* Transaction history */}
            {receipts.length > 0 && (
              <div className="card">
                <div className="card-tag">Transaction History</div>
                {receipts.map((r, i) => (
                  <div key={i} className="tx-item" onClick={() => setViewReceipt(r)}>
                    <div className="row" style={{ marginBottom: 6 }}>
                      <span className="tag tag-green">✓ {r.amount}</span>
                      <span className="tag tag-blue">{r.chain}</span>
                      <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>
                        {r.paidAt ? new Date(r.paidAt).toLocaleTimeString() : ""}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)" }}>{r.serviceUrl}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {step !== "terms" && (
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={goBack}>← Back</button>
        )}
      </div>
    </>
  );
}
