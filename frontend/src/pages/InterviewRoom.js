import React, { useState } from "react";
import { useLocation } from "react-router-dom";

function InterviewRoom() {
  const location = useLocation();

  // Get interview data from InterviewSetup
  const interviewData = location.state || {};

  const role = interviewData.role || "Python Developer";
  const experience = interviewData.experience || "Fresher";
  const skill = interviewData.skill || "Python";
  const difficulty = interviewData.difficulty || "Easy";

  const [currentQuestion, setCurrentQuestion] = useState(
    interviewData.question ||
      "Tell me about yourself and your background."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);

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

      setAudioURL(null);
      setTranscript("");
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

        <div className="question-section">

          <span className="question-label">
            AI Interview Question
          </span>

          <h2>
            {currentQuestion}
          </h2>

        </div>

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

        </div>

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