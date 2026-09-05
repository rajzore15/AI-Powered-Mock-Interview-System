import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { readInterviewHistory } from "../services/interviewHistory";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const formatScore = (value) => `${Math.round(value)}%`;

function InterviewHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(readInterviewHistory());
  }, []);

  const totalInterviews = history.length;
  const averageScore = totalInterviews
    ? history.reduce((sum, interview) => sum + interview.overallScore, 0) / totalInterviews
    : 0;
  const bestScore = totalInterviews ? Math.max(...history.map((interview) => interview.overallScore)) : 0;
  const latestScore = totalInterviews ? history[0].overallScore : 0;
  const previousScore = totalInterviews > 1 ? history[1].overallScore : null;
  const improvement = previousScore === null ? null : latestScore - previousScore;

  return (
    <main className="history-page">
      <section className="history-shell">
        <div className="history-header">
          <div>
            <p className="report-kicker">Progress over time</p>
            <h1>Interview History</h1>
            <p>Review completed interviews and track how your performance changes.</p>
          </div>
          <button className="complete-button primary" onClick={() => navigate("/interview")}>Start New Interview</button>
        </div>

        <section className="history-stat-grid" aria-label="Performance statistics">
          <div className="history-stat-card"><span>Total Interviews</span><strong>{totalInterviews}</strong></div>
          <div className="history-stat-card"><span>Average Score</span><strong>{totalInterviews ? formatScore(averageScore) : "N/A"}</strong></div>
          <div className="history-stat-card"><span>Best Score</span><strong>{totalInterviews ? formatScore(bestScore) : "N/A"}</strong></div>
          <div className="history-stat-card"><span>Latest Score</span><strong>{totalInterviews ? formatScore(latestScore) : "N/A"}</strong></div>
        </section>

        <section className="improvement-tracker">
          <div>
            <span className="report-label">Performance trend</span>
            <h2>Score improvement</h2>
          </div>
          {improvement === null ? (
            <p>Complete another interview to compare your progress.</p>
          ) : (
            <div className="trend-comparison">
              <span>Previous Score: <strong>{formatScore(previousScore)}</strong></span>
              <span>Latest Score: <strong>{formatScore(latestScore)}</strong></span>
              <strong className={improvement >= 0 ? "trend-positive" : "trend-negative"}>
                {improvement >= 0 ? "+" : ""}{Math.round(improvement)}%
              </strong>
            </div>
          )}
        </section>

        <section className="history-list-section">
          <div className="section-title">
            <span className="report-label">Completed sessions</span>
            <h2>Your interviews</h2>
          </div>

          {history.length ? (
            <div className="history-list">
              {history.map((interview) => (
                <article className="history-card" key={interview.id}>
                  <div className="history-card-main">
                    <div>
                      <span className="history-date">{formatDate(interview.date)}</span>
                      <h3>{interview.role}</h3>
                      <p>{interview.skill} · {interview.experience} · {interview.difficulty}</p>
                    </div>
                    <div className="history-score">
                      <strong>{formatScore(interview.overallScore)}</strong>
                      <span>{interview.performanceLevel}</span>
                    </div>
                  </div>
                  <div className="history-card-footer">
                    <span>{interview.questions.length || "No"} questions completed{interview.resumeUsed ? " · Resume used" : ""}</span>
                    <button className="complete-button outline" onClick={() => navigate("/interview-complete", { state: { historyRecord: interview } })}>View Report</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <div className="history-empty-icon">⌁</div>
              <h3>No interviews completed yet.</h3>
              <p>Your completed interview reports will appear here.</p>
              <button className="complete-button primary" onClick={() => navigate("/interview")}>Start Your First Interview</button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default InterviewHistory;
