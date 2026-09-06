import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-content">
            <div className="hero-badge">AI-POWERED INTERVIEW PRACTICE</div>
            <h1 id="hero-title">Practice Interviews. <span>Improve Faster.</span></h1>
            <p>
              Build confidence with realistic voice interviews, adaptive questions,
              and clear AI feedback tailored to the role you want next.
            </p>
            <div className="hero-buttons">
              <Link className="start-button" to="/interview">Start AI Interview <span aria-hidden="true">→</span></Link>
              <Link className="history-button" to="/interview-history">View Interview History</Link>
            </div>
            <div className="hero-proof" aria-label="Platform highlights">
              <span><strong>AI-led</strong> practice sessions</span>
              <span><strong>Voice-first</strong> experience</span>
              <span><strong>Actionable</strong> performance reports</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-header"><span className="status-dot" /> Live interview session <span>•••</span></div>
            <div className="visual-avatar">AI</div>
            <div className="visual-wave"><i /><i /><i /><i /><i /><i /><i /></div>
            <p>Tell me about a project you are proud of.</p>
            <div className="visual-footer"><span>Question 03</span><span>02:18</span></div>
          </div>
        </section>

        <section className="features-section" aria-labelledby="features-title">
          <div className="section-heading">
            <span className="section-eyebrow">A smarter way to prepare</span>
            <h2 id="features-title">Your personal interview practice studio</h2>
            <p>Everything you need to turn practice sessions into stronger, more confident answers.</p>
          </div>
          <div className="features-container">
            <article className="feature-card"><div className="feature-icon">🎤</div><h3>Voice-Based Interview</h3><p>Answer naturally with a hands-free interview experience.</p></article>
            <article className="feature-card"><div className="feature-icon">🤖</div><h3>AI Answer Evaluation</h3><p>Get useful feedback on clarity, relevance, and delivery.</p></article>
            <article className="feature-card"><div className="feature-icon">📄</div><h3>Resume-Based Questions</h3><p>Turn your experience into questions that feel relevant.</p></article>
            <article className="feature-card"><div className="feature-icon">🧠</div><h3>Adaptive Questions</h3><p>Keep the conversation challenging and personalized.</p></article>
            <article className="feature-card"><div className="feature-icon">📊</div><h3>Performance Analytics</h3><p>See your progress and focus your next practice session.</p></article>
            <article className="feature-card"><div className="feature-icon">🔊</div><h3>AI Interviewer Voice</h3><p>Practice with spoken questions for a more realistic flow.</p></article>
          </div>
        </section>

        <section className="process-section" aria-labelledby="process-title">
          <div className="section-heading"><span className="section-eyebrow">From setup to insight</span><h2 id="process-title">How it works</h2></div>
          <ol className="process-list">
            <li><span>01</span><h3>Configure Interview</h3><p>Choose your role, skill, experience, and difficulty.</p></li>
            <li><span>02</span><h3>Check Camera &amp; Microphone</h3><p>Make sure your setup is ready for the session.</p></li>
            <li><span>03</span><h3>Answer AI Questions</h3><p>Respond naturally through the guided interview.</p></li>
            <li><span>04</span><h3>Receive AI Evaluation</h3><p>Get focused feedback as your answers are assessed.</p></li>
            <li><span>05</span><h3>View Performance Report</h3><p>Review your strengths and next areas to improve.</p></li>
          </ol>
        </section>

        <section className="home-cta" aria-labelledby="cta-title">
          <div><span className="section-eyebrow">Your next opportunity starts here</span><h2 id="cta-title">Ready to test your interview skills?</h2></div>
          <Link className="start-button cta-button" to="/interview">Start Interview <span aria-hidden="true">→</span></Link>
        </section>
      </main>
    </div>
  );
}

export default Home;