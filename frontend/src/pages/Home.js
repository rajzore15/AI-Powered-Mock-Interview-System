import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">

      {/* Hero Section */}
      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            AI-Powered Interview Practice
          </div>

          <h1>
            Practice. Improve.{" "}
            <span>Succeed.</span>
          </h1>

          <p>
            Prepare for real-world interviews with an AI interviewer.
            Practice answering questions, receive instant feedback,
            and improve your interview performance.
          </p>

          <div className="hero-buttons">

            <Link to="/interview">
              <button className="start-button">
                Start Your Interview
              </button>
            </Link>

          </div>

        </div>

      </section>

      {/* Features Section */}
      <section className="features-section">

        <div className="section-heading">

          <h2>Everything You Need to Prepare</h2>

          <p>
            Our AI-powered platform helps you practice and improve
            your interview skills.
          </p>

        </div>

        <div className="features-container">

          <div className="feature-card">
            <div className="feature-icon">🎤</div>

            <h3>Voice Interview</h3>

            <p>
              Answer interview questions using your voice
              just like a real interview.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">🤖</div>

            <h3>AI Follow-Up Questions</h3>

            <p>
              Get intelligent follow-up questions based
              on your previous answers.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">📊</div>

            <h3>Answer Scoring</h3>

            <p>
              Receive AI-powered scores and feedback
              to understand your performance.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">📄</div>

            <h3>Improvement Report</h3>

            <p>
              Get a detailed report showing your strengths
              and areas that need improvement.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;