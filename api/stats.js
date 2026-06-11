module.exports = async (req, res) => {
  res.status(200).json({
    total: 0,
    approved: 0,
    escalated: 0,
    review: 0,
    avgLiteracy: 0,
    avgRisk: 0,
    totalLoanValue: 0,
    history: []
  });
};