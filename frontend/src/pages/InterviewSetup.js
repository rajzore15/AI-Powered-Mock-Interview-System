import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function InterviewSetup() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skill, setSkill] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

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
      const response = await fetch(
        "http://127.0.0.1:5000/api/generate-question",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(interviewData),
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
    <div className="setup-page">
      <div className="setup-container">

        <h1>Set Up Your Interview</h1>

        <p>
          Customize your interview before you begin.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Job Role */}
          <label>Job Role</label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">Select Job Role</option>

            <option value="Python Developer">
              Python Developer
            </option>

            <option value="Frontend Developer">
              Frontend Developer
            </option>

            <option value="Backend Developer">
              Backend Developer
            </option>

            <option value="Full Stack Developer">
              Full Stack Developer
            </option>

            <option value="Data Scientist">
              Data Scientist
            </option>
          </select>

          {/* Experience */}
          <label>Experience Level</label>

          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required
          >
            <option value="">Select Experience</option>

            <option value="Fresher">
              Fresher
            </option>

            <option value="0-2 Years">
              0-2 Years
            </option>

            <option value="2-5 Years">
              2-5 Years
            </option>

            <option value="5+ Years">
              5+ Years
            </option>
          </select>

          {/* Skill */}
          <label>Primary Skill</label>

          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            required
          >
            <option value="">Select Skill</option>

            <option value="Python">
              Python
            </option>

            <option value="Java">
              Java
            </option>

            <option value="JavaScript">
              JavaScript
            </option>

            <option value="React">
              React
            </option>

            <option value="SQL">
              SQL
            </option>
          </select>

          {/* Difficulty */}
          <label>Difficulty</label>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            required
          >
            <option value="">Select Difficulty</option>

            <option value="Easy">
              Easy
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Hard">
              Hard
            </option>
          </select>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Generating Question..."
              : "Start AI Interview"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default InterviewSetup;