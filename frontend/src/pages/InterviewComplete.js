import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";

function InterviewComplete() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {};

  const role = state.role || "Candidate";
  const experience = state.experience || "N/A";
  const skill = state.skill || "N/A";
  const difficulty = state.difficulty || "N/A";
  const totalQuestions = state.totalQuestions ?? 0;
  const elapsedTime = state.elapsedTime ?? 0;
  const questions = Array.isArray(state.questions) ? state.questions : [];
  const answers = Array.isArray(state.answers) ? state.answers : [];
  const evaluations = Array.isArray(state.evaluations) ? state.evaluations : [];

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="interview-complete-page">
      <div className="complete-card">
        <div className="complete-icon">✅</div>

        <h1>Interview Complete!</h1>

        <p className="complete-message">
          Great job! You have successfully completed your AI mock interview.
        </p>

        <div className="complete-info">
          <div className="duration">
            <strong>Total Duration</strong>
            <span>{formatTime(elapsedTime)}</span>
          </div>

          <div className="summary-card">
            <div className="summary-row">
              <strong>Role</strong>
              <span>{role}</span>
            </div>

            <div className="summary-row">
              <strong>Experience</strong>
              <span>{experience}</span>
            </div>

            <div className="summary-row">
              <strong>Primary Skill</strong>
              <span>{skill}</span>
            </div>

            <div className="summary-row">
              <strong>Difficulty</strong>
              <span>{difficulty}</span>
            </div>

            <div className="summary-row">
              <strong>Total Questions</strong>
              <span>{totalQuestions}</span>
            </div>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="summary-card">
            {questions.map((question, index) => (
              <div className="summary-row" key={`${question}-${index}`}>
                <strong>Question {index + 1}</strong>
                <span>{answers[index] || "No answer recorded"}</span>
                {evaluations[index] && (
                  <span>Score: {evaluations[index].score || "N/A"}/10</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="complete-actions">
          <button
            className="complete-button outline"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>

          <button
            className="complete-button primary"
            onClick={() => navigate("/interview")}
          >
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewComplete;
