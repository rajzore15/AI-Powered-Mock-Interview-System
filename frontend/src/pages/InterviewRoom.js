import React, { useState } from "react";
import { useLocation } from "react-router-dom";

function InterviewRoom() {
  const location = useLocation();

  // ==============================
  // INTERVIEW DATA
  // ==============================

  const interviewData = location.state || {};

  const role = interviewData.role || "Python Developer";
  const experience = interviewData.experience || "Fresher";
  const skill = interviewData.skill || "Python";
  const difficulty = interviewData.difficulty || "Easy";

  const [currentQuestion, setCurrentQuestion] = useState(
    interviewData.question ||
      "Tell me about yourself and your background."
  );

  // ==============================
  // STATES
  // ==============================

  const [isLoading, setIsLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);

  const [audioURL, setAudioURL] = useState(null);

  const [transcript, setTranscript] = useState("");

  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Day 4 - Evaluation
  const [evaluation, setEvaluation] = useState("");

  const [isEvaluating, setIsEvaluating] = useState(false);

  // ==============================
  // START RECORDING
  // ==============================

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder = new MediaRecorder(stream);

      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);

        setAudioURL(url);

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        await transcribeAudio(audioBlob);
      };

      recorder.start();

      setMediaRecorder(recorder);

      setIsRecording(true);

      // Clear old evaluation
      setEvaluation("");
    } catch (error) {
      console.error("Microphone error:", error);

      alert(
        "Please allow microphone access and try again."
      );
    }
  };

  // ==============================
  // STOP RECORDING
  // ==============================

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();

      setIsRecording(false);
    }
  };

  // ==============================
  // TRANSCRIBE AUDIO
  // ==============================

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();

      formData.append(
        "audio",
        audioBlob,
        "answer.webm"
      );

      const response = await fetch(
        "http://127.0.0.1:5000/api/transcribe",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Transcription failed"
        );
      }

      console.log(
        "Transcript:",
        data.transcript
      );

      setTranscript(data.transcript);
    } catch (error) {
      console.error(
        "Transcription error:",
        error
      );

      alert(
        "Unable to transcribe your answer."
      );
    }
  };

  // ==============================
  // EVALUATE ANSWER - DAY 4
  // ==============================

  const evaluateCandidateAnswer = async () => {
    if (!transcript) {
      alert(
        "Please record your answer first."
      );

      return;
    }

    if (isEvaluating) return;

    setIsEvaluating(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/evaluate-answer",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question: currentQuestion,
            answer: transcript,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Evaluation response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to evaluate answer"
        );
      }

      setEvaluation(data.evaluation);
    } catch (error) {
      console.error(
        "Evaluation error:",
        error
      );

      alert(
        error.message ||
          "Unable to evaluate your answer."
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  // ==============================
  // NEXT QUESTION
  // ==============================

  const nextQuestion = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const requestData = {
      role: role,
      experience: experience,
      skill: skill,
      difficulty: difficulty,
    };

    console.log(
      "Sending interview data:",
      requestData
    );

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/generate-question",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      console.log(
        "Backend response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate next question"
        );
      }

      setCurrentQuestion(data.question);

      // Clear previous answer
      setAudioURL(null);

      setTranscript("");

      // Clear previous evaluation
      setEvaluation("");
    } catch (error) {
      console.error(
        "Next question error:",
        error
      );

      alert(
        error.message ||
          "Unable to generate next question."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // UI
  // ==============================

  return (
    <div className="interview-room">

      <div className="interview-header">

        <h1>
          AI Interview Room
        </h1>

        <p>
          {role} Interview •{" "}
          {difficulty} Difficulty
        </p>

      </div>

      <div className="interview-card">

        {/* QUESTION */}

        <div className="question-section">

          <span className="question-label">
            AI Interview Question
          </span>

          <h2>
            {currentQuestion}
          </h2>

        </div>

        {/* RECORDING */}

        <div className="voice-section">

          {!isRecording ? (
            <button
              className="record-button"
              onClick={startRecording}
            >
              🎤 Start Recording
            </button>
          ) : (
            <button
              className="record-button recording"
              onClick={stopRecording}
            >
              ⏹ Stop Recording
            </button>
          )}

          <p>
            {isRecording
              ? "Recording your answer..."
              : "Click the button to record your answer."}
          </p>

          {/* AUDIO */}

          {audioURL && (
            <div className="audio-result">

              <p>
                ✅ Answer recorded successfully!
              </p>

              <audio
                controls
                src={audioURL}
              />

            </div>
          )}

          {/* TRANSCRIPT */}

          {transcript && (
            <div className="transcript-section">

              <h3>
                Your Answer
              </h3>

              <p>
                {transcript}
              </p>

            </div>
          )}

          {/* EVALUATE BUTTON */}

          {transcript && (
            <div className="evaluation-action">

              <button
                className="evaluate-button"
                onClick={
                  evaluateCandidateAnswer
                }
                disabled={isEvaluating}
              >
                {isEvaluating
                  ? "Evaluating..."
                  : "🤖 Evaluate My Answer"}
              </button>

            </div>
          )}

          {/* EVALUATION RESULT */}

                      {evaluation && (
              <div className="evaluation-section">

                <h3>🤖 AI Evaluation</h3>

                <div className="evaluation-score">
                  <strong>Score</strong>
                  <span>{evaluation.score || "N/A"}/10</span>
                </div>

                <div className="evaluation-content">

                  <div className="evaluation-box">
                    <h4>💬 Feedback</h4>
                    <p>
                      {evaluation.feedback || "No feedback available."}
                    </p>
                  </div>

                  <div className="evaluation-box">
                    <h4>✅ Strengths</h4>
                    <p>
                      {evaluation.strengths || "No strengths provided."}
                    </p>
                  </div>

                  <div className="evaluation-box">
                    <h4>⚠️ Weaknesses</h4>
                    <p>
                      {evaluation.weaknesses || "No weaknesses provided."}
                    </p>
                  </div>

                  <div className="evaluation-box">
                    <h4>💡 Improvement</h4>
                    <p>
                      {evaluation.improvement ||
                        "No improvement suggestions available."}
                    </p>
                  </div>

                </div>

              </div>
            )}
        </div>

        {/* NEXT QUESTION */}

        <div className="interview-actions">

          <button
            className="next-button"
            onClick={nextQuestion}
            disabled={isLoading}
          >
            {isLoading
              ? "Generating..."
              : "Next Question →"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default InterviewRoom;