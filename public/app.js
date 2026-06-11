 async function submitApplication() {
  // --- COLLECT FORM DATA ---
  const name = document.getElementById("name").value.trim();
  const age = document.getElementById("age").value.trim();
  const children = document.getElementById("children").value.trim();
  const occupation = document.getElementById("occupation").value;
  const county = document.getElementById("county").value.trim();
  const monthlyIncome = document.getElementById("monthlyIncome").value.trim();
  const loanAmount = document.getElementById("loanAmount").value.trim();
  const loanReason = document.getElementById("loanReason").value.trim();
  const consent = document.getElementById("consent").checked;

  // --- VALIDATE ---
  if (!name || !age || !children || !occupation || !county || !monthlyIncome || !loanAmount || !loanReason) {
    alert("Please fill in all fields before submitting.");
    return;
  }

  if (!consent) {
    alert("Please give your consent before submitting.");
    return;
  }

  // --- SHOW LOADING STATE ---
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> AI Agents Analyzing...';

  // --- HIDE OLD RESULTS ---
  document.getElementById("resultsCard").style.display = "none";

  try {
    // --- SEND TO BACKEND ---
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, age, children, occupation,
        county, monthlyIncome, loanAmount, loanReason
      })
    });

    const data = await response.json();

    if (!data.success) {
      alert("Something went wrong: " + data.error);
      return;
    }

    // --- DISPLAY RESULTS ---
    displayResults(data);

  } catch (error) {
    alert("Could not connect to server. Make sure it is running.");
    console.error(error);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Submit Application";
  }
}

function displayResults(data) {
  const { scout, guardian, hunter } = data;

  // --- SCOUT RESULTS ---
  const literacyColor = scout.literacyScore >= 70 ? "score-green" :
                        scout.literacyScore >= 40 ? "score-yellow" : "score-red";

  document.getElementById("scoutResults").innerHTML = `
    <div class="result-item">
      <div class="result-label">Literacy Score</div>
      <div class="result-value">${scout.literacyScore} / 100</div>
      <div class="score-bar-wrap">
        <div class="score-bar ${literacyColor}" style="width: ${scout.literacyScore}%"></div>
      </div>
    </div>
    <div class="result-item">
      <div class="result-label">Harvest Cycle Awareness</div>
      <div class="result-value">${capitalize(scout.harvestAwareness)}</div>
    </div>
    <div class="result-item">
      <div class="result-label">Stress Signals Detected</div>
      <div class="result-value">${scout.stressSignals.length > 0 ? scout.stressSignals.join(", ") : "None detected"}</div>
    </div>
    <div class="result-item">
      <div class="result-label">Loan Shark Alert</div>
      <div class="result-value">${scout.loanSharkFlag ? "⚠️ Flag raised — escalating to human officer" : "✅ None detected"}</div>
    </div>
    <div class="result-item">
      <div class="result-label">SMS to Member</div>
      <div class="sms-box">📱 ${scout.smsMessage}</div>
    </div>
  `;

  // --- GUARDIAN RESULTS ---
  const riskColor = guardian.riskScore >= 70 ? "score-red" :
                    guardian.riskScore >= 40 ? "score-yellow" : "score-green";

  document.getElementById("guardianResults").innerHTML = `
    <div class="result-item">
      <div class="result-label">Decision</div>
      <div class="result-value">
        <span class="badge badge-${guardian.decision}">${guardian.decision.toUpperCase()}</span>
      </div>
    </div>
    <div class="result-item">
      <div class="result-label">Risk Score</div>
      <div class="result-value">${guardian.riskScore} / 100</div>
      <div class="score-bar-wrap">
        <div class="score-bar ${riskColor}" style="width: ${guardian.riskScore}%"></div>
      </div>
    </div>
    <div class="result-item">
      <div class="result-label">Risk Flags</div>
      <div class="result-value">${guardian.riskFlags.length > 0 ? guardian.riskFlags.join(", ") : "No flags raised"}</div>
    </div>
    <div class="result-item">
      <div class="result-label">Reason</div>
      <div class="result-value">${guardian.reason}</div>
    </div>
  `;

  // --- HUNTER RESULTS ---
  document.getElementById("hunterResults").innerHTML = `
    <div class="result-item">
      <div class="result-label">Priority</div>
      <div class="result-value">
        <span class="badge badge-${hunter.priority}">${hunter.priority.toUpperCase()}</span>
      </div>
    </div>
    <div class="result-item">
      <div class="result-label">Officer Briefing</div>
      <div class="result-value">${hunter.briefing}</div>
    </div>
    <div class="result-item">
      <div class="result-label">Suggested Repayment Schedule</div>
      <div class="result-value">${hunter.repaymentSchedule}</div>
    </div>
    <div class="result-item">
      <div class="result-label">Cross-Sell Opportunity</div>
      <div class="result-value">${hunter.crossSellOpportunity}</div>
    </div>
  `;

  // --- SHOW RESULTS ---
  const resultsCard = document.getElementById("resultsCard");
  resultsCard.style.display = "flex";
  resultsCard.scrollIntoView({ behavior: "smooth" });
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function resetForm() {
  document.getElementById("name").value = "";
  document.getElementById("age").value = "";
  document.getElementById("children").value = "";
  document.getElementById("occupation").value = "";
  document.getElementById("county").value = "";
  document.getElementById("monthlyIncome").value = "";
  document.getElementById("loanAmount").value = "";
  document.getElementById("loanReason").value = "";
  document.getElementById("consent").checked = false;
  document.getElementById("resultsCard").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
