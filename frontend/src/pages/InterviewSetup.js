import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function InterviewSetup() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skill, setSkill] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];
    setResumeError("");
    if (!file) return;

    const extension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(extension)) {
      setResume(null);
      setResumeError("Please choose a PDF or DOCX file.");
      event.target.value = "";
      return;
    }
    if (file.size === 0) {
      setResume(null);
      setResumeError("That file is empty. Please choose another resume.");
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResume(null);
      setResumeError("Resume files must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    setResume(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setIsLoading(true);

    const interviewData = {
      role,
      experience,
      skill,
      difficulty,
    };

    console.log("Sending interview data:", interviewData);

    try {
      let resumeId = null;
      if (resume) {
        const formData = new FormData();
        formData.append("resume", resume);
        const uploadResponse = await fetch("http://127.0.0.1:5000/api/upload-resume", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Unable to upload resume");
        }
        resumeId = uploadData.resume_id;
      }

      const response = await fetch(
        "http://127.0.0.1:5000/api/generate-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...interviewData, resume_id: resumeId }),
        }
      );

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.details ||
            "Failed to generate interview question"
        );
      }

      if (!data.question) {
        throw new Error("No question received from backend");
      }

      console.log("Generated question:", data.question);

      // Go to Interview Room with all interview information
      navigate("/interview-room", {
        state: {
          role,
          experience,
          skill,
          difficulty,
          resumeId,
          question: data.question,
        },
      });
    } catch (error) {
      console.error("Interview setup error:", error);

      alert(
        error.message ||
          "Unable to generate interview question. Please check that the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="setup-page">
      <div className="setup-container">
        <div className="setup-heading">
          <span className="setup-eyebrow">AI INTERVIEW STUDIO</span>
          <h1>Set Up Your AI Interview</h1>
          <p>Shape a focused practice session around the role you want next.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="setup-fields">
            <label className="setup-field">Job Role<select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="">Select Job Role</option><option>Python Developer</option><option>Frontend Developer</option><option>Backend Developer</option><option>Full Stack Developer</option><option>Data Scientist</option>
            </select></label>
            <label className="setup-field">Experience Level<select value={experience} onChange={(e) => setExperience(e.target.value)} required>
              <option value="">Select Experience</option><option>Fresher</option><option>0-2 Years</option><option>2-5 Years</option><option>5+ Years</option>
            </select></label>
            <label className="setup-field">Primary Skill / Domain<select value={skill} onChange={(e) => setSkill(e.target.value)} required>
              <option value="">Select Skill</option><option>Python</option><option>Java</option><option>JavaScript</option><option>React</option><option>SQL</option>
            </select></label>
            <label className="setup-field">Difficulty<select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} required>
              <option value="">Select Difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select></label>
          </div>

          <div className="resume-section">
            <div className="resume-heading"><div><h2>Upload Resume (Optional)</h2><p>Upload your resume to get personalized interview questions based on your skills and experience.</p></div><span className="resume-mark">PDF<br />DOCX</span></div>
            <input ref={fileInputRef} className="resume-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleResumeChange} />
            <button className="resume-dropzone" type="button" onClick={() => fileInputRef.current?.click()}>
              <span className="upload-icon" aria-hidden="true">↑</span><span>{resume ? resume.name : "Choose a resume"}</span><small>{resume ? "Ready to personalize your interview" : "PDF or DOCX · up to 10 MB"}</small>
            </button>
            {resumeError && <p className="resume-error" role="alert">{resumeError}</p>}
          </div>

          <button className="setup-submit" type="submit" disabled={isLoading}>{isLoading ? "Preparing Interview..." : "Start AI Interview"}<span aria-hidden="true">→</span></button>
        </form>
      </div>
    </main>
  );
}

export default InterviewSetup;