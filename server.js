const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- HISTORY FILE ---
const HISTORY_FILE = path.join(__dirname, "history.json");

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  const history = loadHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, 100);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmed, null, 2));
}

// --- AI CALL WITH VERIFIED FREE MODELS ---
async function runAllAgents(applicationData) {
  const prompt = `
You are an AI system for Ujima SACCO in Kenya. You have 3 agents inside you.
Analyze this loan application and respond as all 3 agents at once.

Member Application:
- Name: ${applicationData.name}
- Age: ${applicationData.age}
- Occupation: ${applicationData.occupation}
- County: ${applicationData.county}
- Loan Amount Requested: KES ${applicationData.loanAmount}
- Reason for Loan: ${applicationData.loanReason}
- Monthly Income: KES ${applicationData.monthlyIncome}
- Number of Children: ${applicationData.children}

AGENT 1 - Scout Agent (Financial Literacy Coach):
- Identify financial stress signals
- Assess harvest cycle awareness
- Flag loan shark mentions
- Give literacy score 0 to 100
- Write warm 2-sentence SMS in simple English

AGENT 2 - Guardian Agent (Loan Triage):
- Calculate risk score 0 to 100
- List risk flags maximum 5
- Decision: approve if loan is 15000 or less AND risk below 40, escalate if loan above 15000, review otherwise
- Write dignified empathetic reason, never use words unreliable or risky

AGENT 3 - Hunter Agent (Human Coordinator):
- Write professional officer briefing
- Suggest repayment schedule based on Kenya harvest cycles March April September October
- Identify cross-sell opportunity
- Assign priority high medium or low

You MUST respond ONLY with this exact JSON, no explanation, no markdown, no extra text:
{
  "scout": {
    "stressSignals": ["signal1"],
    "harvestAwareness": "medium",
    "loanSharkFlag": false,
    "literacyScore": 70,
    "smsMessage": "Warm SMS message here."
  },
  "guardian": {
    "riskScore": 40,
    "riskFlags": ["flag1"],
    "decision": "review",
    "reason": "Empathetic reason here."
  },
  "hunter": {
    "briefing": "Officer briefing here.",
    "repaymentSchedule": "Repayment schedule here.",
    "crossSellOpportunity": "Cross sell opportunity here.",
    "priority": "medium"
  }
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Ujima SACCO"
    },
    body: JSON.stringify({
      models: [
        "google/gemma-4-31b-it:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "nvidia/nemotron-3-super-120b-a12b:free"
      ],
      route: "fallback",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(JSON.stringify(data));

  const text = data.choices[0].message.content;
  const clean = text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error("AI returned invalid JSON: " + clean);
  }
}

// --- ANALYZE ROUTE ---
app.post("/analyze", async (req, res) => {
  try {
    const applicationData = req.body;

    console.log("🦁 Running all 3 agents...");
    const result = await runAllAgents(applicationData);

    // Save to history
    saveHistory({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      applicant: {
        name: applicationData.name,
        age: applicationData.age,
        occupation: applicationData.occupation,
        county: applicationData.county,
        loanAmount: applicationData.loanAmount,
        monthlyIncome: applicationData.monthlyIncome,
        children: applicationData.children,
        loanReason: applicationData.loanReason
      },
      scout: result.scout,
      guardian: result.guardian,
      hunter: result.hunter
    });

    res.json({
      success: true,
      scout: result.scout,
      guardian: result.guardian,
      hunter: result.hunter,
    });

  } catch (error) {
    console.error("Agent error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- DASHBOARD STATS ROUTE ---
app.get("/stats", (req, res) => {
  const history = loadHistory();

  const total = history.length;
  const approved = history.filter(h => h.guardian.decision === "approve").length;
  const escalated = history.filter(h => h.guardian.decision === "escalate").length;
  const review = history.filter(h => h.guardian.decision === "review").length;

  const avgLiteracy = total > 0
    ? Math.round(history.reduce((sum, h) => sum + h.scout.literacyScore, 0) / total)
    : 0;

  const avgRisk = total > 0
    ? Math.round(history.reduce((sum, h) => sum + h.guardian.riskScore, 0) / total)
    : 0;

  const totalLoanValue = history.reduce((sum, h) => sum + Number(h.applicant.loanAmount), 0);

  res.json({
    total,
    approved,
    escalated,
    review,
    avgLiteracy,
    avgRisk,
    totalLoanValue,
    history: history.slice(0, 10)
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Ujima SACCO server running on http://localhost:${PORT}`);
});