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
  queryParamValues?: Record<string, string>;
  pathParamValues?: Record<string, string>;
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #020617;
    --surface: #0f172a;
    --surface2: #1e293b;
    --border: #1e293b;
    --border2: #334155;
    --text: #e2e8f0;
    --text2: #94a3b8;
    --text3: #64748b;
    --accent: #2563eb;
    --accent2: #3b82f6;
    --green: #10b981;
    --green-bg: rgba(16, 185, 129, 0.1);
    --yellow: #eab308;
    --yellow-bg: rgba(234, 179, 8, 0.1);
    --red: #ef4444;
    --red-bg: rgba(239, 68, 68, 0.1);
    --purple: #a855f7;
    --purple-bg: rgba(168, 85, 247, 0.1);
    --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    margin: 0;
  }

  button { cursor: pointer; border: none; font-family: var(--sans); }
  input, select { font-family: var(--mono); }

  /* Layout container adjustments */
  .layout-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: var(--bg);
  }

  /* Header inside Layout */
  .hd { 
    height: 80px;
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    display: flex; 
    align-items: center; 
    gap: 16px; 
    background: rgba(15, 23, 42, 0.5); /* surface transparent */
    backdrop-filter: blur(12px);
    margin: 0;
    flex-shrink: 0;
    justify-content: space-between;
  }
  .hd-logo-wrap {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .hd-logo {
    width: 32px; height: 32px; border-radius: 9999px;
    background: var(--accent);
    display: flex; align-items: center; justify-content: center;
  }
  .hd-logo-inner {
    width: 16px; height: 16px; border: 2px solid white; border-radius: 9999px;
  }
  .hd-title { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
  .hd-sub { font-size: 12px; color: var(--text3); font-family: var(--mono); margin-top: 2px; }

  /* Main Viewport */
  .main-viewport {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Content inner wrapper preserves the linear flow */
  .content-inner {
    width: 100%;
    max-width: 680px;
  }

  /* Stepper */
  .stepper { display: flex; align-items: center; justify-content: space-between; margin-bottom: 40px; overflow-x: auto; padding-bottom: 4px; }
  .step-item { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
  .step-dot {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; transition: all .2s;
    border: 1px solid var(--border2);
    background: var(--surface); color: var(--text3);
  }
  .step-dot.done { background: var(--accent); border-color: transparent; color: #fff; }
  .step-dot.active {
    background: var(--accent); border-color: transparent; color: #fff;
    box-shadow: 0 0 16px rgba(37,99,235,0.4);
  }
  .step-label { font-size: 11px; font-weight: 600; margin-left: 8px; color: var(--text2); letter-spacing: 0.5px; text-transform: uppercase; }
  .step-label.active { color: #fff; }
  .step-label.done { color: var(--text); }
  .step-line { width: 32px; height: 1px; background: var(--border); margin: 0 8px; flex-shrink: 0; }
  .step-line.done { background: var(--accent); }

  /* Card */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
  }
  .card-tag { 
    font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; 
    color: var(--text2); margin-bottom: 16px; border-bottom: 1px solid var(--border); 
    padding-bottom: 12px; display: flex; justify-content: space-between; 
    align-items: center; background: rgba(30, 41, 59, 0.3); 
    margin: -24px -24px 24px -24px; padding: 16px 24px; 
  }
  .card-title { font-size: 24px; font-weight: 700; color: #fff; letter-spacing: -0.5px; margin-bottom: 8px; }
  .card-desc { font-size: 14px; color: var(--text3); line-height: 1.6; margin-bottom: 24px; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 8px;
    font-size: 14px; font-weight: 600;
    transition: all .15s; white-space: nowrap;
  }
  .btn-primary {
    background: var(--accent); color: #fff;
    box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39);
  }
  .btn-primary:hover { background: var(--accent2); transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid transparent; }
  .btn-ghost:hover { background: var(--border2); }
  .btn-green { background: rgba(16, 185, 129, 0.1); color: var(--green); }
  .btn-green:hover { background: rgba(16, 185, 129, 0.2); }
  .btn-sm { padding: 4px 12px; font-size: 12px; }

  /* Inputs */
  .inp {
    width: 100%; padding: 12px 16px;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 14px;
    transition: border-color .15s; outline: none; margin-bottom: 16px;
  }
  .inp:focus { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .inp::placeholder { color: var(--text3); }
  select.inp { cursor: pointer; }

  /* Items */
  .item {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px; margin-bottom: 12px;
  }
  .item-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text3); margin-bottom: 8px; }
  .item-value { font-size: 24px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }

  /* Tags */
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 8px; border-radius: 4px;
    font-size: 10px; font-weight: 700; font-family: var(--mono); text-transform: uppercase;
  }
  .tag-green { background: var(--green-bg); color: var(--green); }
  .tag-blue { background: rgba(37, 99, 235, 0.1); color: var(--accent2); }
  .tag-yellow { background: var(--yellow-bg); color: var(--yellow); }
  .tag-purple { background: var(--purple-bg); color: var(--purple); }

  /* Alerts */
  .alert { border-radius: 8px; padding: 12px 16px; font-size: 14px; margin-top: 16px; line-height: 1.5; white-space: pre-wrap; }
  .alert-error { background: var(--red-bg); border: 1px solid rgba(239, 68, 68, 0.2); color: var(--red); }
  .alert-success { background: var(--green-bg); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--green); }

  /* Code block */
  .code {
    background: rgba(0,0,0,0.4); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; font-family: var(--mono);
    font-size: 12px; color: var(--text2); overflow-x: auto;
    margin-bottom: 24px; white-space: pre-wrap; line-height: 1.6;
  }

  /* Service card */
  .svc-card {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 12px;
    display: flex; justify-content: space-between;
    align-items: flex-start; gap: 16px;
    transition: all .15s;
  }
  .svc-card:hover { border-color: var(--border2); background: rgba(30, 41, 59, 0.3); }
  .svc-name { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px; }
  .svc-desc { font-size: 14px; color: var(--text3); margin-bottom: 12px; line-height: 1.5; }
  .svc-url { font-size: 12px; color: var(--text3); font-family: var(--mono); word-break: break-all; }

  /* Receipt */
  .receipt-amount { font-size: 48px; font-weight: 700; color: #fff; letter-spacing: -2px; }
  .receipt-sub { font-size: 14px; color: var(--text2); margin-top: 8px; }

  /* Modal Overlay */
  .overlay {
    position: fixed; inset: 0; background: rgba(2, 6, 23, 0.8);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 16px;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 24px; padding: 32px; max-width: 500px; width: 100%;
    max-height: 85vh; overflow-y: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }

  /* Divider */
  .divider { border-top: 1px solid var(--border); margin: 24px 0; }

  /* Row */
  .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

  /* Tx history */
  .tx-item {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; padding: 16px; margin-bottom: 8px;
    cursor: pointer; transition: all .15s;
    display: flex; justify-content: space-between; align-items: center;
  }
  .tx-item:hover { border-color: var(--border2); }

  /* Suggestions */
  .suggestion {
    background: transparent; border: none;
    border-radius: 20px; padding: 0; font-size: 13px;
    color: var(--accent); 
    transition: all .15s; cursor: pointer;
  }
  .suggestion:hover { text-decoration: underline; }

  /* Search bar */
  .search-wrap { display: flex; gap: 12px; align-items: center; }
  .search-inp {
    flex: 1; padding: 14px 20px;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); font-size: 14px;
    outline: none; transition: border-color .15s; font-family: var(--mono);
  }
  .search-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
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
function ServiceResponseFormatter({ result, onCursorSelect }: { result: any; onCursorSelect?: (cursor: string) => void }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!result) return null;

  try {
    // Check if there is a nested response string or object
    let extraObj = result;
    if (result && typeof result.response === "string") {
      try {
        extraObj = JSON.parse(result.response);
      } catch (e) {}
    } else if (result && result.response && typeof result.response === "object") {
      extraObj = result.response;
    }

    // 1. Twitter / X Trends structure
    let trendsList = extraObj?.trends || extraObj?.response?.trends;
    if (extraObj && Array.isArray(trendsList)) {
      trendsList = trendsList.filter((item: any) => {
        const name = (item.trend || item).name;
        return name && name.startsWith("#");
      });
      const locationName = extraObj.metadata?.woeid?.name || "Global";
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ padding: "12px", background: "rgba(29, 155, 240, 0.04)", borderRadius: 6, border: "1px solid rgba(29, 155, 240, 0.15)", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#1d9bf0", fontWeight: "bold" }}>𝕏</span> Trends in {locationName}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {trendsList.map((item: any, idx: number) => {
                const tr = item.trend || item;
                const searchQ = tr.target?.query || tr.name;
                const xSearchUrl = `https://x.com/search?q=${encodeURIComponent(searchQ)}`;
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                      <span style={{ color: "var(--text3)", fontWeight: "bold", width: 22, flexShrink: 0 }}>{tr.rank || (idx + 1)}.</span>
                      <span style={{ fontWeight: 600, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{tr.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {tr.tweetVolume && (
                        <span style={{ color: "var(--text2)", fontSize: 11 }}>{tr.tweetVolume.toLocaleString()} tweets</span>
                      )}
                      <a 
                        href={xSearchUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: "#1d9bf0", textDecoration: "none", fontSize: 11, display: "flex", alignItems: "center", gap: 2, padding: "2px 6px", background: "rgba(29,155,240,0.1)", borderRadius: 4 }}
                      >
                        Open 𝕏 ↗
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 10, textAlign: "right" }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: 11, padding: "2px 8px", height: "auto" }} 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide Raw Response" : "Show Raw Response"}
            </button>
          </div>

          {showRaw && (
            <pre style={{ fontSize: 11, color: "var(--text)", overflow: "auto", maxHeight: 150, background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginTop: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // 2. Twitter / X Advanced Search (tweet feed) structure
    const tweetsList = extraObj?.tweets || extraObj?.response?.tweets;
    if (extraObj && Array.isArray(tweetsList)) {
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ padding: "12px", background: "rgba(29, 155, 240, 0.04)", borderRadius: 6, border: "1px solid rgba(29, 155, 240, 0.15)", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#1d9bf0", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <span>𝕏</span> Search Results ({tweetsList.length} tweets)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
              {tweetsList.map((tw: any, idx: number) => {
                const author = tw.author || {};
                const handle = author.userName || author.username || "user";
                const displayName = author.name || "Anonymous";
                const avatar = author.profilePicture || "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
                const tweetUrl = `https://x.com/${handle}/status/${tw.id}`;

                return (
                  <div key={idx} style={{ 
                    padding: 12, 
                    background: "rgba(255, 255, 255, 0.02)", 
                    borderRadius: 8, 
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    gap: 10
                  }}>
                    {/* Avatar */}
                    <img 
                      src={avatar} 
                      alt={displayName} 
                      referrerPolicy="no-referrer"
                      style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", flexShrink: 0 }}
                    />
                    
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4 }}>
                        <div style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: "var(--text)" }}>{displayName}</span>{" "}
                          <span style={{ color: "var(--text3)", marginLeft: 2 }}>@{handle}</span>
                        </div>
                        {tw.createdAt && (
                          <span style={{ fontSize: 10, color: "var(--text3)" }}>
                            {new Date(tw.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: 13, color: "var(--text)", margin: "4px 0 8px 0", whiteSpace: "pre-wrap", lineHeight: 1.4, wordBreak: "break-word" }}>
                        {tw.text}
                      </p>

                      {/* Stats */}
                      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text3)", alignItems: "center" }}>
                        <span title="Replies" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          💬 {tw.replyCount || 0}
                        </span>
                        <span title="Retweets" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          🔁 {tw.retweetCount || 0}
                        </span>
                        <span title="Likes" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          ❤️ {tw.likeCount || 0}
                        </span>
                        {tw.viewCount !== undefined && tw.viewCount !== null && (
                          <span title="Views" style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            📊 {Number(tw.viewCount).toLocaleString()}
                          </span>
                        )}
                        
                        <a 
                          href={tweetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ marginLeft: "auto", color: "#1d9bf0", textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}
                        >
                          Open 𝕏 ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(() => {
            const nextCursor = extraObj?.next_cursor || extraObj?.response?.next_cursor || result?.data?.response?.next_cursor || result?.response?.next_cursor;
            if (nextCursor && onCursorSelect) {
              return (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(29, 155, 240, 0.08)", borderRadius: 8, border: "1px solid rgba(29, 155, 240, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
                    💬 Next page available! Click to auto-fetch the next cursor.
                  </div>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ background: "#1d9bf0", color: "#fff", border: "none", fontSize: 12, padding: "6px 12px", height: "auto", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                    onClick={() => onCursorSelect(nextCursor)}
                  >
                    Load Next Page ⬇️
                  </button>
                </div>
              );
            }
            return null;
          })()}

          <div style={{ marginTop: 10, textAlign: "right" }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: 11, padding: "2px 8px", height: "auto" }} 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide Raw Response" : "Show Raw Response"}
            </button>
          </div>

          {showRaw && (
            <pre style={{ fontSize: 11, color: "var(--text)", overflow: "auto", maxHeight: 150, background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginTop: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    if (extraObj && extraObj.symbol && extraObj.price !== undefined) {
      const formattedVal = parseFloat(extraObj.price).toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.04)", borderRadius: 6, border: "1px solid rgba(16, 185, 129, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>
                {extraObj.symbol.toUpperCase()} ({extraObj.category || "asset"})
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{formattedVal}</span>
            </div>
            {extraObj.timestamp && (
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4, textAlign: "right", fontFamily: "var(--mono)" }}>
                Lookup Time: {new Date(extraObj.timestamp).toLocaleString()}
              </div>
            )}
          </div>

          <div style={{ marginTop: 10, textAlign: "right" }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: 11, padding: "2px 8px", height: "auto" }} 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide Raw Response" : "Show Raw Response"}
            </button>
          </div>

          {showRaw && (
            <pre style={{ fontSize: 11, color: "var(--text)", overflow: "auto", maxHeight: 150, background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginTop: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // 1. Current Price response structure (by symbol or address)
    if (Array.isArray(result.data) && result.data.length > 0 && ('prices' in result.data[0] || 'error' in result.data[0])) {
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.data.map((item: any, idx: number) => {
              const label = item.symbol || (item.address ? `${item.address.slice(0, 6)}...${item.address.slice(-4)} (${item.network})` : `Token #${idx + 1}`);
              
              if (item.error) {
                return (
                  <div key={idx} style={{ padding: 12, background: "rgba(239, 68, 68, 0.08)", borderRadius: 6, border: "1px solid rgba(239, 68, 68, 0.15)" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--red)" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{item.error.message || "Failed to fetch price"}</div>
                  </div>
                );
              }

              const priceObj = item.prices?.[0]; // Get current price object
              if (!priceObj) {
                return (
                  <div key={idx} style={{ padding: 12, background: "rgba(255, 255, 255, 0.03)", borderRadius: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--yellow)" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>No price data available</div>
                  </div>
                );
              }

              const formattedVal = parseFloat(priceObj.value).toLocaleString(undefined, {
                style: "currency",
                currency: priceObj.currency?.toUpperCase() || "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
              });

              return (
                <div key={idx} style={{ padding: "10px 12px", background: "rgba(16, 185, 129, 0.04)", borderRadius: 6, border: "1px solid rgba(16, 185, 129, 0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>{label}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{formattedVal}</span>
                  </div>
                  {priceObj.lastUpdatedAt && (
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4, textAlign: "right", fontFamily: "var(--mono)" }}>
                      Lookup Time: {new Date(priceObj.lastUpdatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, textAlign: "right" }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: 11, padding: "2px 8px", height: "auto" }} 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide Raw Response" : "Show Raw Response"}
            </button>
          </div>

          {showRaw && (
            <pre style={{ fontSize: 11, color: "var(--text)", overflow: "auto", maxHeight: 150, background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginTop: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // 2. Historical Prices structure
    if (result.symbol && Array.isArray(result.data) && result.data.length > 0 && 'value' in result.data[0]) {
      const currency = (result.currency || "usd").toUpperCase();
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ padding: "12px", background: "rgba(99, 102, 241, 0.04)", borderRadius: 6, border: "1px solid rgba(99, 102, 241, 0.08)", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)", marginBottom: 8 }}>
              Historical Price for {result.symbol.toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {result.data.map((item: any, idx: number) => {
                const formattedVal = parseFloat(item.value).toLocaleString(undefined, {
                  style: "currency",
                  currency: currency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6
                });
                const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : `Point #${idx + 1}`;
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, borderBottom: idx < result.data.length - 1 ? "1px solid rgba(255, 255, 255, 0.03)" : "none", paddingBottom: 4 }}>
                    <span style={{ color: "var(--text2)" }}>{dateStr}</span>
                    <span style={{ fontWeight: 600, color: "var(--text)", fontFamily: "var(--mono)" }}>{formattedVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: 11, padding: "2px 8px", height: "auto" }} 
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? "Hide Raw Response" : "Show Raw Response"}
            </button>
          </div>

          {showRaw && (
            <pre style={{ fontSize: 11, color: "var(--text)", overflow: "auto", maxHeight: 150, background: "rgba(0,0,0,0.2)", padding: 8, borderRadius: 6, marginTop: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    }
  } catch (err) {
    console.warn("Custom format failed:", err);
  }

  // Fallback to displaying raw JSON
  return (
    <pre style={{ fontSize: 12, color: "var(--text)", overflow: "auto", maxHeight: 200, width: "100%" }}>
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

function ReceiptModal({ r, onClose, onLoadNextPage }: { r: Receipt; onClose: () => void; onLoadNextPage?: (cursor: string) => void }) {
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
            <ServiceResponseFormatter result={r.result} onCursorSelect={onLoadNextPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to build a default JSON schema shape
function getDefaultBody(input: any) {
  if (!input || !input.body) return "";
  const body = input.body;
  if (body.type === "object" && body.properties) {
    const obj: any = {};
    const hasSymbol = "symbol" in body.properties;
    
    for (const [key, prop] of Object.entries(body.properties) as any) {
      if (key === "symbol") {
        obj[key] = "ETH";
      } else if (key === "startTime") {
        // Set to 24 hours ago
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        obj[key] = yesterday.toISOString();
      } else if (key === "endTime") {
        obj[key] = new Date().toISOString();
      } else if (key === "address" || key === "network") {
        // Skip default generation if symbol is present to avoid mutually exclusive constraint
        if (!hasSymbol) {
          if (key === "network") obj[key] = "base";
          if (key === "address") obj[key] = "";
        }
      } else {
        const type = prop.type;
        if (type === "number" || type === "integer") {
          obj[key] = 0;
        } else if (type === "boolean") {
          obj[key] = false;
        } else if (type === "array") {
          const itemsType = prop.items?.type;
          if (itemsType === "object" && prop.items?.properties) {
            const itemObj: any = {};
            for (const [subKey, subProp] of Object.entries(prop.items.properties) as any) {
              if (subKey === "address") {
                itemObj[subKey] = "0x4200000000000000000000000000000000000006"; // WETH on Base
              } else if (subKey === "network") {
                itemObj[subKey] = "base";
              } else {
                const subType = subProp?.type;
                itemObj[subKey] = subType === "number" || subType === "integer" ? 0 : subType === "boolean" ? false : "";
              }
            }
            obj[key] = [itemObj];
          } else {
            obj[key] = [];
          }
        }
      }
    }
    return JSON.stringify(obj, null, 2);
  }
  return "{}";
}

// ── Pay Modal ─────────────────────────────────────────────
function PayModal({ service, wallets, balances, onClose, onSuccess, initialQueryParamValues, initialPathParamValues, autoSubmit }: {
  service: Service; wallets: Wallet[];
  balances: Record<string, string>;
  onClose: () => void; onSuccess: (r: Receipt) => void;
  initialQueryParamValues?: Record<string, string>;
  initialPathParamValues?: Record<string, string>;
  autoSubmit?: boolean;
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
    service.url.includes("by-symbol") ? "?symbols=ETH" : ""
  );
  const [inspectData, setInspectData] = useState<any>(null);
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({});
  const [queryParamValues, setQueryParamValues] = useState<Record<string, string>>({});
  const [postBody, setPostBody] = useState<string>("");
  const [gatewayBal, setGatewayBal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"setup" | "confirm" | "paying" | "deposit">("setup");
  const [error, setError] = useState("");
  const [depositAmt, setDepositAmt] = useState("0.5");
  const [depositMethod, setDepositMethod] = useState<"eco" | "direct">("direct");

  useEffect(() => {
    if (autoSubmit && phase === "setup" && !loading && !inspectData) {
      inspect();
    }
  }, [autoSubmit, phase, loading, inspectData]);

  const getFinalUrl = () => {
    let baseUrl = service.url;
    // Replace standard curly-braces path parameters
    for (const [key, val] of Object.entries(pathParamValues)) {
      baseUrl = baseUrl.replace(`{${key}}`, String(val));
    }
    
    // Check if there are form query parameters we extracted
    const queryEntries = Object.entries(queryParamValues).filter(([_, v]) => v !== "");
    if (queryEntries.length > 0) {
      const sp = new URLSearchParams();
      for (const [k, v] of queryEntries) {
        sp.set(k, String(v));
      }
      // Combine with existing queryParams text if there's any
      if (queryParams && queryParams.startsWith("?")) {
        const existingSp = new URLSearchParams(queryParams);
        for (const [k, v] of existingSp.entries()) {
          sp.set(k, String(v));
        }
      }
      return baseUrl + "?" + sp.toString();
    }
    
    return baseUrl + queryParams;
  };

  const inspect = async () => {
    setLoading(true); setError("");
    try {
      const d = await api(`/services/inspect?url=${encodeURIComponent(service.url)}`);
      const info = d?.data ?? d;
      setInspectData(info);

      // Derive path parameters defaults
      const pathDefaults: Record<string, string> = { ...initialPathParamValues };
      if (info?.input?.pathParams?.properties) {
        for (const [key, prop] of Object.entries(info.input.pathParams.properties) as any) {
          if (pathDefaults[key] !== undefined) continue;
          if (prop?.enum && prop.enum.length > 0) {
            pathDefaults[key] = prop.enum[0];
          } else if (key === "chainNetwork" || key === "network") {
            const isAlchemy = service.url.includes("alchemy.com");
            pathDefaults[key] = isAlchemy ? "base-mainnet" : "base";
          } else if (key === "symbol") {
            pathDefaults[key] = "BTC";
          } else {
            pathDefaults[key] = "";
          }
        }
      }
      setPathParamValues(pathDefaults);

      // Derive query parameters defaults
      const queryDefaults: Record<string, string> = {};
      if (info?.input?.queryParams?.properties) {
        for (const [key, prop] of Object.entries(info.input.queryParams.properties) as any) {
          if (initialQueryParamValues && key in initialQueryParamValues) {
            queryDefaults[key] = initialQueryParamValues[key];
          } else if (key === "contractAddress") {
            // Default to a representative popular contract (e.g., Bored Ape Yacht Club or similar Bored Ape NFT contract on Ethereum, or Uniswap V2)
            queryDefaults[key] = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d";
          } else if (key === "symbols") {
            queryDefaults[key] = "ETH";
          } else if (key === "woeid") {
            queryDefaults[key] = "1"; // Default to Worldwide Global Trends
          } else if (key === "query") {
            queryDefaults[key] = "trend crypto today"; // Default to what the user requested!
          } else if (key === "queryType") {
            queryDefaults[key] = "Latest";
          } else if (key === "limit" || key === "count") {
            queryDefaults[key] = "20";
          } else if (prop?.enum && prop.enum.length > 0) {
            queryDefaults[key] = prop.enum[0];
          } else {
            const type = prop?.type;
            queryDefaults[key] = type === "number" || type === "integer" ? "0" : "";
          }
        }
        // Force count=20 if missing to save user fees for list endpoints
        if (service.url.includes("search") || service.url.includes("timeline")) {
          if (!queryDefaults.count) queryDefaults.count = "20";
        }
      }
      if (initialQueryParamValues) {
        Object.assign(queryDefaults, initialQueryParamValues);
      }
      setQueryParamValues(queryDefaults);

      // Derive standard payload for POST methods from OpenAPI properties
      if (info && (info.method === "POST" || info.input?.method === "POST")) {
        const template = getDefaultBody(info.input);
        setPostBody(template);
      } else {
        setPostBody("");
      }

      const gw = await api(`/gateway/balance?chain=${chain}&address=${wallet}`);
      setGatewayBal(gw?.data?.total ?? "0");
      setPhase("confirm");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const pay = async () => {
    setLoading(true); setPhase("paying"); setError("");
    try {
      const payUrl = getFinalUrl();
      let parsedData: any = undefined;
      if (postBody) {
        try {
          const raw = JSON.parse(postBody);
          // Strip any empty strings or null properties to bypass strict API validation rules
          parsedData = {};
          for (const [k, v] of Object.entries(raw)) {
            if (v !== "" && v !== null && v !== undefined) {
              parsedData[k] = v;
            }
          }
          if (Object.keys(parsedData).length === 0) {
            parsedData = undefined;
          }
        } catch (jsonErr: any) {
          throw new Error("Invalid request body JSON format: " + jsonErr.message);
        }
      }
      const d = await api("/services/pay", {
        method: "POST",
        body: JSON.stringify({
          url: payUrl,
          address: wallet,
          chain,
          method: inspectData?.method ?? "POST",
          data: parsedData
        }),
      });
      if (d?.error) {
        setPhase("confirm");
        let msg = "";
        if (typeof d.error === "object") {
          msg = d.error.message ?? JSON.stringify(d.error);
          if (d.error.hint) {
            msg += "\n\n" + d.error.hint;
          }
        } else {
          msg = String(d.error);
        }
        setError(msg);
        return;
      }
      onSuccess({
        serviceUrl: service.url, paidAt: new Date().toISOString(),
        amount: d?.data?.payment?.amount ?? service.price,
        chain: d?.data?.payment?.chain ?? chain,
        scheme: d?.data?.payment?.scheme,
        txHash: d?.data?.payment?.txHash,
        result: d?.data?.response ?? d?.data?.result,
        queryParamValues, pathParamValues
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
            
            {/* Live dynamic param inputs */}
            {inspectData?.input?.pathParams?.properties && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Path Parameters</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(inspectData.input.pathParams.properties).map(([key, prop]: [string, any]) => {
                    const isEnum = Array.isArray(prop?.enum);
                    return (
                      <div key={key}>
                        <div className="item-label" style={{ marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                          <span>{key}</span>
                          {prop?.description && <span style={{ color: "var(--text3)", fontSize: 10 }}>{prop.description}</span>}
                        </div>
                        {isEnum ? (
                          <select
                            className="inp"
                            value={pathParamValues[key] || ""}
                            onChange={e => setPathParamValues({ ...pathParamValues, [key]: e.target.value })}
                          >
                            {prop.enum.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input
                            className="inp"
                            type="text"
                            placeholder={prop?.description || `Enter ${key}`}
                            value={pathParamValues[key] || ""}
                            onChange={e => setPathParamValues({ ...pathParamValues, [key]: e.target.value })}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {inspectData?.input?.queryParams?.properties && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Query Parameters</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(inspectData.input.queryParams.properties).map(([key, prop]: [string, any]) => {
                    const isEnum = Array.isArray(prop?.enum);
                    const isRequired = inspectData.input.queryParams.required?.includes(key);
                    return (
                      <div key={key}>
                        <div className="item-label" style={{ marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                          <span>{key} {isRequired ? <span style={{ color: "var(--red)" }}>(required)</span> : <span style={{ color: "var(--text3)" }}>(optional)</span>}</span>
                          {prop?.description && <span style={{ color: "var(--text3)", fontSize: 10 }}>{prop.description}</span>}
                        </div>
                        {isEnum ? (
                          <select
                            className="inp"
                            value={queryParamValues[key] || ""}
                            onChange={e => setQueryParamValues({ ...queryParamValues, [key]: e.target.value })}
                          >
                            {!isRequired && <option value="">-- select --</option>}
                            {prop.enum.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <>
                            <input
                              className="inp"
                              type="text"
                              placeholder={prop?.description || `Enter ${key}`}
                              value={queryParamValues[key] || ""}
                              onChange={e => setQueryParamValues({ ...queryParamValues, [key]: e.target.value })}
                            />
                            {key === "woeid" && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                {[
                                  { label: "🌐 Global (1)", val: "1" },
                                  { label: "🇻🇳 Vietnam (23424984)", val: "23424984" },
                                  { label: "🇺🇸 USA (23424977)", val: "23424977" },
                                  { label: "🇯🇵 Japan (23424856)", val: "23424856" },
                                  { label: "🇬🇧 UK (23424908)", val: "23424908" },
                                  { label: "🇧🇷 Brazil (23424768)", val: "23424768" }
                                ].map(p => (
                                  <button
                                    key={p.val}
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ fontSize: 10, padding: "2px 6px", height: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--accent)" }}
                                    onClick={() => setQueryParamValues({ ...queryParamValues, woeid: p.val })}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            )}
                            {key === "query" && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                                {[
                                  { label: "🔥 Trend Crypto Today", val: "trend crypto today" },
                                  { label: "💎 Meme Gem Sol", val: "meme gem sol" },
                                  { label: "🚀 #memecoin", val: "#memecoin" },
                                  { label: "📈 #crypto", val: "#crypto" },
                                  { label: "🪙 #bitcoin", val: "#bitcoin" }
                                ].map(p => (
                                  <button
                                    key={p.val}
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ fontSize: 10, padding: "2px 6px", height: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--accent)" }}
                                    onClick={() => setQueryParamValues({ ...queryParamValues, query: p.val })}
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live payment URL output display info */}
            <div style={{ marginBottom: 16 }}>
              <div className="item-label" style={{ marginBottom: 4 }}>Prepared Target URL</div>
              <div style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                padding: "8px 12px",
                background: "rgba(0,0,0,0.25)",
                borderRadius: 6,
                wordBreak: "break-all",
                color: "var(--yellow)",
                border: "1px solid rgba(255,255,255,0.05)"
              }}>
                {getFinalUrl()}
              </div>
            </div>

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
            {postBody !== "" && (
              <div style={{ marginBottom: 16 }}>
                <div className="item-label" style={{ marginBottom: 6 }}>Request Payload (JSON)</div>
                <textarea
                  className="inp"
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "12px",
                    height: "120px",
                    resize: "vertical",
                    lineHeight: "1.5",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    width: "100%",
                    color: "var(--text)"
                  }}
                  value={postBody}
                  onChange={e => setPostBody(e.target.value)}
                />
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
            {error && <div className="alert alert-error" style={{ whiteSpace: "pre-line" }}>{error}</div>}
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
  const [nextPageContext, setNextPageContext] = useState<{ cursor: string, queryParams: any, pathParams: any } | null>(null);

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
    
    // Auto-fetch balances to determine the primary wallet
    for (const w of list) {
      api(`/wallet/balance?address=${w.address}`).then(res => {
        const amt = res?.data?.balances?.find((t: any) => t.token?.symbol?.includes("USDC"))?.amount || "0";
        setBalances(prev => ({ ...prev, [w.address]: amt }));
      }).catch(e => console.error(e));
    }
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
      {payingService && (
        <PayModal 
          service={payingService} 
          wallets={wallets} 
          balances={balances} 
          onClose={() => {
            setPayingService(null);
            setNextPageContext(null);
          }} 
          onSuccess={handlePaySuccess} 
          initialQueryParamValues={nextPageContext ? { ...nextPageContext.queryParams, cursor: nextPageContext.cursor } : undefined}
          initialPathParamValues={nextPageContext ? nextPageContext.pathParams : undefined}
          autoSubmit={!!nextPageContext}
        />
      )}
      {viewReceipt && (
        <ReceiptModal 
          r={viewReceipt} 
          onClose={() => setViewReceipt(null)} 
          onLoadNextPage={(cursorValue) => {
            // Find the service that this was for
            const matchedService = services.find(s => s.url === viewReceipt.serviceUrl) || payingService;
            if (matchedService) {
              setViewReceipt(null);
              setNextPageContext({
                cursor: cursorValue,
                queryParams: viewReceipt.queryParamValues || {},
                pathParams: viewReceipt.pathParamValues || {}
              });
              setPayingService(matchedService);
            }
          }}
        />
      )}

      <div className="layout-root">
        {/* Header */}
        <div className="hd">
          <div className="hd-logo-wrap">
            <div className="hd-logo">
              <div className="hd-logo-inner"></div>
            </div>
            <div>
              <div className="hd-title">Programmable Agent Wallet</div>
              <div className="hd-sub">
                {wallets.length > 0
                  ? `Active Wallet ID: ${wallets[0].address.slice(0, 8)}...${wallets[0].address.slice(-6)} • Base Network`
                  : "Not logged in • Base Network"}
              </div>
            </div>
          </div>
        </div>

        <div className="main-viewport">
          <div className="content-inner">
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
                {(() => {
                  const bestWalletAddress = wallets.reduce((bestAddr, w) => {
                    const bal = parseFloat(balances[w.address] || "0");
                    const bestBal = parseFloat(balances[bestAddr] || "0");
                    return bal > bestBal ? w.address : bestAddr;
                  }, "");

                  return wallets.map((w, idx) => (
                    <div key={w.id ?? w.address} className="item">
                      <div className="row" style={{ marginBottom: 6 }}>
                        <span className="tag tag-blue">BASE</span>
                        <span className="tag tag-purple">Agent</span>
                        {(w as any).createDate && (
                          <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginLeft: "auto", marginRight: parseFloat(balances[w.address] || "0") > 0 && bestWalletAddress === w.address ? 8 : "auto" }}>
                            {new Date((w as any).createDate).toLocaleDateString()}
                          </span>
                        )}
                        {(bestWalletAddress === w.address && parseFloat(balances[w.address] || "0") > 0) && <span className="tag tag-green">★ Primary</span>}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text2)", wordBreak: "break-all" }}>{w.address}</div>
                    </div>
                  ));
                })()}
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
                <div key={w.id ?? w.address} className="item">
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

              {/* Real-time X/Twitter Trend Scanner Shortcuts */}
              <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(29, 155, 240, 0.05)", borderRadius: 8, border: "1px solid rgba(29, 155, 240, 0.15)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1d9bf0", display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  <span>🔥</span> Early Crypto & Meme Trend Scanner (𝕏/Twitter)
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12, lineHeight: 1.4 }}>
                  Scan real-time 𝕏 trends or do advanced tweet searches to uncover high-potential coins (meme gems, protocols) before they hit major trackers.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ background: "rgba(29, 155, 240, 0.08)", color: "#1d9bf0", border: "1px solid rgba(29, 155, 240, 0.2)", fontSize: 12, textTransform: "none", letterSpacing: "normal", justifyContent: "center" }}
                    onClick={() => {
                      setQuery("trends");
                      run(async () => {
                        const d = await api(`/services/search?q=${encodeURIComponent("twitter trends")}`);
                        const list = d?.data?.services ?? [];
                        setServices(Array.isArray(list) ? list : []);
                        setHasSearched(true);
                      });
                    }}
                  >
                    📈 Search 𝕏/Twitter Trends
                  </button>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ background: "rgba(29, 155, 240, 0.08)", color: "#1d9bf0", border: "1px solid rgba(29, 155, 240, 0.2)", fontSize: 12, textTransform: "none", letterSpacing: "normal", justifyContent: "center" }}
                    onClick={() => {
                      setQuery("advanced search");
                      run(async () => {
                        const d = await api(`/services/search?q=${encodeURIComponent("advanced search")}`);
                        const list = d?.data?.services ?? [];
                        setServices(Array.isArray(list) ? list : []);
                        setHasSearched(true);
                      });
                    }}
                  >
                    🔍 Search 𝕏 Advanced Tweets
                  </button>
                </div>
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
        </div>
      </div>
    </>
  );
}
