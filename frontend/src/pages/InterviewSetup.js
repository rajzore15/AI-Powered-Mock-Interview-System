import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function InterviewSetup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skill, setSkill] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const interviewData = {
      role,
      experience,
      skill,
      difficulty,
    };

    // Save interview configuration
    localStorage.setItem(
      "interviewConfig",
      JSON.stringify(interviewData)
    );

    // Move to Interview Room
    navigate("/interview-room");
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
            <option value="">
              Select Job Role
            </option>

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
            <option value="">
              Select Experience
            </option>

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


          {/* Primary Skill */}

          <label>Primary Skill</label>

          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            required
          >
            <option value="">
              Select Skill
            </option>

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
            <option value="">
              Select Difficulty
            </option>

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


          {/* Continue */}

          <button type="submit">
            Continue
          </button>

        </form>

      </div>
    </div>
  );
}

export default InterviewSetup;