import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const normalizeEvaluation = (value) => {
  const evaluation = value && typeof value === "object" ? value : {};
  const score = Number.isInteger(evaluation.score) && evaluation.score >= 0 && evaluation.score <= 10 ? evaluation.score : 0;
  const list = (items) => Array.isArray(items) ? items.filter((item) => typeof item === "string" && item.trim()) : [];
  return {
    score,
    correctness: typeof evaluation.correctness === "string" ? evaluation.correctness : "Evaluation unavailable.",
    strengths: list(evaluation.strengths),
    areas_to_improve: list(evaluation.areas_to_improve),
    feedback: typeof evaluation.feedback === "string" ? evaluation.feedback : "No feedback available.",
    ideal_answer: typeof evaluation.ideal_answer === "string" ? evaluation.ideal_answer : "No ideal answer available."
  };
};

function InterviewComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const role = state.role || "Candidate";
  const experience = state.experience || "N/A";
  const skill = state.skill || "N/A";
  const difficulty = state.difficulty || "N/A";
  const elapsedTime = Number.isFinite(state.elapsedTime) ? state.elapsedTime : 0;
  const questions = Array.isArray(state.questions) ? state.questions : [];
  const answers = Array.isArray(state.answers) ? state.answers : [];
  const evaluations = Array.isArray(state.evaluations) ? state.evaluations : [];
  const reviews = questions.map((question, index) => ({
    question: typeof question === "string" ? question : "Question unavailable.",
    answer: typeof answers[index] === "string" ? answers[index] : "No answer recorded",
    evaluation: normalizeEvaluation(evaluations[index])
  }));
  const evaluatedReviews = reviews.slice(0, evaluations.length);
  const totalScore = evaluatedReviews.reduce((sum, review) => sum + review.evaluation.score, 0);
  const maximumScore = evaluatedReviews.length * 10;
  const averageScore = evaluatedReviews.length ? totalScore / evaluatedReviews.length : 0;
  const performanceLevel = averageScore >= 8.5 ? "Excellent" : averageScore >= 7 ? "Good" : averageScore >= 5 ? "Average" : "Needs Improvement";
  const suggestions = [...new Set(evaluatedReviews.flatMap((review) => review.evaluation.areas_to_improve))];
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="interview-complete-page">
      <main className="complete-card report-card">
        <div className="complete-icon">✓</div>
        <p className="report-kicker">Interview performance report</p>
        <h1>Interview Complete</h1>
        <p className="complete-message">A detailed review of your technical interview performance.</p>
        <section className="report-overview">
          <div className="overview-heading"><div><span className="report-label">Overall performance</span><h2>{role}</h2></div><span className="performance-level">{performanceLevel}</span></div>
          <div className="score-grid">
            <div className="score-card"><span>Overall Score</span><strong>{totalScore} / {maximumScore}</strong></div>
            <div className="score-card"><span>Average Score</span><strong>{averageScore.toFixed(1)} / 10</strong></div>
            <div className="score-card"><span>Duration</span><strong>{formatTime(elapsedTime)}</strong></div>
          </div>
        </section>
        <section className="report-meta"><div><strong>Experience</strong><span>{experience}</span></div><div><strong>Primary Skill</strong><span>{skill}</span></div><div><strong>Difficulty</strong><span>{difficulty}</span></div><div><strong>Questions Evaluated</strong><span>{evaluatedReviews.length}</span></div></section>
        <section className="question-reviews">
          <div className="section-title"><span className="report-label">Question reviews</span><h2>Detailed feedback</h2></div>
          {reviews.length ? reviews.map((review, index) => (
            <article className="question-review" key={`${review.question}-${index}`}>
              <div className="review-heading"><h3>Question {index + 1}</h3><strong>{review.evaluation.score} / 10</strong></div>
              <h4>{review.question}</h4>
              <div className="review-answer"><span>Candidate answer</span><p>{review.answer}</p></div>
              <div className="review-grid">
                <div><span>Correctness</span><p>{review.evaluation.correctness}</p></div><div><span>Feedback</span><p>{review.evaluation.feedback}</p></div>
                <div><span>Strengths</span>{review.evaluation.strengths.length ? <ul>{review.evaluation.strengths.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul> : <p>None recorded.</p>}</div>
                <div><span>Areas to Improve</span>{review.evaluation.areas_to_improve.length ? <ul>{review.evaluation.areas_to_improve.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul> : <p>None recorded.</p>}</div>
                <div className="ideal-answer"><span>Ideal Answer</span><p>{review.evaluation.ideal_answer}</p></div>
              </div>
            </article>
          )) : <p className="empty-report">No interview evaluations are available yet.</p>}
        </section>
        <section className="improvement-section"><div className="section-title"><span className="report-label">Next steps</span><h2>Overall improvement suggestions</h2></div>{suggestions.length ? <ul>{suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul> : <p>Keep practicing concise, technically accurate answers with concrete examples.</p>}</section>
        <div className="complete-actions"><button className="complete-button outline" onClick={() => navigate("/")}>Back to Home</button><button className="complete-button primary" onClick={() => navigate("/interview")}>Start New Interview</button></div>
      </main>
    </div>
  );
}

export default InterviewComplete;
