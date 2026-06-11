async function loadDashboard() {
  try {
    const response = await fetch("/stats");
    const data = await response.json();

    // --- DATE ---
    const now = new Date();
    document.getElementById("dashDate").innerHTML =
      `${now.toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}<br>
       <span style="color:#f5c518">${now.toLocaleTimeString("en-KE")}</span>`;

    // --- STAT CARDS ---
    animateNumber("totalApps", data.total);
    animateNumber("totalApproved", data.approved);
    animateNumber("totalEscalated", data.escalated);
    animateNumber("totalReview", data.review);
    animateNumber("avgLiteracy", data.avgLiteracy);
    animateNumber("avgRisk", data.avgRisk);

    // --- TOTAL LOAN VALUE ---
    document.getElementById("totalLoanValue").textContent =
      "KES " + Number(data.totalLoanValue).toLocaleString("en-KE");

    // --- SCORE BARS ---
    setTimeout(() => {
      document.getElementById("literacyBar").style.width = data.avgLiteracy + "%";
      document.getElementById("riskBar").style.width = data.avgRisk + "%";
      const approvalRate = data.total > 0
        ? Math.round((data.approved / data.total) * 100) : 0;
      document.getElementById("approvalBar").style.width = approvalRate + "%";
      document.getElementById("literacyPct").textContent = data.avgLiteracy + "%";
      document.getElementById("riskPct").textContent = data.avgRisk + "%";
      document.getElementById("approvalPct").textContent = approvalRate + "%";
    }, 300);

    // --- DONUT CHART ---
    if (data.total > 0) {
      const circumference = 2 * Math.PI * 70;
      const approveRatio = data.approved / data.total;
      const reviewRatio = data.review / data.total;
      const escalateRatio = data.escalated / data.total;

      const approveDash = approveRatio * circumference;
      const reviewDash = reviewRatio * circumference;
      const escalateDash = escalateRatio * circumference;

      const approveArc = document.getElementById("approveArc");
      const reviewArc = document.getElementById("reviewArc");
      const escalateArc = document.getElementById("escalateArc");

      approveArc.setAttribute("stroke-dasharray", `${approveDash} ${circumference}`);

      const reviewOffset = -approveRatio * circumference;
      reviewArc.setAttribute("stroke-dasharray", `${reviewDash} ${circumference}`);
      reviewArc.setAttribute("transform",
        `rotate(${-90 + approveRatio * 360} 100 100)`);

      escalateArc.setAttribute("stroke-dasharray", `${escalateDash} ${circumference}`);
      escalateArc.setAttribute("transform",
        `rotate(${-90 + (approveRatio + reviewRatio) * 360} 100 100)`);

      document.getElementById("donutTotal").textContent = data.total;
    }

    // --- HISTORY TABLE ---
    const tbody = document.getElementById("historyTable");
    if (data.history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-row">No applications yet. Submit one to see it here.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.history.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString("en-KE", {
        hour: "2-digit", minute: "2-digit"
      });
      const date = new Date(entry.timestamp).toLocaleDateString("en-KE", {
        day: "numeric", month: "short"
      });

      return `
        <tr>
          <td><strong style="color:#f5c518">${entry.applicant.name}</strong></td>
          <td>${entry.applicant.occupation}</td>
          <td>${entry.applicant.county}</td>
          <td>${Number(entry.applicant.loanAmount).toLocaleString()}</td>
          <td>
            <span style="color:${entry.scout.literacyScore >= 70 ? '#10b981' : entry.scout.literacyScore >= 40 ? '#f59e0b' : '#ef4444'}">
              ${entry.scout.literacyScore}/100
            </span>
          </td>
          <td>
            <span style="color:${entry.guardian.riskScore >= 70 ? '#ef4444' : entry.guardian.riskScore >= 40 ? '#f59e0b' : '#10b981'}">
              ${entry.guardian.riskScore}/100
            </span>
          </td>
          <td><span class="badge badge-${entry.guardian.decision}">${entry.guardian.decision}</span></td>
          <td><span class="badge badge-${entry.hunter.priority}">${entry.hunter.priority}</span></td>
          <td style="color:#555">${date} ${time}</td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 40);
}

// Load on page open
loadDashboard();

// Auto refresh every 30 seconds
setInterval(loadDashboard, 30000);