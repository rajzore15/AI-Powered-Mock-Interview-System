import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const normalizeList = (items) => {
  if (Array.isArray(items)) {
    return items
      .filter((item) => typeof item === "string" && item.trim())
      .map((item) => item.trim());
  }

  if (typeof items === "string") {
    return items
      .split(/[\n|;]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => item.length > 1);
  }

  return [];
};

const normalizeEvaluation = (value) => {
  const evaluation = value && typeof value === "object" ? value : {};
  const safeScore = Number(evaluation.score);
  const hasScore = Number.isFinite(safeScore) && safeScore >= 0 && safeScore <= 10;
  const score = hasScore ? safeScore : 0;

  return {
    score,
    hasScore,
    correctness: typeof evaluation.correctness === "string" && evaluation.correctness.trim() ? evaluation.correctness.trim() : "Evaluation unavailable.",
    strengths: normalizeList(evaluation.strengths),
    areas_to_improve: normalizeList(evaluation.areas_to_improve || evaluation.weaknesses || evaluation.improvement_areas),
    feedback: typeof evaluation.feedback === "string" && evaluation.feedback.trim() ? evaluation.feedback.trim() : "No feedback available.",
    ideal_answer: typeof evaluation.ideal_answer === "string" && evaluation.ideal_answer.trim() ? evaluation.ideal_answer.trim() : "No ideal answer available."
  };
};

const clampPercentage = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, num));
};

const getPerformanceLevel = (scorePercent) => {
  const value = clampPercentage(scorePercent);

  if (value >= 80) return "Excellent";
  if (value >= 60) return "Good";
  if (value >= 40) return "Average";
  return "Needs Improvement";
};

const mergeSimilarItems = (items) => {
  const deduped = [];

  items.forEach((item) => {
    const sentence = String(item || "").trim();
    if (!sentence) return;

    const normalized = sentence.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const isDuplicate = deduped.some((existing) => {
      const existingText = String(existing || "").trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      if (!existingText || !normalized) return false;
      return existingText === normalized || existingText.includes(normalized) || normalized.includes(existingText);
    });

    if (!isDuplicate) deduped.push(sentence);
  });

  return deduped;
};

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function InterviewComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const role = typeof state.role === "string" && state.role.trim() ? state.role.trim() : "Candidate";
  const experience = typeof state.experience === "string" && state.experience.trim() ? state.experience.trim() : "N/A";
  const skill = typeof state.skill === "string" && state.skill.trim() ? state.skill.trim() : "N/A";
  const difficulty = typeof state.difficulty === "string" && state.difficulty.trim() ? state.difficulty.trim() : "N/A";
  const elapsedTime = Number.isFinite(state.elapsedTime) ? state.elapsedTime : 0;
  const questions = Array.isArray(state.questions) ? state.questions : [];
  const answers = Array.isArray(state.answers) ? state.answers : [];
  const evaluations = Array.isArray(state.evaluations) ? state.evaluations : [];

  const reviewCount = Math.max(questions.length, answers.length, evaluations.length);
  const reviews = Array.from({ length: reviewCount }, (_, index) => ({
    question: typeof questions[index] === "string" && questions[index].trim() ? questions[index].trim() : "Question unavailable.",
    answer: typeof answers[index] === "string" && answers[index].trim() ? answers[index].trim() : "No answer recorded.",
    evaluation: normalizeEvaluation(evaluations[index])
  }));

  const validReviews = reviews.filter((review) => review.evaluation.hasScore);
  const totalQuestionCount = Math.max(Number.isFinite(state.totalQuestions) ? state.totalQuestions : 0, reviews.length, 1);
  const totalAnswered = reviews.filter((review) => review.answer !== "No answer recorded." || review.evaluation.hasScore).length;
  const averageScore = totalAnswered ? validReviews.reduce((sum, review) => sum + review.evaluation.score, 0) / totalAnswered : 0;
  const overallPercent = clampPercentage(averageScore * 10);
  const performanceLevel = getPerformanceLevel(overallPercent);
  const scoreLabel = totalAnswered ? `${Math.round(overallPercent)}/100` : "Not scored";

  const overallStrengths = mergeSimilarItems(
    validReviews.flatMap((review) => review.evaluation.strengths)
  );

  const improvementAreas = mergeSimilarItems(
    validReviews.flatMap((review) => review.evaluation.areas_to_improve)
  );

  const improvementSuggestions = improvementAreas.length
    ? improvementAreas
    : ["Practice structured examples and explain your reasoning with clear, specific details."];

  return (
    <div className="interview-complete-page">
      <main className="complete-card report-card">
        <div className="complete-icon">✓</div>
        <p className="report-kicker">Interview performance report</p>
        <h1>Final Interview Report</h1>
        <p className="complete-message">A detailed review of your technical interview performance.</p>

        <section className="report-overview">
          <div className="overview-heading">
            <div>
              <span className="report-label">Overall performance</span>
              <h2>{role}</h2>
            </div>
            <span className="performance-level">{performanceLevel}</span>
          </div>

          <div className="overall-score-panel">
            <div className="overall-score-card">
              <span className="report-label">Overall Score</span>
              <strong>{scoreLabel}</strong>
              <p>Performance: {performanceLevel}</p>
              <div className="score-progress-bar" aria-label={`Overall score ${scoreLabel}`}>
                <span style={{ width: `${overallPercent}%` }} />
              </div>
            </div>

            <div className="score-grid">
              <div className="score-card">
                <span>Questions Completed</span>
                <strong>{totalAnswered}/{totalQuestionCount}</strong>
              </div>
              <div className="score-card">
                <span>Average Score</span>
                <strong>{averageScore ? averageScore.toFixed(1) : "0.0"}/10</strong>
              </div>
              <div className="score-card">
                <span>Duration</span>
                <strong>{formatTime(elapsedTime)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="report-meta">
          <div><strong>Job Role</strong><span>{role}</span></div>
          <div><strong>Primary Skill</strong><span>{skill}</span></div>
          <div><strong>Experience Level</strong><span>{experience}</span></div>
          <div><strong>Difficulty</strong><span>{difficulty}</span></div>
          <div><strong>Questions Completed</strong><span>{totalAnswered}/{totalQuestionCount}</span></div>
        </section>

        <section className="strengths-section">
          <div className="section-title">
            <span className="report-label">Overall strengths</span>
            <h2>What you did well</h2>
          </div>
          {overallStrengths.length ? (
            <ul className="summary-list">
              {overallStrengths.map((strength, index) => <li key={`${strength}-${index}`}>{strength}</li>)}
            </ul>
          ) : (
            <p className="empty-report">No strengths were recorded in the available evaluations.</p>
          )}
        </section>

        <section className="improvement-section">
          <div className="section-title">
            <span className="report-label">Areas for improvement</span>
            <h2>Focus areas</h2>
          </div>
          <ul className="summary-list">
            {improvementSuggestions.map((suggestion, index) => <li key={`${suggestion}-${index}`}>{suggestion}</li>)}
          </ul>
        </section>

        <section className="question-reviews">
          <div className="section-title">
            <span className="report-label">Question reviews</span>
            <h2>Detailed feedback</h2>
          </div>

          {reviews.length ? reviews.map((review, index) => {
            const scorePercent = clampPercentage(review.evaluation.score * 10);
            const reviewPerformance = getPerformanceLevel(scorePercent);

            return (
              <article className="question-review" key={`${review.question}-${index}`}>
                <div className="review-heading">
                  <h3>Question {index + 1}</h3>
                  <div className="review-score-box">
                    <strong>{review.evaluation.score}/10</strong>
                    <span>{reviewPerformance}</span>
                  </div>
                </div>

                <h4>{review.question}</h4>

                <div className="review-answer">
                  <span>Candidate answer</span>
                  <p>{review.answer}</p>
                </div>

                <div className="review-progress">
                  <div>
                    <span>Question score</span>
                    <strong>{review.evaluation.hasScore ? `${review.evaluation.score}/10` : "Not scored"}</strong>
                  </div>
                  <div className="score-progress-bar" aria-label={`Question ${index + 1} score`}>
                    <span style={{ width: `${scorePercent}%` }} />
                  </div>
                </div>

                <div className="review-grid">
                  <div>
                    <span>Correctness</span>
                    <p>{review.evaluation.correctness}</p>
                  </div>

                  <div>
                    <span>Feedback</span>
                    <p>{review.evaluation.feedback}</p>
                  </div>

                  <div>
                    <span>Strengths</span>
                    {review.evaluation.strengths.length ? (
                      <ul>{review.evaluation.strengths.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul>
                    ) : (
                      <p>None recorded.</p>
                    )}
                  </div>

                  <div>
                    <span>Weaknesses</span>
                    {review.evaluation.areas_to_improve.length ? (
                      <ul>{review.evaluation.areas_to_improve.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ul>
                    ) : (
                      <p>No major weaknesses noted.</p>
                    )}
                  </div>

                  <div className="ideal-answer">
                    <span>Improvement suggestions</span>
                    <ul><li>{review.evaluation.areas_to_improve.length ? review.evaluation.areas_to_improve[0] : "Practice structured examples and clarify your reasoning for stronger answers."}</li></ul>
                  </div>

                  <div className="ideal-answer">
                    <span>Ideal Answer</span>
                    <p>{review.evaluation.ideal_answer}</p>
                  </div>
                </div>
              </article>
            );
          }) : (
            <p className="empty-report">No interview evaluations are available yet.</p>
          )}
        </section>

        <div className="complete-actions">
          <button className="complete-button outline" onClick={() => navigate("/")}>Back to Home</button>
          <button
            className="complete-button primary"
            onClick={() => navigate("/interview", { replace: true })}
          >
            Start New Interview
          </button>
        </div>
      </main>
    </div>
  );
}

export default InterviewComplete;
