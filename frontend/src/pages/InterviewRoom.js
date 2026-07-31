import React, { useRef, useState } from "react";

function InterviewRoom() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError("");
      setStatus("");
      setTranscript("");
      setAudioURL("");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();

      setIsRecording(true);
      setStatus("🔴 Recording...");
    } catch (err) {
      console.error(err);

      setError(
        "Microphone permission was denied or the microphone is unavailable."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("Processing your answer...");
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();

      formData.append(
        "audio",
        audioBlob,
        "interview-answer.webm"
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

      console.log("Whisper response:", data);

      setTranscript(data.transcript);
      setStatus("✅ Answer transcribed successfully!");
    } catch (err) {
      console.error(err);

      setStatus("");
      setError(
        "Unable to transcribe your answer."
      );
    }
  };

  return (
    <div className="interview-room">

      <div className="interview-header">
        <h1>AI Interview Room</h1>

        <p>
          Your AI-powered interview is ready to begin.
        </p>
      </div>

      <div className="interview-card">

        <div className="question-section">

          <span className="question-label">
            Question 1
          </span>

          <h2>
            Tell me about yourself and your background.
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
              className="record-button"
              onClick={stopRecording}
            >
              ⏹ Stop Recording
            </button>
          )}

          {status && (
            <p>
              {status}
            </p>
          )}

          {error && (
            <p style={{ color: "red" }}>
              {error}
            </p>
          )}

          {audioURL && (
            <div className="audio-preview">

              <p>Your recorded answer:</p>

              <audio
                controls
                src={audioURL}
              />

            </div>
          )}

          {transcript && (
            <div className="transcript-section">

              <h3>📝 Your Answer</h3>

              <p>
                {transcript}
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default InterviewRoom;