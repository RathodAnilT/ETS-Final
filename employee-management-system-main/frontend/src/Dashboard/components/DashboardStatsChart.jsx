import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend);

const DashboardStatsChart = ({ stats }) => {
  const data = {
    labels: ["Active Tasks", "Pending Approvals", "Pending Leaves"],
    datasets: [
      {
        data: [
          stats.activeTasks || 0,
          stats.pendingApprovals || 0,
          stats.pendingLeaves || 0,
        ],
        backgroundColor: [
          "#4b6cb7", // blue
          "#f1c40f", // yellow
          "#e74c3c", // red
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { boxWidth: 18, font: { size: 14 } },
      },
    },
  };

  return (
    <div style={{ width: "100%", maxWidth: 350, margin: "0 auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: 24 }}>
      <h5 style={{ textAlign: "center", marginBottom: 18, color: "#2c3e50" }}>Task & Leave Stats</h5>
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default DashboardStatsChart;