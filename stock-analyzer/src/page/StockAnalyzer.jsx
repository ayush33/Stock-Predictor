import { useState, useCallback } from "react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const POPULAR_STOCKS = [
    { name: "Reliance", ticker: "RELIANCE", exchange: "NSE" },
    { name: "TCS", ticker: "TCS", exchange: "NSE" },
    { name: "Infosys", ticker: "INFY", exchange: "NSE" },
    { name: "HDFC Bank", ticker: "HDFCBANK", exchange: "NSE" },
    { name: "Wipro", ticker: "WIPRO", exchange: "NSE" },
    { name: "ICICI Bank", ticker: "ICICIBANK", exchange: "NSE" },
    { name: "Tata Motors", ticker: "TATAMOTORS", exchange: "NSE" },
    { name: "Bajaj Finance", ticker: "BAJFINANCE", exchange: "NSE" },
];

// ─── MASTER PROMPT BUILDER ────────────────────────────────────────────────────
function buildSystemPrompt() {
    return `You are a SEBI-registered equity research analyst specializing in Indian capital markets (NSE/BSE).
  
  Your analysis covers: fundamentals, technicals, Indian macro (RBI, FII/DII, PLI), quarterly results (Ind AS), promoter/FII holding, and SEBI governance.
  
  STRICT OUTPUT RULES:
  - Return ONLY raw JSON. No markdown, no prose, no code fences.
  - Do NOT wrap in \`\`\`json or any backticks. Start directly with {
  - Response must start with { and end with }
  - Use ₹ for all price values
  - If a value is unknown, use "N/A" — never omit a field`;
  }



function buildUserPrompt(ticker, exchange) {
    return `Analyze the Indian stock ${ticker} listed on ${exchange}.
   
  Provide a fundamental + technical view. Use your knowledge of Indian markets and reasonable estimates where exact data is unavailable.
   
  Return ONLY this JSON structure — no other text:
   
  {
    "company": {
      "name": "Full company name",
      "ticker": "${ticker}",
      "exchange": "${exchange}",
      "sector": "Sector name",
      "industry": "Industry name",
      "marketCap": "₹X,XXX Cr",
      "marketCapCategory": "Large Cap | Mid Cap | Small Cap"
    },
    "verdict": {
      "rating": "STRONG BUY | BUY | HOLD | SELL | STRONG SELL",
      "confidence": "High | Medium | Low",
      "timeHorizon": "Short-term (1-3M) | Medium-term (3-12M) | Long-term (1-3Y)",
      "summary": "One sentence verdict"
    },
    "targetPrice": {
      "current": "₹XXX",
      "target3M": "₹XXX",
      "target6M": "₹XXX",
      "target12M": "₹XXX",
      "stopLoss": "₹XXX",
      "upside12M": "XX%"
    },
    "fundamentals": {
      "pe": "XX.X",
      "sectorPE": "XX.X",
      "eps": "₹XX.X",
      "epsGrowthYoY": "XX%",
      "revenueGrowth": "XX%",
      "operatingMargin": "XX%",
      "roe": "XX%",
      "debtToEquity": "X.X",
      "promoterHolding": "XX%",
      "fiiHolding": "XX%",
      "dividendYield": "X.X%",
      "pbRatio": "X.X",
      "fundamentalScore": "X/10",
      "fundamentalVerdict": "One sentence"
    },
    "technicals": {
      "rsi": "XX",
      "rsiSignal": "Oversold | Neutral | Overbought",
      "macd": "Bullish | Bearish | Neutral",
      "movingAvg": "Above 50 & 200 DMA | Below 50 DMA | Death Cross | Golden Cross",
      "support": "₹XXX",
      "resistance": "₹XXX",
      "trend": "Strong Uptrend | Uptrend | Sideways | Downtrend | Strong Downtrend",
      "technicalScore": "X/10",
      "technicalVerdict": "One sentence"
    },
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "risks": ["Risk 1", "Risk 2", "Risk 3"],
    "indiaContext": {
      "niftyCorrelation": "High | Medium | Low",
      "beta": "X.X",
      "macroFactors": "Key Indian macro factor",
      "regulatoryRisk": "SEBI/RBI/Govt policy risk",
      "fiiDiiTrend": "Buying | Selling | Neutral",
      "upcomingTriggers": ["Trigger 1", "Trigger 2"]
    },
    "disclaimer": "Educational analysis only. Not SEBI-registered investment advice."
  }`;
  }
//   const suffix = exchange === "NSE" ? ".NS" : ".BO";
//   const fullTicker = `${ticker}${suffix}`;

//   return `Analyze the Indian stock: ${ticker} listed on ${exchange} (Yahoo Finance ticker: ${fullTicker})

// ## SECTION 1 — STOCK IDENTITY
// Ticker: ${ticker}
// Exchange: ${exchange}
// Yahoo Finance Symbol: ${fullTicker}
// Analysis Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
// Market: Indian Equity (${exchange})

// ## SECTION 2 — LIVE MARKET DATA (use these exact figures)
// ${stockData ? `
// Current Price: ₹${stockData.price}
// Day Change: ${stockData.change} (${stockData.changePct}%)
// 52-Week High: ₹${stockData.high52}
// 52-Week Low: ₹${stockData.low52}
// Volume: ${stockData.volume}
// Market Cap: ₹${stockData.marketCap}
// ` : "Live data unavailable — use your knowledge and web search to find latest figures."}

// ## SECTION 3 — FUNDAMENTAL ANALYSIS FRAMEWORK
// Analyse these Indian-market-specific fundamentals (search for latest values):
// - P/E Ratio vs sector average P/E and Nifty50 P/E (~22x)
// - EPS (TTM) and EPS growth (YoY, QoQ)
// - Revenue growth (TTM) and operating margins
// - Return on Equity (ROE) — benchmark: >15% is good for Indian cos
// - Debt-to-Equity ratio — <1 preferred; flag if >2
// - Promoter holding % — >50% reassuring; <40% is a yellow flag
// - FII holding % trend (increasing = bullish signal)
// - Dividend yield vs FD rates (current SBI FD: ~7%)
// - Book Value and Price-to-Book (P/B)

// ## SECTION 4 — TECHNICAL ANALYSIS FRAMEWORK
// Calculate or estimate these technicals:
// - RSI (14-day): Oversold <30, Overbought >70
// - MACD: Is it bullish (MACD > Signal line) or bearish?
// - 50-Day SMA vs 200-Day SMA: Golden Cross (bullish) or Death Cross (bearish)?
// - Price vs 52-week high/low: Distance from each
// - Support levels (recent lows, round numbers)
// - Resistance levels (recent highs, 52W high)
// - Volume trend: Is delivery volume rising or falling?

// ## SECTION 5 — INDIA-SPECIFIC MACRO & NEWS SEARCH
// Use web search to find:
// 1. Latest quarterly results (PAT, Revenue vs estimates)
// 2. Any management commentary / investor day highlights
// 3. Sectoral tailwinds/headwinds specific to Indian market
// 4. RBI policy impact on this stock (especially for banks/NBFCs/rate-sensitives)
// 5. Government policy (PLI, budget allocation, import/export duties) affecting this sector
// 6. Recent FII/DII activity in this stock
// 7. Any SEBI actions, bulk deals, insider buying/selling
// 8. Nifty50 / Sensex correlation and beta
// 9. Upcoming triggers: results date, AGM, dividend announcement
// 10. Analyst consensus from Indian brokerages (Motilal Oswal, ICICI Securities, Kotak, Axis)

// ## OUTPUT FORMAT — RESPOND ONLY WITH THIS EXACT JSON STRUCTURE:
// {
//   "company": {
//     "name": "Full company name",
//     "ticker": "${ticker}",
//     "exchange": "${exchange}",
//     "sector": "Sector name",
//     "industry": "Industry name",
//     "marketCap": "₹X,XXX Cr",
//     "marketCapCategory": "Large Cap / Mid Cap / Small Cap"
//   },
//   "verdict": {
//     "rating": "STRONG BUY | BUY | HOLD | SELL | STRONG SELL",
//     "confidence": "High | Medium | Low",
//     "timeHorizon": "Short-term (1-3 months) | Medium-term (3-12 months) | Long-term (1-3 years)",
//     "summary": "One powerful sentence verdict in plain English"
//   },
//   "targetPrice": {
//     "current": "₹XXX",
//     "target3M": "₹XXX",
//     "target6M": "₹XXX",
//     "target12M": "₹XXX",
//     "stopLoss": "₹XXX",
//     "upside12M": "XX%"
//   },
//   "fundamentals": {
//     "pe": "XX.X",
//     "sectorPE": "XX.X",
//     "eps": "₹XX.X",
//     "epsGrowthYoY": "XX%",
//     "revenueGrowth": "XX%",
//     "operatingMargin": "XX%",
//     "roe": "XX%",
//     "debtToEquity": "X.X",
//     "promoterHolding": "XX%",
//     "fiiHolding": "XX%",
//     "dividendYield": "X.X%",
//     "pbRatio": "X.X",
//     "fundamentalScore": "X/10",
//     "fundamentalVerdict": "One sentence on fundamentals"
//   },
//   "technicals": {
//     "rsi": "XX",
//     "rsiSignal": "Oversold | Neutral | Overbought",
//     "macd": "Bullish | Bearish | Neutral",
//     "movingAvg": "Above 50 & 200 DMA | Below 50 DMA | Death Cross | Golden Cross",
//     "support": "₹XXX",
//     "resistance": "₹XXX",
//     "trend": "Strong Uptrend | Uptrend | Sideways | Downtrend | Strong Downtrend",
//     "technicalScore": "X/10",
//     "technicalVerdict": "One sentence on technicals"
//   },
//   "strengths": [
//     "Strength 1 — specific, data-backed, India-context",
//     "Strength 2 — specific, data-backed, India-context",
//     "Strength 3 — specific, data-backed, India-context"
//   ],
//   "risks": [
//     "Risk 1 — specific, quantified where possible",
//     "Risk 2 — specific, quantified where possible",
//     "Risk 3 — specific, quantified where possible"
//   ],
//   "indiaContext": {
//     "niftyCorrelation": "High / Medium / Low",
//     "beta": "X.X",
//     "macroFactors": "Key Indian macro factor affecting this stock",
//     "regulatoryRisk": "SEBI / RBI / Govt policy risk if any",
//     "fiiDiiTrend": "FII buying/selling trend",
//     "upcomingTriggers": ["Trigger 1", "Trigger 2"]
//   },
//   "analystConsensus": {
//     "brokerageView": "Bullish / Mixed / Bearish",
//     "avgTargetPrice": "₹XXX",
//     "topBullishBroker": "Broker name and target",
//     "topBearishBroker": "Broker name or concern"
//   },
//   "latestNews": [
//     { "headline": "News headline 1", "sentiment": "Positive | Neutral | Negative" },
//     { "headline": "News headline 2", "sentiment": "Positive | Neutral | Negative" },
//     { "headline": "News headline 3", "sentiment": "Positive | Neutral | Negative" }
//   ],
//   "disclaimer": "This analysis is for educational purposes only and does not constitute SEBI-registered investment advice. Past performance is not indicative of future results. Please consult a registered investment advisor before making investment decisions."
// }`;
// }

// ─── API CALL ─────────────────────────────────────────────────────────────────
async function analyzeStock(ticker, exchange) {
    const response = await fetch("http://localhost:3001/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            // model: "claude-sonnet-4-20250514",
            //  model: "claude-sonnet-4-20250514",
            //max_tokens: 60,
            model: "claude-haiku-4-5-20251001",  // was claude-sonnet-4-20250514
            max_tokens: 2000,
            temperature: 0,
            system: buildSystemPrompt(),
            //   tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages: [{ role: "user", content: buildUserPrompt(ticker, exchange, null) }],
        }),
    });
    console.log('response', response)
    const data = await response.json();
    console.log('data',data)
    const textBlock = [...data.content].reverse().find(b => b.type === "text");

    if (!textBlock) throw new Error("No response text");

    const raw = textBlock.text
        .replace(/```json|```/g, "")
        .replace(/<cite[^>]*>|<\/cite>/g, "")
        .trim();
    console.log('raw', raw)
    const match = raw.match(/\{[\s\S]*\}/);
    console.log('match', match)

    if (!match) throw new Error("Invalid JSON");

    return JSON.parse(match[0]);
    // console.log('data',data)
    // const textBlock = data.content?.find((b) => b.type === "text");
    // console.log('textBlock',textBlock)

    // if (!textBlock) throw new Error("No response from API");
    // const raw = textBlock.text.replace(/```json|```/g, "").trim();
    // console.log('raw',raw)
    // const start = raw.indexOf("{");
    // const end = raw.lastIndexOf("}");
    // console.log('start', start, end)
    // return JSON.parse(raw.slice(start, end + 1));
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────

const styles = {
    app: {
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background: "#F7F8FA",
        minHeight: "100vh",
        color: "#0F172A",
    },
    header: {
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 10,
    },
    logo: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: "-0.5px",
        color: "#0F172A",
    },
    logoAccent: { color: "#2563EB" },
    badge: {
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1,
        background: "#EFF6FF",
        color: "#2563EB",
        padding: "3px 8px",
        borderRadius: 20,
        textTransform: "uppercase",
    },
    main: { maxWidth: 1100, margin: "0 auto", padding: "40px 24px" },
    heroText: {
        textAlign: "center",
        marginBottom: 40,
    },
    h1: {
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: "-1px",
        margin: "0 0 8px",
        color: "#0F172A",
    },
    subtitle: { fontSize: 16, color: "#64748B", margin: 0 },

    searchBox: {
        background: "#fff",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    searchRow: { display: "flex", gap: 12, marginBottom: 16 },
    input: {
        flex: 1,
        padding: "12px 16px",
        border: "1.5px solid #E2E8F0",
        borderRadius: 10,
        fontSize: 16,
        fontFamily: "inherit",
        outline: "none",
        background: "#F8FAFC",
        transition: "border-color 0.2s",
    },
    exchangeBtn: (active) => ({
        padding: "12px 20px",
        border: `1.5px solid ${active ? "#2563EB" : "#E2E8F0"}`,
        background: active ? "#EFF6FF" : "#fff",
        color: active ? "#2563EB" : "#64748B",
        borderRadius: 10,
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
    }),
    analyzeBtn: (loading) => ({
        padding: "12px 28px",
        background: loading ? "#93C5FD" : "#2563EB",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        fontFamily: "inherit",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        letterSpacing: "-0.2px",
        whiteSpace: "nowrap",
    }),
    chips: { display: "flex", gap: 8, flexWrap: "wrap" },
    chip: {
        padding: "6px 14px",
        background: "#F1F5F9",
        border: "1px solid #E2E8F0",
        borderRadius: 20,
        fontSize: 13,
        cursor: "pointer",
        fontFamily: "inherit",
        color: "#475569",
        fontWeight: 500,
        transition: "all 0.15s",
    },

    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 },

    card: {
        background: "#fff",
        border: "1.5px solid #E2E8F0",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "#94A3B8",
        marginBottom: 12,
    },

    verdictCard: (rating) => ({
        background: rating?.includes("BUY") ? "#F0FDF4" : rating === "HOLD" ? "#FFFBEB" : "#FFF1F2",
        border: `1.5px solid ${rating?.includes("BUY") ? "#BBF7D0" : rating === "HOLD" ? "#FDE68A" : "#FECDD3"}`,
        borderRadius: 16,
        padding: 28,
        marginBottom: 16,
    }),
    verdictRating: (rating) => ({
        fontSize: 32,
        fontWeight: 900,
        letterSpacing: "-1px",
        color: rating?.includes("BUY") ? "#15803D" : rating === "HOLD" ? "#B45309" : "#BE123C",
        margin: "0 0 4px",
    }),
    verdictSummary: { fontSize: 15, color: "#334155", lineHeight: 1.6, margin: "8px 0 0" },

    metricLabel: { fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 500 },
    metricValue: { fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.5px" },
    metricSub: { fontSize: 12, color: "#64748B", marginTop: 2 },

    tag: (type) => {
        const colors = {
            positive: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
            negative: { bg: "#FFF1F2", color: "#BE123C", border: "#FECDD3" },
            neutral: { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0" },
        };
        const c = colors[type] || colors.neutral;
        return {
            display: "inline-block",
            padding: "3px 10px",
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
        };
    },

    listItem: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 10,
        fontSize: 14,
        color: "#334155",
        lineHeight: 1.6,
    },
    dot: (color) => ({
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        marginTop: 7,
        flexShrink: 0,
    }),

    scoreBar: (score) => ({
        height: 6,
        borderRadius: 3,
        background: `linear-gradient(90deg, #2563EB ${score * 10}%, #E2E8F0 ${score * 10}%)`,
        marginTop: 6,
    }),

    errorBox: {
        background: "#FFF1F2",
        border: "1.5px solid #FECDD3",
        borderRadius: 12,
        padding: 20,
        color: "#BE123C",
        fontSize: 14,
        marginTop: 16,
    },
    disclaimer: {
        marginTop: 24,
        padding: 16,
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        fontSize: 12,
        color: "#94A3B8",
        lineHeight: 1.6,
        textAlign: "center",
    },
    loadingBox: {
        textAlign: "center",
        padding: "60px 0",
        color: "#64748B",
    },
    spinner: {
        width: 40,
        height: 40,
        border: "3px solid #E2E8F0",
        borderTop: "3px solid #2563EB",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 16px",
    },
    loadingSteps: { fontSize: 13, color: "#94A3B8", marginTop: 8 },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function StockAnalyzer() {
    const [ticker, setTicker] = useState("");
    const [exchange, setExchange] = useState("NSE");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loadingStep, setLoadingStep] = useState("");

    const loadingSteps = [
        "Connecting to NSE/BSE data feeds...",
        "Fetching live price & fundamentals...",
        "Running technical analysis (RSI, MACD, SMA)...",
        "Searching latest news & FII/DII flows...",
        "Cross-referencing with Nifty50 context...",
        "Generating SEBI-grade analysis...",
    ];

    const handleAnalyze = useCallback(async () => {
        if (!ticker.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);
        let stepIdx = 0;
        setLoadingStep(loadingSteps[0]);
        const interval = setInterval(() => {
            stepIdx = (stepIdx + 1) % loadingSteps.length;
            setLoadingStep(loadingSteps[stepIdx]);
        }, 2200);
        try {
            const data = await analyzeStock(ticker.toUpperCase().trim(), exchange);
            setResult(data);
        } catch (e) {
            setError(e.message || "Analysis failed. Check your API connection.");
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    }, [ticker, exchange]);

    const handleChip = (t, ex) => {
        setTicker(t);
        setExchange(ex);
    };

    return (
        <div style={styles.app}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .chip:hover { background: #EFF6FF !important; border-color: #BFDBFE !important; color: #2563EB !important; }
      `}</style>

            {/* Header */}
            <header style={styles.header}>
                <div style={styles.logo}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="24" rx="6" fill="#2563EB" />
                        <path d="M6 16L10 10L13 14L16 8L18 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    AJ<span style={styles.logoAccent}>AI</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={styles.badge}>NSE · BSE</span>
                    <span style={styles.badge}>Powered by Claude</span>
                </div>
            </header>

            <main style={styles.main}>
                {/* Hero */}
                <div style={styles.heroText}>
                    <h1 style={styles.h1}>Indian Stock Analyzer</h1>
                    <p style={styles.subtitle}>
                        AI-powered research for NSE & BSE — fundamentals, technicals, news & Buy/Hold/Sell verdict
                    </p>
                </div>

                {/* Search Box */}
                <div style={styles.searchBox}>
                    <div style={styles.searchRow}>
                        <input
                            style={styles.input}
                            placeholder="Enter ticker (e.g. RELIANCE, TCS, HDFCBANK)"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                        />
                        <button style={styles.exchangeBtn(exchange === "NSE")} onClick={() => setExchange("NSE")}>NSE</button>
                        <button style={styles.exchangeBtn(exchange === "BSE")} onClick={() => setExchange("BSE")}>BSE</button>
                        <button style={styles.analyzeBtn(loading)} onClick={handleAnalyze} disabled={loading}>
                            {loading ? "Analysing..." : "Analyse →"}
                        </button>
                    </div>
                    <div style={styles.chips}>
                        <span style={{ fontSize: 12, color: "#94A3B8", alignSelf: "center", marginRight: 4 }}>Popular:</span>
                        {POPULAR_STOCKS.map((s) => (
                            <button key={s.ticker} className="chip" style={styles.chip} onClick={() => handleChip(s.ticker, s.exchange)}>
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={styles.loadingBox}>
                        <div style={styles.spinner} />
                        <div style={{ fontWeight: 600, color: "#334155" }}>Analysing {ticker} on {exchange}...</div>
                        <div style={styles.loadingSteps}>{loadingStep}</div>
                    </div>
                )}

                {/* Error */}
                {error && <div style={styles.errorBox}>⚠ {error}</div>}

                {/* Results */}
                {result && !loading && (
                    <div className="fade-up">
                        {/* Company Header */}
                        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>
                                    {result.company?.name}
                                </h2>
                                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, display: "flex", gap: 12 }}>
                                    <span>{result.company?.ticker} · {result.company?.exchange}</span>
                                    <span>{result.company?.sector}</span>
                                    <span>{result.company?.marketCap}</span>
                                    <span style={styles.tag("neutral")}>{result.company?.marketCapCategory}</span>
                                </div>
                            </div>
                        </div>

                        {/* Verdict + Target Row */}
                        <div style={{ ...styles.grid2, marginBottom: 16 }}>
                            {/* Verdict Card */}
                            <div style={styles.verdictCard(result.verdict?.rating)}>
                                <div style={styles.cardTitle}>AI Verdict</div>
                                <div style={styles.verdictRating(result.verdict?.rating)}>{result.verdict?.rating}</div>
                                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                    <span style={styles.tag("neutral")}>{result.verdict?.confidence} Confidence</span>
                                    <span style={styles.tag("neutral")}>{result.verdict?.timeHorizon}</span>
                                </div>
                                <div style={styles.verdictSummary}>{result.verdict?.summary}</div>
                            </div>

                            {/* Target Prices */}
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Price Targets (INR)</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <div style={styles.metricLabel}>Current</div>
                                        <div style={{ ...styles.metricValue, fontSize: 28 }}>{result.targetPrice?.current}</div>
                                    </div>
                                    <div>
                                        <div style={styles.metricLabel}>12M Target</div>
                                        <div style={{ ...styles.metricValue, fontSize: 28, color: "#15803D" }}>{result.targetPrice?.target12M}</div>
                                        <div style={{ ...styles.metricSub, color: "#15803D", fontWeight: 600 }}>↑ {result.targetPrice?.upside12M} upside</div>
                                    </div>
                                    <div>
                                        <div style={styles.metricLabel}>3M Target</div>
                                        <div style={styles.metricValue}>{result.targetPrice?.target3M}</div>
                                    </div>
                                    <div>
                                        <div style={styles.metricLabel}>6M Target</div>
                                        <div style={styles.metricValue}>{result.targetPrice?.target6M}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={styles.metricLabel}>Stop Loss</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: "#BE123C" }}>{result.targetPrice?.stopLoss}</div>
                                </div>
                            </div>
                        </div>

                        {/* Fundamentals + Technicals */}
                        <div style={{ ...styles.grid2, marginBottom: 16 }}>
                            {/* Fundamentals */}
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Fundamental Analysis</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                    {[
                                        { label: "P/E Ratio", value: result.fundamentals?.pe, sub: `Sector: ${result.fundamentals?.sectorPE}` },
                                        { label: "EPS (TTM)", value: result.fundamentals?.eps, sub: `YoY: ${result.fundamentals?.epsGrowthYoY}` },
                                        { label: "ROE", value: result.fundamentals?.roe, sub: "Benchmark: >15%" },
                                        { label: "Debt/Equity", value: result.fundamentals?.debtToEquity, sub: "Lower is better" },
                                        { label: "Promoter Holding", value: result.fundamentals?.promoterHolding, sub: ">50% preferred" },
                                        { label: "FII Holding", value: result.fundamentals?.fiiHolding, sub: "Foreign interest" },
                                        { label: "Rev. Growth", value: result.fundamentals?.revenueGrowth, sub: "TTM YoY" },
                                        { label: "Dividend Yield", value: result.fundamentals?.dividendYield, sub: "vs SBI FD ~7%" },
                                    ].map((m) => (
                                        <div key={m.label}>
                                            <div style={styles.metricLabel}>{m.label}</div>
                                            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{m.value || "—"}</div>
                                            <div style={styles.metricSub}>{m.sub}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Fundamental Score</span>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#2563EB" }}>{result.fundamentals?.fundamentalScore}</span>
                                    </div>
                                    <div style={styles.scoreBar(parseFloat(result.fundamentals?.fundamentalScore) || 5)} />
                                    <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>{result.fundamentals?.fundamentalVerdict}</div>
                                </div>
                            </div>

                            {/* Technicals */}
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Technical Analysis</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                    {[
                                        {
                                            label: "RSI (14D)",
                                            value: result.technicals?.rsi,
                                            tag: result.technicals?.rsiSignal === "Oversold" ? "positive" :
                                                result.technicals?.rsiSignal === "Overbought" ? "negative" : "neutral",
                                            tagText: result.technicals?.rsiSignal,
                                        },
                                        {
                                            label: "MACD",
                                            value: result.technicals?.macd,
                                            tag: result.technicals?.macd === "Bullish" ? "positive" :
                                                result.technicals?.macd === "Bearish" ? "negative" : "neutral",
                                            tagText: result.technicals?.macd,
                                        },
                                        {
                                            label: "Moving Avg",
                                            value: null,
                                            tag: result.technicals?.movingAvg?.includes("Golden") ? "positive" :
                                                result.technicals?.movingAvg?.includes("Death") ? "negative" : "neutral",
                                            tagText: result.technicals?.movingAvg,
                                        },
                                        {
                                            label: "Trend",
                                            value: null,
                                            tag: result.technicals?.trend?.includes("Up") ? "positive" :
                                                result.technicals?.trend?.includes("Down") ? "negative" : "neutral",
                                            tagText: result.technicals?.trend,
                                        },
                                    ].map((m) => (
                                        <div key={m.label}>
                                            <div style={styles.metricLabel}>{m.label}</div>
                                            {m.value && <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{m.value}</div>}
                                            <span style={styles.tag(m.tag)}>{m.tagText}</span>
                                        </div>
                                    ))}
                                    <div>
                                        <div style={styles.metricLabel}>Support</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: "#15803D" }}>{result.technicals?.support}</div>
                                    </div>
                                    <div>
                                        <div style={styles.metricLabel}>Resistance</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: "#BE123C" }}>{result.technicals?.resistance}</div>
                                    </div>
                                </div>
                                <div style={{ paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Technical Score</span>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#2563EB" }}>{result.technicals?.technicalScore}</span>
                                    </div>
                                    <div style={styles.scoreBar(parseFloat(result.technicals?.technicalScore) || 5)} />
                                    <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>{result.technicals?.technicalVerdict}</div>
                                </div>
                            </div>
                        </div>

                        {/* Strengths + Risks */}
                        <div style={{ ...styles.grid2, marginBottom: 16 }}>
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Strengths</div>
                                {result.strengths?.map((s, i) => (
                                    <div key={i} style={styles.listItem}>
                                        <div style={styles.dot("#22C55E")} />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Key Risks</div>
                                {result.risks?.map((r, i) => (
                                    <div key={i} style={styles.listItem}>
                                        <div style={styles.dot("#F43F5E")} />
                                        <span>{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* India Context + News + Analyst */}
                        <div style={{ ...styles.grid3, marginBottom: 16 }}>
                            {/* India Context */}
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>India Market Context</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {[
                                        { label: "Nifty Correlation", value: result.indiaContext?.niftyCorrelation },
                                        { label: "Beta", value: result.indiaContext?.beta },
                                        { label: "FII/DII Trend", value: result.indiaContext?.fiiDiiTrend },
                                        { label: "Regulatory Risk", value: result.indiaContext?.regulatoryRisk },
                                    ].map((item) => (
                                        <div key={item.label}>
                                            <div style={styles.metricLabel}>{item.label}</div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>{item.value || "—"}</div>
                                        </div>
                                    ))}
                                    {result.indiaContext?.upcomingTriggers?.length > 0 && (
                                        <div>
                                            <div style={styles.metricLabel}>Upcoming Triggers</div>
                                            {result.indiaContext.upcomingTriggers.map((t, i) => (
                                                <div key={i} style={styles.listItem}>
                                                    <div style={styles.dot("#2563EB")} />
                                                    <span style={{ fontSize: 13 }}>{t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Latest News */}
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Latest News</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {result.latestNews?.map((n, i) => (
                                        <div key={i} style={{ paddingBottom: 14, borderBottom: i < result.latestNews.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                                            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, marginBottom: 6, fontWeight: 500 }}>{n.headline}</div>
                                            <span style={styles.tag(n.sentiment === "Positive" ? "positive" : n.sentiment === "Negative" ? "negative" : "neutral")}>
                                                {n.sentiment}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Analyst Consensus */}
                            <div style={styles.card}>
                                <div style={styles.cardTitle}>Analyst Consensus</div>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={styles.metricLabel}>Brokerage View</div>
                                    <div style={{
                                        fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px",
                                        color: result.analystConsensus?.brokerageView === "Bullish" ? "#15803D" :
                                            result.analystConsensus?.brokerageView === "Bearish" ? "#BE123C" : "#B45309"
                                    }}>
                                        {result.analystConsensus?.brokerageView}
                                    </div>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={styles.metricLabel}>Avg Target Price</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>{result.analystConsensus?.avgTargetPrice}</div>
                                </div>
                                <div style={{ marginBottom: 10 }}>
                                    <div style={styles.metricLabel}>Most Bullish</div>
                                    <div style={{ fontSize: 13, color: "#15803D", fontWeight: 600 }}>{result.analystConsensus?.topBullishBroker}</div>
                                </div>
                                <div>
                                    <div style={styles.metricLabel}>Key Concern</div>
                                    <div style={{ fontSize: 13, color: "#BE123C", fontWeight: 600 }}>{result.analystConsensus?.topBearishBroker}</div>
                                </div>
                                <div style={{ marginTop: 16 }}>
                                    <div style={styles.metricLabel}>Macro Factor</div>
                                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{result.indiaContext?.macroFactors}</div>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div style={styles.disclaimer}>
                            ⚠ {result.disclaimer}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}