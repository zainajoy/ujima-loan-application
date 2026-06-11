const fetch = require("node-fetch");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const applicationData = req.body;

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

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://ujima-loan-application.vercel.app",
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

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    const text = data.choices[0].message.content;
    const clean = text
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```json|```/g, "")
      .trim();

    const result = JSON.parse(clean);

    res.status(200).json({
      success: true,
      scout: result.scout,
      guardian: result.guardian,
      hunter: result.hunter
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};