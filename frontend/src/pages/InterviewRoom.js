import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function InterviewRoom() {
  const location = useLocation();

  const videoRef = useRef(null);
const [cameraOn, setCameraOn] = useState(false);
const [cameraStream, setCameraStream] = useState(null);

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

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // ==============================
  // AI VOICE
  // ==============================

  const speakQuestion = (text) => {
    if ("speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(text);

      speech.rate = 0.9;
      speech.pitch = 1;
      speech.volume = 1;

      speech.onstart = () => {
        setIsSpeaking(true);
      };

      speech.onend = () => {
        setIsSpeaking(false);
      };

      speech.onerror = () => {
        setIsSpeaking(false);
      };

      speech.oncancel = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(speech);
    }
  };

  useEffect(() => {
    speakQuestion(currentQuestion);
  }, [currentQuestion]);

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

  const navigate = useNavigate();

  // Track total questions asked in this session
  const [totalQuestions, setTotalQuestions] = useState(
    interviewData.question ? 1 : 0
  );

  // ==============================
// CAMERA
// ==============================

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    setCameraStream(stream);
    setCameraOn(true);
  } catch (error) {
    console.error("Camera error:", error);
    alert("Please allow camera access.");
  }
};

const stopCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }

  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }

  setCameraStream(null);
  setCameraOn(false);
};

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
  // END INTERVIEW
  // ==============================

  const handleEndInterview = () => {
    const confirmed = window.confirm(
      "Are you sure you want to end the interview?"
    );

    if (!confirmed) {
      // User cancelled — do nothing and stay on the page
      return;
    }

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop any speaking
    if (window && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn("speechSynthesis cancel error:", e);
      }
    }

    // Stop camera if running
    if (cameraOn) {
      try {
        stopCamera();
      } catch (e) {
        console.warn("stopCamera error:", e);
      }
    }

    // Stop microphone recording if active
    try {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } catch (e) {
      console.warn("stopRecording error:", e);
    }

    // Navigate to Interview Complete page with summary state
    try {
      navigate("/interview-complete", {
        state: {
          role,
          difficulty,
          totalQuestions,
          elapsedTime,
        },
      });
    } catch (e) {
      console.warn("Navigation error:", e);
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

      // Increment question count when a new question is generated
      setTotalQuestions((prev) => prev + 1);

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

        <div className="interview-timer">
          <span className="timer-icon">⏱</span>
          <span className="timer-value">{formatTime(elapsedTime)}</span>
        </div>

      {/* AI INTERVIEWER */}

<div className={`ai-interviewer ${isSpeaking ? "ai-speaking" : ""}`}>

  <div className="ai-avatar">
    🤖
  </div>

  <div className="ai-interviewer-info">
    <h3>AI Interviewer</h3>

    <p>
      {isSpeaking
        ? "🔊 Speaking..."
        : "🎧 Listening to your answer"}
    </p>
  </div>

</div>

        {/* QUESTION */}

        <div className="question-section">

          <span className="question-label">
            AI Interview Question
          </span>

          <h2>
            {currentQuestion}
          </h2>

          {isSpeaking && (
            <p>🔊 AI is speaking...</p>
          )}

        </div>

        {/* INTERVIEW CONTROLS */}

        <div className="interview-control-panel">

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

        </div>

       {/* CAMERA */}

<div className="camera-section">

  <div className="camera-header">
    <span>🎥 Your Camera</span>

    {cameraOn && (
      <span className="camera-status active">
        ● Camera On
      </span>
    )}
  </div>

  <div className="camera-video-wrapper">

    {cameraOn && (
      <div className="camera-user-badge">
        <span>👤</span>
        <span>You</span>
      </div>
    )}

    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="camera-preview"
    />

     {/* AI INTERVIEWER OVERLAY */}

  <div className={`ai-video-overlay ${isSpeaking ? "ai-speaking" : ""}`}>

    <div className="ai-video-avatar">
      🤖
    </div>

    <div>
      <strong>AI Interviewer</strong>

      <span>
        {isSpeaking
          ? "🔊 Speaking..."
          : "🎧 Listening"}
      </span>
    </div>

  </div>


    {!cameraOn && (
      <div className="camera-placeholder">
        <div className="camera-placeholder-icon">
          🎥
        </div>

        <p>Camera is currently off</p>
      </div>
    )}

  </div>

  <div className="camera-controls">

    {!cameraOn ? (
      <button
        className="camera-button"
        onClick={startCamera}
      >
        🎥 Turn On Camera
      </button>
    ) : (
      <button
        className="camera-button camera-off-button"
        onClick={stopCamera}
      >
        📷 Turn Off Camera
      </button>
    )}

  </div>

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

          <button
            className="end-interview-button"
            onClick={handleEndInterview}
            title="End the interview"
          >
            🛑 End Interview
          </button>

        </div>

      </div>

    </div>
  );
}

export default InterviewRoom;