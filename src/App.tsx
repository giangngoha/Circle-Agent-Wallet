import type React from "react";
import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────
type Step = "terms" | "login" | "wallet" | "balance" | "services";
type Wallet = { address: string; chain: string; id: string };
type Service = { name: string; url: string; price?: string; description?: string };
type Receipt = {
  txHash?: string;
  amount?: string;
  chain?: string;
  serviceUrl?: string;
  result?: unknown;
  paidAt?: string;
};

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
};

// ── Styles ────────────────────────────────────────────────
const S = {
  wrap: { maxWidth: 720, margin: "0 auto", padding: "32px 16px" } as React.CSSProperties,
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 36 } as React.CSSProperties,
  logo: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 700,
  } as React.CSSProperties,
  title: { fontSize: 22, fontWeight: 700, color: "#f1f5f9" } as React.CSSProperties,
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 2 } as React.CSSProperties,
  card: {
    background: "#111827", border: "1px solid #1e293b",
    borderRadius: 14, padding: "24px 28px", marginBottom: 20,
  } as React.CSSProperties,
  stepLabel: {
    fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: 1, color: "#2563eb", marginBottom: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 },
  cardDesc: { fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 18 },
  btn: (variant: "primary" | "secondary" | "green" = "primary") =>
    ({
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600,
      transition: "opacity .15s", cursor: "pointer",
      background:
        variant === "primary" ? "linear-gradient(135deg,#2563eb,#7c3aed)"
        : variant === "green" ? "linear-gradient(135deg,#059669,#0d9488)"
        : "#1e293b",
      color: "#fff",
      border: variant === "secondary" ? "1px solid #334155" : "none",
    } as React.CSSProperties),
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "#1e293b", border: "1px solid #334155",
    color: "#f1f5f9", fontSize: 14, marginBottom: 12,
  } as React.CSSProperties,
  select: {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    background: "#1e293b", border: "1px solid #334155",
    color: "#f1f5f9", fontSize: 14, marginBottom: 12,
  } as React.CSSProperties,
  tag: (color: "green" | "blue" | "yellow" | "purple") => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: color === "green" ? "#052e16" : color === "blue" ? "#0f172a" : color === "yellow" ? "#1c1003" : "#1a0a2e",
    color: color === "green" ? "#4ade80" : color === "blue" ? "#60a5fa" : color === "yellow" ? "#fbbf24" : "#c084fc",
  } as React.CSSProperties),
  itemCard: {
    background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 10, padding: "14px 18px", marginBottom: 10,
  } as React.CSSProperties,
  code: {
    background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 8, padding: "12px 16px", fontFamily: "monospace",
    fontSize: 13, color: "#7dd3fc", overflowX: "auto" as const,
    marginBottom: 16, whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,
  error: {
    background: "#1c0a0a", border: "1px solid #7f1d1d",
    borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 10,
  } as React.CSSProperties,
  success: {
    background: "#052e16", border: "1px solid #166534",
    borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 13, marginTop: 10,
  } as React.CSSProperties,
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const },
  divider: { borderTop: "1px solid #1e293b", margin: "20px 0" } as React.CSSProperties,
  overlay: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
  } as React.CSSProperties,
};

// ── Stepper ────────────────────────────────────────────────
const STEPS: { id: Step; label: string }[] = [
  { id: "terms", label: "Terms" },
  { id: "login", label: "Login" },
  { id: "wallet", label: "Wallet" },
  { id: "balance", label: "Balance" },
  { id: "services", label: "Services" },
];

function Stepper({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div style={{ display: "flex", gap: 0, marginBottom: 32, alignItems: "center", flexWrap: "wrap" }}>
      {STEPS.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: i < idx ? "#2563eb" : i === idx ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "#1e293b",
            border: i === idx ? "2px solid #7c3aed" : "2px solid transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: i <= idx ? "#fff" : "#475569",
          }}>
            {i < idx ? "✓" : i + 1}
          </div>
          <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 600, color: i === idx ? "#f1f5f9" : i < idx ? "#60a5fa" : "#475569" }}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div style={{ width: 24, height: 2, background: i < idx ? "#2563eb" : "#1e293b", margin: "0 8px", flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Receipt Modal ──────────────────────────────────────────
function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.card, maxWidth: 480, width: "100%", marginBottom: 0, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#4ade80" }}>✅ Payment Receipt</span>
          <button onClick={onClose} style={{ ...S.btn("secondary"), padding: "6px 12px", fontSize: 13 }}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {receipt.amount && (
            <div style={S.itemCard}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>AMOUNT PAID</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#4ade80" }}>{receipt.amount} USDC</div>
            </div>
          )}
          {receipt.chain && (
            <div style={S.itemCard}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>NETWORK</div>
              <span style={S.tag("blue")}>{receipt.chain}</span>
            </div>
          )}
          {receipt.serviceUrl && (
            <div style={S.itemCard}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>SERVICE</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace", wordBreak: "break-all" }}>{receipt.serviceUrl}</div>
            </div>
          )}
          {receipt.txHash && (
            <div style={S.itemCard}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>TX HASH</div>
              <div style={{ fontSize: 12, color: "#7dd3fc", fontFamily: "monospace", wordBreak: "break-all" }}>{receipt.txHash}</div>
            </div>
          )}
          {receipt.paidAt && (
            <div style={S.itemCard}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>TIMESTAMP</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>{new Date(receipt.paidAt).toLocaleString()}</div>
            </div>
          )}
          {receipt.result && (
            <div style={S.itemCard}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>SERVICE RESPONSE</div>
              <pre style={{ fontSize: 12, color: "#e2e8f0", overflow: "auto", maxHeight: 240, margin: 0 }}>
                {JSON.stringify(receipt.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pay Modal ──────────────────────────────────────────────
function PayModal({ service, wallets, onClose, onSuccess }: {
  service: Service;
  wallets: Wallet[];
  onClose: () => void;
  onSuccess: (r: Receipt) => void;
}) {
  const [wallet, setWallet] = useState(wallets[0]?.address ?? "");
  const [chain, setChain] = useState("BASE");
  const [inspectData, setInspectData] = useState<any>(null);
  const [gatewayBal, setGatewayBal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"setup" | "confirm" | "paying" | "deposit">("setup");
  const [error, setError] = useState("");
  const [depositAmt, setDepositAmt] = useState("1");
  const [depositMethod, setDepositMethod] = useState<"eco" | "direct">("eco");

  const inspect = async () => {
    setLoading(true); setError("");
    try {
      const d = await api(`/services/inspect?url=${encodeURIComponent(service.url)}`);
      setInspectData(d?.data ?? d);
      const gw = await api(`/gateway/balance?chain=${chain}`);
      setGatewayBal(gw?.data?.balance ?? gw?.data?.amount ?? "0");
      setPhase("confirm");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const pay = async () => {
    setLoading(true); setPhase("paying"); setError("");
    try {
      const d = await api("/services/pay", {
        method: "POST",
        body: JSON.stringify({ url: service.url, address: wallet, chain }),
      });
      if (d?.error) {
        const isGatewayErr = d.error.includes("Gateway") || d.error.includes("deposit") || d.error.includes("Insufficient");
        setPhase(isGatewayErr ? "deposit" : "confirm");
        setError(d.error);
        return;
      }
      onSuccess({
        serviceUrl: service.url,
        paidAt: new Date().toISOString(),
        amount: d?.data?.payment?.amount ?? inspectData?.price ?? service.price,
        chain: d?.data?.payment?.chain ?? chain,
        txHash: d?.data?.payment?.txHash ?? d?.data?.txHash,
        result: d?.data?.response ?? d?.data?.result ?? d?.data,
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
      if (d?.error) { setError(d.error); return; }
      const gw = await api(`/gateway/balance?chain=${chain}`);
      setGatewayBal(gw?.data?.balance ?? gw?.data?.amount ?? "0");
      setPhase("confirm");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.overlay}>
      <div style={{ ...S.card, maxWidth: 520, width: "100%", marginBottom: 0, maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>💳 Pay for Service</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "monospace", wordBreak: "break-all" }}>{service.url}</div>
          </div>
          <button onClick={onClose} style={{ ...S.btn("secondary"), padding: "6px 12px", fontSize: 13, flexShrink: 0, marginLeft: 12 }}>✕</button>
        </div>

        {/* Service pill */}
        <div style={S.itemCard}>
          <div style={S.row}>
            <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{service.name || "Service"}</span>
            {service.price && <span style={S.tag("green")}>{service.price} USDC</span>}
          </div>
          {service.description && <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{service.description}</div>}
        </div>

        {/* ── Phase: Setup ── */}
        {phase === "setup" && (
          <>
            <div style={S.cardDesc}>Choose your wallet and chain, then inspect to confirm pricing.</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Wallet</div>
            <select style={S.select} value={wallet} onChange={(e) => setWallet(e.target.value)}>
              {wallets.map((w) => <option key={w.id} value={w.address}>{w.address.slice(0, 22)}…</option>)}
            </select>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Chain</div>
            <select style={S.select} value={chain} onChange={(e) => setChain(e.target.value)}>
              {["BASE", "MATIC", "ETH", "ARB", "OP", "AVAX"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button style={S.btn()} onClick={inspect} disabled={loading}>
              {loading ? "Inspecting…" : "🔍 Inspect Service"}
            </button>
            {error && <div style={S.error}>⚠ {error}</div>}
          </>
        )}

        {/* ── Phase: Confirm ── */}
        {phase === "confirm" && inspectData && (
          <>
            <div style={S.divider} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>Inspection Result</div>

            {inspectData.price && (
              <div style={{ ...S.itemCard, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>PRICE PER CALL</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80" }}>{inspectData.price} USDC</div>
              </div>
            )}

            {inspectData.accepts && (
              <div style={{ ...S.itemCard, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>ACCEPTED SCHEMES</div>
                <div style={S.row}>
                  {(Array.isArray(inspectData.accepts) ? inspectData.accepts : [inspectData.accepts]).map((a: any, i: number) => (
                    <span key={i} style={S.tag(a?.extra?.name?.includes("Gateway") ? "purple" : "blue")}>
                      {a?.extra?.name ?? a?.network ?? "x402"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gatewayBal !== null && (
              <div style={{ ...S.itemCard, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>YOUR GATEWAY BALANCE ({chain})</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: parseFloat(gatewayBal) > 0 ? "#4ade80" : "#fbbf24" }}>
                  {gatewayBal} USDC
                  {parseFloat(gatewayBal) === 0 && " — consider funding Gateway for gasless payments"}
                </div>
              </div>
            )}

            <details style={{ marginBottom: 16 }}>
              <summary style={{ fontSize: 12, color: "#475569", cursor: "pointer" }}>Raw inspect JSON</summary>
              <pre style={{ ...S.code, marginTop: 8, marginBottom: 0, fontSize: 11 }}>{JSON.stringify(inspectData, null, 2)}</pre>
            </details>

            <div style={S.row}>
              <button style={S.btn("green")} onClick={pay} disabled={loading}>
                {loading ? "Processing…" : "💸 Pay Now"}
              </button>
              <button style={S.btn("secondary")} onClick={() => setPhase("deposit")}>
                ⚡ Fund Gateway First
              </button>
            </div>
            {error && <div style={S.error}>⚠ {error}</div>}
          </>
        )}

        {/* ── Phase: Paying ── */}
        {phase === "paying" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
            <div style={{ color: "#94a3b8" }}>Signing and broadcasting payment…</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Settlement via Circle Gateway on {chain}</div>
            {error && <div style={S.error}>⚠ {error}</div>}
          </div>
        )}

        {/* ── Phase: Gateway Deposit ── */}
        {phase === "deposit" && (
          <>
            <div style={S.divider} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>⚡ Fund Gateway Balance</div>
            <div style={S.cardDesc}>
              Gateway enables gasless, near-instant payments (&lt;500ms per call). Deposit USDC once, then pay any compatible service instantly.
            </div>

            {/* Method selection */}
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Deposit method</div>
            <div style={{ ...S.row, marginBottom: 14 }}>
              <button
                style={{ ...S.btn(depositMethod === "eco" ? "green" : "secondary"), padding: "8px 14px", fontSize: 13 }}
                onClick={() => setDepositMethod("eco")}
              >
                ♻ Eco (~30-50s, $0.03 fee)
              </button>
              <button
                style={{ ...S.btn(depositMethod === "direct" ? "primary" : "secondary"), padding: "8px 14px", fontSize: 13 }}
                onClick={() => setDepositMethod("direct")}
              >
                ⚡ Direct (~8-19 min)
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>
              {depositMethod === "eco"
                ? "✅ Recommended: deposits BASE USDC → settles on Polygon in ~30-50s for $0.03 fee. Best for most workflows."
                : "Direct deposit on selected chain. Faster for non-BASE chains; BASE takes 13-19 min for block finality."}
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Amount (USDC)</div>
            <input
              style={S.input}
              type="number" min="0.01" step="0.01"
              value={depositAmt}
              onChange={(e) => setDepositAmt(e.target.value)}
            />

            <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
              Wallet: <span style={{ color: "#7dd3fc", fontFamily: "monospace" }}>{wallet.slice(0, 20)}…</span> · Chain: {chain}
            </div>

            <div style={S.row}>
              <button style={S.btn("green")} onClick={deposit} disabled={loading}>
                {loading ? "Depositing…" : "💰 Deposit to Gateway"}
              </button>
              <button style={S.btn("secondary")} onClick={() => setPhase(inspectData ? "confirm" : "setup")}>
                ← Back
              </button>
            </div>
            {error && <div style={S.error}>⚠ {error}</div>}
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
    setWallets(d?.data?.wallets || []);
  });

  const handlePaySuccess = (r: Receipt) => {
    setPayingService(null);
    setViewReceipt(r);
    setReceipts((prev) => [r, ...prev]);
  };

  return (
    <div style={S.wrap}>
      {payingService && (
        <PayModal service={payingService} wallets={wallets} onClose={() => setPayingService(null)} onSuccess={handlePaySuccess} />
      )}
      {viewReceipt && <ReceiptModal receipt={viewReceipt} onClose={() => setViewReceipt(null)} />}

      <div style={S.header}>
        <div style={S.logo}>◎</div>
        <div>
          <div style={S.title}>Circle Agent Wallet</div>
          <div style={S.subtitle}>Financial infrastructure for the agentic economy</div>
        </div>
      </div>

      <Stepper current={step} />

      {/* Step 1: Terms */}
      {step === "terms" && (
        <div style={S.card}>
          <div style={S.stepLabel}>Step 1 of 5</div>
          <div style={S.cardTitle}>Accept Circle Terms of Use</div>
          <div style={S.cardDesc}>The Circle CLI requires you to review and accept its Terms before any wallet commands can run.</div>
          {!termsInfo ? (
            <button style={S.btn()} onClick={() => run(async () => { const d = await api("/terms/info"); setTermsInfo(d?.data); })} disabled={loading}>
              {loading ? "Loading…" : "📄 Load Terms"}
            </button>
          ) : (
            <>
              <div style={S.code}>Terms of Use:   {termsInfo.termsOfUseUrl}{"\n"}Privacy Policy: {termsInfo.privacyPolicyUrl}{"\n\n"}{termsInfo.termsNotice}</div>
              <div style={S.cardDesc}>Please review both links above. Do you accept?</div>
              <div style={S.row}>
                <button style={S.btn()} disabled={loading} onClick={() => run(async () => {
                  const d = await api("/terms/accept", { method: "POST" });
                  if (d?.data?.acceptance?.accepted) { setTermsAccepted(true); setMsg("Terms accepted!"); setTimeout(() => setStep("login"), 1200); }
                  else setError(JSON.stringify(d));
                })}>
                  {loading ? "Accepting…" : "✅ Yes, I Accept"}
                </button>
                <button style={S.btn("secondary")} onClick={() => setTermsInfo(null)}>Cancel</button>
              </div>
            </>
          )}
          {termsAccepted && <div style={S.success}>✓ Terms already accepted on this machine.</div>}
          {msg && <div style={S.success}>{msg}</div>}
          {error && <div style={S.error}>⚠ {error}</div>}
        </div>
      )}

      {/* Step 2: Login */}
      {step === "login" && (
        <div style={S.card}>
          <div style={S.stepLabel}>Step 2 of 5</div>
          <div style={S.cardTitle}>Login to Circle CLI</div>
          <div style={S.cardDesc}>Enter your Circle account email. An OTP will be sent.</div>
          {loginPhase === "email" && (
            <>
              <input style={S.input} type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button style={S.btn()} disabled={loading || !email} onClick={() => run(async () => {
                const d = await api("/wallet/login/init", { method: "POST", body: JSON.stringify({ email }) });
                if (d.success && d.requestId) { setRequestId(d.requestId); setLoginPhase("otp"); setMsg(`OTP sent to ${email}`); }
                else setError(d.error || "Failed");
              })}>
                {loading ? "Sending…" : "📧 Send OTP"}
              </button>
            </>
          )}
          {loginPhase === "otp" && (
            <>
              <div style={S.cardDesc}>OTP sent to <strong style={{ color: "#60a5fa" }}>{email}</strong></div>
              <input style={S.input} type="text" placeholder="Enter OTP code" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <button style={S.btn()} disabled={loading || !otp} onClick={() => run(async () => {
                const d = await api("/wallet/login/complete", { method: "POST", body: JSON.stringify({ requestId, otp }) });
                if (d.success) { setMsg("Logged in!"); setTimeout(() => { setStep("wallet"); loadWallets(); }, 1000); }
                else setError(d.error || "Invalid OTP");
              })}>
                {loading ? "Verifying…" : "🔐 Verify OTP"}
              </button>
            </>
          )}
          {msg && <div style={S.success}>{msg}</div>}
          {error && <div style={S.error}>⚠ {error}</div>}
        </div>
      )}

      {/* Step 3: Wallet */}
      {step === "wallet" && (
        <div style={S.card}>
          <div style={S.stepLabel}>Step 3 of 5</div>
          <div style={S.cardTitle}>Agent Wallets on BASE</div>
          <div style={S.cardDesc}>Your agent wallets that can hold USDC and pay for services.</div>
          {wallets.length === 0 ? (
            <>
              <div style={{ ...S.cardDesc, color: "#fbbf24" }}>No agent wallets found. Create one to get started.</div>
              <div style={S.row}>
                <button style={S.btn()} disabled={loading} onClick={() => run(async () => {
                  await api("/wallet/create", { method: "POST" });
                  setMsg("Wallet created!"); await loadWallets();
                })}>
                  {loading ? "Creating…" : "➕ Create Agent Wallet"}
                </button>
                <button style={S.btn("secondary")} onClick={loadWallets} disabled={loading}>🔄 Refresh</button>
              </div>
            </>
          ) : (
            <>
              {wallets.map((w) => (
                <div key={w.id} style={S.itemCard}>
                  <div style={S.row}>
                    <span style={S.tag("blue")}>BASE</span>
                    <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 13 }}>{w.address}</span>
                  </div>
                </div>
              ))}
              <div style={{ ...S.row, marginTop: 12 }}>
                <button style={S.btn()} disabled={loading} onClick={() => run(async () => {
                  const results: Record<string, string> = {};
                  for (const w of wallets) {
                    const d = await api(`/wallet/balance?address=${w.address}`);
                    results[w.address] = d?.data?.tokenBalances?.find((t: any) => t.token?.symbol?.includes("USDC"))?.amount || "0";
                  }
                  setBalances(results); setStep("balance");
                })}>
                  {loading ? "Checking…" : "💰 Check Balances →"}
                </button>
                <button style={S.btn("secondary")} onClick={loadWallets} disabled={loading}>🔄 Refresh</button>
              </div>
            </>
          )}
          {msg && <div style={S.success}>{msg}</div>}
          {error && <div style={S.error}>⚠ {error}</div>}
        </div>
      )}

      {/* Step 4: Balance */}
      {step === "balance" && (
        <div style={S.card}>
          <div style={S.stepLabel}>Step 4 of 5</div>
          <div style={S.cardTitle}>USDC Wallet Balances</div>
          <div style={S.cardDesc}>
            Fund by sending USDC on BASE to your wallet address, or visit{" "}
            <a href="https://agents.circle.com" target="_blank" style={{ color: "#60a5fa" }}>agents.circle.com</a>.
          </div>
          {wallets.map((w) => {
            const bal = balances[w.address] ?? "—";
            const funded = parseFloat(bal) > 0;
            return (
              <div key={w.id} style={S.itemCard}>
                <div style={S.row}>
                  <span style={S.tag(funded ? "green" : "yellow")}>{funded ? `${bal} USDC` : "0 USDC — needs funding"}</span>
                </div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 6, fontFamily: "monospace" }}>{w.address}</div>
              </div>
            );
          })}
          <div style={{ ...S.row, marginTop: 16 }}>
            <button style={S.btn()} onClick={() => setStep("services")}>🔍 Explore & Pay Services →</button>
            <button style={S.btn("secondary")} disabled={loading} onClick={() => run(async () => {
              const results: Record<string, string> = {};
              for (const w of wallets) {
                const d = await api(`/wallet/balance?address=${w.address}`);
                results[w.address] = d?.data?.tokenBalances?.find((t: any) => t.token?.symbol?.includes("USDC"))?.amount || "0";
              }
              setBalances(results);
            })}>
              🔄 Refresh
            </button>
          </div>
          {error && <div style={S.error}>⚠ {error}</div>}
        </div>
      )}

      {/* Step 5: Services + Pay */}
      {step === "services" && (
        <>
          {/* Search */}
          <div style={S.card}>
            <div style={S.stepLabel}>Step 5 of 5</div>
            <div style={S.cardTitle}>Agent Marketplace</div>
            <div style={S.cardDesc}>
              Search 537+ paid API endpoints. Pay with USDC via Circle Gateway — gasless, instant, with a receipt.
            </div>
            <div style={S.row}>
              <input
                style={{ ...S.input, flex: 1, marginBottom: 0 }}
                type="text"
                placeholder='e.g. "eth price", "web search", "twitter sentiment"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run(async () => {
                  const d = await api(`/services/search?q=${encodeURIComponent(query)}`);
                  setServices(Array.isArray(d?.data?.services ?? d?.data) ? (d?.data?.services ?? d?.data) : []);
                })}
              />
              <button style={S.btn()} disabled={loading || !query} onClick={() => run(async () => {
                const d = await api(`/services/search?q=${encodeURIComponent(query)}`);
                setServices(Array.isArray(d?.data?.services ?? d?.data) ? (d?.data?.services ?? d?.data) : []);
              })}>
                {loading ? "Searching…" : "🔍 Search"}
              </button>
            </div>
            {/* Quick suggestions */}
            <div style={{ ...S.row, marginTop: 10 }}>
              {["eth price", "bitcoin", "web search", "twitter", "ai research"].map((q) => (
                <button key={q} style={{ ...S.btn("secondary"), padding: "6px 12px", fontSize: 12 }} onClick={() => setQuery(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {services.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12 }}>
                {services.length} result{services.length !== 1 ? "s" : ""}
              </div>
              {services.map((s, i) => (
                <div key={i} style={{ ...S.itemCard, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{s.name || s.url}</div>
                    {s.description && <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{s.description}</div>}
                    <div style={S.row}>
                      {s.price && <span style={S.tag("green")}>{s.price} USDC</span>}
                      <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace", wordBreak: "break-all" }}>{s.url}</span>
                    </div>
                  </div>
                  <button
                    style={{ ...S.btn("green"), padding: "8px 16px", fontSize: 13, flexShrink: 0 }}
                    onClick={() => setPayingService(s)}
                  >
                    💸 Pay
                  </button>
                </div>
              ))}
            </div>
          )}

          {services.length === 0 && !loading && query && (
            <div style={S.card}>
              <div style={{ color: "#fbbf24" }}>No services found for "{query}". Try "eth price" or "twitter".</div>
            </div>
          )}

          {/* Transaction History */}
          {receipts.length > 0 && (
            <div style={S.card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>
                📋 Transaction History ({receipts.length})
              </div>
              {receipts.map((r, i) => (
                <div key={i} style={{ ...S.itemCard, cursor: "pointer" }} onClick={() => setViewReceipt(r)}>
                  <div style={S.row}>
                    <span style={S.tag("green")}>✓ {r.amount ?? "?"} USDC</span>
                    <span style={S.tag("blue")}>{r.chain ?? "BASE"}</span>
                    <span style={{ fontSize: 12, color: "#475569" }}>
                      {r.paidAt ? new Date(r.paidAt).toLocaleTimeString() : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "#2563eb", marginLeft: "auto" }}>View receipt →</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 4, fontFamily: "monospace" }}>
                    {r.serviceUrl}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Back */}
      {step !== "terms" && (
        <button
          style={{ ...S.btn("secondary"), fontSize: 13 }}
          onClick={() => {
            const idx = STEPS.findIndex((s) => s.id === step);
            if (idx > 0) setStep(STEPS[idx - 1].id);
          }}
        >
          ← Back
        </button>
      )}
    </div>
  );
}
