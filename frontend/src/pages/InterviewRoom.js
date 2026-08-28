import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const normalizeEvaluation = (value) => {
  const evaluation = value && typeof value === "object" ? value : {};
  const score = Number.isInteger(evaluation.score) && evaluation.score >= 0 && evaluation.score <= 10
    ? evaluation.score
    : 0;
  const toList = (items) => Array.isArray(items) ? items.filter((item) => typeof item === "string" && item.trim()) : [];

  return {
    score,
    correctness: typeof evaluation.correctness === "string" ? evaluation.correctness : "Evaluation unavailable.",
    strengths: toList(evaluation.strengths),
    areas_to_improve: toList(evaluation.areas_to_improve),
    feedback: typeof evaluation.feedback === "string" ? evaluation.feedback : "No feedback available.",
    ideal_answer: typeof evaluation.ideal_answer === "string" ? evaluation.ideal_answer : "No ideal answer available."
  };
};

const cleanEvaluationTranscript = (value) => value
  .replace(/\b(?:um+|uh+|actually)\b(?:\s+\b(?:um+|uh+|actually)\b)+/gi, " ")
  .replace(/\s+/g, " ")
  .trim();

function InterviewRoom() {
  const location = useLocation();
  const TOTAL_QUESTIONS = 5;

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
  const resumeId = interviewData.resumeId || null;

  const [currentQuestion, setCurrentQuestion] = useState(
    interviewData.question ||
      "Tell me about yourself and your background."
  );
  const [questions, setQuestions] = useState([
    interviewData.question ||
      "Tell me about yourself and your background."
  ]);
  const [, setAnswers] = useState([]);
  const [, setEvaluations] = useState([]);
  const questionsRef = useRef(questions);
  const answersRef = useRef([]);
  const evaluationsRef = useRef([]);
  const processingRef = useRef(false);
  const prefetchKeyRef = useRef(null);
  const prefetchedQuestionRef = useRef(null);
  const prefetchPromiseRef = useRef(null);
  const advanceTimerRef = useRef(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const speechRequestRef = useRef(0);

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

  const speakQuestion = useCallback((text) => {
    if (!("speechSynthesis" in window) || !text) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    setIsSpeaking(false);
    setInterviewStatus("🔊 AI Interviewer is speaking...");

    const requestId = speechRequestRef.current + 1;
    speechRequestRef.current = requestId;

    const completeSpeech = (message = "🎤 Your turn - Start answering") => {
      if (requestId !== speechRequestRef.current) return;
      setIsSpeaking(false);
      setInterviewStatus(message);
    };

    const speak = () => {
      if (requestId !== speechRequestRef.current) return;
      const voices = synthesis.getVoices();
      const englishVoices = voices.filter((voice) => /^en(-|_|$)/i.test(voice.lang));
      const femaleVoice = englishVoices.find((voice) => /female|samantha|karen|victoria|zira|aria|jenny|libby|susan|moira/i.test(voice.name));
      const selectedVoice = femaleVoice || englishVoices.find((voice) => /natural|neural|google|microsoft|enhanced/i.test(voice.name)) || englishVoices[0] || voices[0];
      const speech = new SpeechSynthesisUtterance(text);

      if (selectedVoice) speech.voice = selectedVoice;
      speech.rate = 0.88;
      speech.pitch = 1;
      speech.volume = 1;
      speech.onstart = () => {
        if (requestId !== speechRequestRef.current) return;
        setIsSpeaking(true);
        setInterviewStatus("🔊 AI Interviewer is speaking...");
      };
      speech.onend = () => completeSpeech("🎤 Your turn - Start answering");
      speech.onerror = () => completeSpeech("🎤 Your turn - Start answering");
      speech.oncancel = () => completeSpeech("🎤 Your turn - Start answering");
      synthesis.speak(speech);
    };

    if (synthesis.getVoices().length) {
      speak();
    } else {
      synthesis.addEventListener("voiceschanged", speak, { once: true });
    }
  }, []);

  useEffect(() => {
    speakQuestion(currentQuestion);
    return () => {
      speechRequestRef.current += 1;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [currentQuestion, speakQuestion]);

  useEffect(() => () => {
    speechRequestRef.current += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // ==============================
  // STATES
  // ==============================

  const [isPreparingNext, setIsPreparingNext] = useState(false);
  const [prefetchedQuestion, setPrefetchedQuestion] = useState(null);
  const [interviewStatus, setInterviewStatus] = useState("🔊 AI Interviewer is speaking...");

  const [isRecording, setIsRecording] = useState(false);

  const [audioURL, setAudioURL] = useState(null);

  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Day 4 - Evaluation
  const [evaluation, setEvaluation] = useState("");

  const [isEvaluating, setIsEvaluating] = useState(false);

  const navigate = useNavigate();

  // Track total questions asked in this session
  const [totalQuestions, setTotalQuestions] = useState(1);

  useEffect(() => () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
  }, []);

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
    if (isSpeaking || processingRef.current || isRecording || isPreparingNext || isTranscribing || isEvaluating) return;

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

        setMediaRecorder(null);
        await processAnswer(audioBlob);
      };

      recorder.start();

      setMediaRecorder(recorder);
      setIsRecording(true);
      setInterviewStatus("🎤 Listening to your answer...");

      setAudioURL(null);
      setTranscript("");
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
    if (mediaRecorder && !processingRef.current) {
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
          experience,
          skill,
          difficulty,
          questions: questionsRef.current,
          answers: answersRef.current,
          evaluations: evaluationsRef.current,
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
    setIsTranscribing(true);
    setInterviewStatus("⏳ Transcribing your answer...");

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

      if (typeof data.transcript !== "string" || !data.transcript.trim()) {
        throw new Error("No transcript received from backend");
      }

      console.log(
        "Transcript:",
        data.transcript
      );

      setTranscript(data.transcript);
      return data.transcript;
    } catch (error) {
      console.error(
        "Transcription error:",
        error
      );

      alert(
        error.message ||
          "Unable to transcribe your answer."
      );
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  // ==============================
  // EVALUATE ANSWER - DAY 4
  // ==============================

  const evaluateCandidateAnswer = async (question = currentQuestion, answer = transcript) => {
    if (!answer) {
      alert(
        "Please record your answer first."
      );

      return;
    }

    if (isEvaluating || isTranscribing) return;

    setIsEvaluating(true);
    setInterviewStatus("🤖 AI is evaluating your answer...");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/evaluate-answer",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question,
            answer,
            role,
            experience,
            skill,
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

      if (!data.evaluation) {
        throw new Error("No evaluation received from backend");
      }

      const normalizedEvaluation = normalizeEvaluation(data.evaluation);
      setEvaluation(normalizedEvaluation);
      return normalizedEvaluation;
    } catch (error) {
      console.error(
        "Evaluation error:",
        error
      );

      alert(
        error.message ||
          "Unable to evaluate your answer."
      );
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  // ==============================
  // AUTOMATIC QUESTION FLOW
  // ==============================

  const requestNextQuestion = useCallback(async () => {
    const response = await fetch(
      "http://127.0.0.1:5000/api/generate-question",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, experience, skill, difficulty, resume_id: resumeId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate next question");
    }

    if (!data.question) {
      throw new Error("No question received from backend");
    }

    return data.question;
  }, [role, experience, skill, difficulty, resumeId]);

  useEffect(() => {
    if (!isRecording || totalQuestions >= TOTAL_QUESTIONS) return;

    const prefetchKey = `${totalQuestions}:${currentQuestion}`;
    if (prefetchKeyRef.current === prefetchKey) return;

    prefetchKeyRef.current = prefetchKey;
    setPrefetchedQuestion(null);
    const request = requestNextQuestion()
      .then((question) => {
        prefetchedQuestionRef.current = question;
        setPrefetchedQuestion(question);
        return question;
      })
      .catch((error) => {
        console.warn("Next question prefetch failed:", error);
        prefetchedQuestionRef.current = null;
        setPrefetchedQuestion(null);
        return null;
      });

    prefetchPromiseRef.current = request;
  }, [isRecording, totalQuestions, currentQuestion, requestNextQuestion]);

  const getNextQuestion = async () => {
    if (prefetchedQuestionRef.current) {
      return prefetchedQuestionRef.current;
    }

    if (prefetchPromiseRef.current) {
      const question = await prefetchPromiseRef.current;
      if (question) return question;
    }

    return requestNextQuestion();
  };

  const handleFinishInterview = (finalAnswers = answersRef.current, finalEvaluations = evaluationsRef.current) => {
    navigate("/interview-complete", {
      state: {
        role,
        experience,
        skill,
        difficulty,
        questions: questionsRef.current,
        answers: finalAnswers,
        evaluations: finalEvaluations,
        totalQuestions,
        elapsedTime,
      },
    });
  };

  const saveEvaluationAndAdvance = async (answer, result) => {
    const answerIndex = totalQuestions - 1;
    answersRef.current = [...answersRef.current];
    answersRef.current[answerIndex] = answer;
    evaluationsRef.current = [...evaluationsRef.current];
    evaluationsRef.current[answerIndex] = result;
    setAnswers(answersRef.current);
    setEvaluations(evaluationsRef.current);

    if (totalQuestions === TOTAL_QUESTIONS) {
      setInterviewStatus("✓ Answer evaluated");
      setIsPreparingNext(true);
      advanceTimerRef.current = setTimeout(() => {
        handleFinishInterview(answersRef.current, evaluationsRef.current);
      }, 1000);
      return;
    }

    setInterviewStatus("✓ Answer evaluated");
    setIsPreparingNext(true);
    const nextQuestion = await getNextQuestion();
    if (!nextQuestion) {
      throw new Error("Unable to prepare the next question");
    }

    advanceTimerRef.current = setTimeout(() => {
      setInterviewStatus("⏳ Preparing next question...");
    }, 250);

    advanceTimerRef.current = setTimeout(() => {
      setInterviewStatus("✓ Next question ready");
      window.setTimeout(() => {
        prefetchedQuestionRef.current = null;
        prefetchPromiseRef.current = null;
        setPrefetchedQuestion(null);
        questionsRef.current = [...questionsRef.current, nextQuestion];
        setQuestions(questionsRef.current);
        setCurrentQuestion(nextQuestion);
        setTotalQuestions((previousTotal) => previousTotal + 1);
        setAudioURL(null);
        setTranscript("");
        setEvaluation("");
        setIsPreparingNext(false);
      }, 700);
    }, 1200);
  };

  const processAnswer = async (audioBlob) => {
    if (processingRef.current) return;

    processingRef.current = true;

    try {
      const answer = await transcribeAudio(audioBlob);
      if (!answer) return;

      const evaluationAnswer = cleanEvaluationTranscript(answer);
      if (evaluationAnswer.length < 3 || evaluationAnswer.split(" ").length < 2) {
        alert("Your answer was too short to evaluate. Please record it again.");
        return;
      }

      const result = await evaluateCandidateAnswer(currentQuestion, evaluationAnswer);
      if (!result) return;
      await saveEvaluationAndAdvance(answer, result);
    } catch (error) {
      console.error("Automatic interview flow error:", error);
      alert(error.message || "Unable to prepare the next question.");
      setIsPreparingNext(false);
    } finally {
      processingRef.current = false;
    }
  };

  // ==============================
  // UI
  // ==============================

  const aiState = isSpeaking ? "speaking" : isRecording ? "listening" : "ready";
  const processingStatus = isSpeaking
    ? "🔊 AI Interviewer is speaking..."
    : isRecording
      ? "🎤 Listening to your answer..."
      : isTranscribing
        ? "⏳ Transcribing your answer..."
        : isEvaluating
          ? "🤖 AI is evaluating your answer..."
          : isPreparingNext
            ? "⏳ Preparing next question..."
            : interviewStatus || "🎤 Your turn - Start answering";
  const aiStateLabel = isSpeaking
    ? "AI is speaking"
    : isRecording
      ? "Listening to your answer"
      : "Ready for your answer";
  const interviewSubtitle = interviewData.role
    ? `${difficulty} technical round · ${role}`
    : "Technical round · Python Developer";
  const bannerLabel = isSpeaking
    ? "AI Interviewer"
    : isRecording
      ? "Recording"
      : isTranscribing
        ? "Processing"
        : isEvaluating
          ? "Evaluating"
          : isPreparingNext
            ? "Transition"
            : "Ready";
  const bannerMessage = processingStatus;
  const canStartRecording = !isSpeaking && !isRecording && !isTranscribing && !isEvaluating && !isPreparingNext && !processingRef.current;
  const canStopRecording = isRecording && !isTranscribing && !isEvaluating && !isPreparingNext && !processingRef.current;
  const recordButtonLabel = isSpeaking
    ? "Please wait for AI..."
    : isRecording
      ? "Stop Recording"
      : isTranscribing
        ? "Transcribing..."
        : isEvaluating
          ? "Evaluating..."
          : isPreparingNext
            ? "Preparing..."
            : "Start Answer";

  return (
    <div className="interview-room modern">
      <div className="interview-card modern-card">
        <div className="interview-header modern-header">
          <div className="header-left">
            <div className="header-title">
              <h1>Practice Interview</h1>
              <p>{interviewSubtitle}</p>
            </div>
          </div>
          <div className="header-right">
            <div className="interview-timer header-timer">
              <span className="timer-icon">◷</span>
              <span className="timer-value">{formatTime(elapsedTime)}</span>
            </div>
            <button className="end-interview-button" onClick={handleEndInterview} title="End the interview">
              <span aria-hidden="true">×</span> End Interview
            </button>
          </div>
        </div>

        <div className={`interview-status-banner ai-state-${aiState}`}>
          <div className="status-banner-copy">
            <div className="voice-wave-icon" aria-hidden="true"><span /><span /><span /><span /></div>
            <div>
              <span className="status-banner-label">{bannerLabel}</span>
              <strong>{bannerMessage}</strong>
            </div>
          </div>
          <span className="voice-mode-pill"><span aria-hidden="true">⌁</span> Real-time voice</span>
        </div>

        <div className="video-interview-grid">
          <div className="user-camera-panel">
            <div className="camera-section">
              <div className="camera-header">
                <span>🎥 Your Camera</span>
                <button className="camera-settings-button" type="button" aria-label="Camera settings">⚙</button>
              </div>
              <div className="camera-video-wrapper">
                {cameraOn && (
                  <div className="camera-user-badge"><span className="camera-record-dot" /> <span>You</span></div>
                )}
                <video ref={videoRef} autoPlay muted playsInline className="camera-preview" />
                {!cameraOn && (
                  <div className="camera-placeholder">
                    <div className="camera-placeholder-icon">🎥</div>
                    <p>Camera is currently off</p>
                  </div>
                )}
              </div>
              <div className="camera-controls">
                {!cameraOn ? (
                  <button className="camera-button" onClick={startCamera}>🎥 Turn On Camera</button>
                ) : (
                  <button className="camera-button camera-off-button" onClick={stopCamera}>📷 Turn Off Camera</button>
                )}
              </div>
            </div>
          </div>

          <div className={`ai-video-panel ai-state-${aiState}`}>
            <div className="ai-panel-topline">
              <span className="ai-state-pill"><span className="mini-wave" aria-hidden="true">⌁</span> {isSpeaking ? "Speaking" : isRecording ? "Listening" : "Ready"}</span>
              <span className="ai-voice-icon" aria-hidden="true">⌁</span>
            </div>
            <div className="ai-avatar-stage">
              <div className="ai-avatar large" aria-hidden="true">🤖</div>
            </div>
            <div className="ai-interviewer-info">
              <div className="ai-live-status" aria-live="polite">
                <span className="ai-status-dot" aria-hidden="true" />
                <span>{aiStateLabel}</span>
                {isRecording && <span className="status-dots" aria-hidden="true"><span /><span /><span /></span>}
              </div>
              <span className="ai-name-pill">✦ AI Interviewer</span>
            </div>
          </div>
        </div>

        {/* Question section */}
        <div className="question-section modern-question">
          <span className="question-label">LIVE</span>
          <p>Question {totalQuestions} of {TOTAL_QUESTIONS}</p>
          <h2>{currentQuestion}</h2>
          {isSpeaking && <div className="speaking-highlight">🔊 AI is speaking...</div>}
        </div>

        {/* Recording and evaluation (keep existing functionality/UI) */}
        <div className="interview-control-panel">
          <div className="voice-section">
            {!isRecording ? (
              <button className="record-button" onClick={startRecording} disabled={!canStartRecording}>🎤 {recordButtonLabel}</button>
            ) : (
              <button className="record-button recording" onClick={stopRecording} disabled={!canStopRecording}>⏹ {recordButtonLabel}</button>
            )}

            <p>{processingStatus}</p>

            {audioURL && (
              <div className="audio-result">
                <p>✅ Answer recorded successfully!</p>
                <audio controls src={audioURL} />
              </div>
            )}

            {transcript && (
              <div className="transcript-section">
                <h3>Your Answer</h3>
                <p>{transcript}</p>
              </div>
            )}

            {evaluation && (
              <div className="evaluation-section">
                <h3>🤖 AI Evaluation</h3>

                <div className="evaluation-score">
                  <strong>Score</strong>
                  <span>{evaluation.score || "N/A"}/10</span>
                </div>

                <div className="evaluation-content">
                  <div className="evaluation-box">
                    <h4>Accuracy</h4>
                    <p>{evaluation.correctness || "No correctness assessment available."}</p>
                  </div>

                  <div className="evaluation-box">
                    <h4>💬 Feedback</h4>
                    <p>{evaluation.feedback || "No feedback available."}</p>
                  </div>

                  <div className="evaluation-box">
                    <h4>✅ Strengths</h4>
                    {evaluation.strengths?.length ? <ul>{evaluation.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No strengths provided.</p>}
                  </div>

                  <div className="evaluation-box">
                    <h4>⚠️ Areas to Improve</h4>
                    {evaluation.areas_to_improve?.length ? <ul>{evaluation.areas_to_improve.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No improvement areas provided.</p>}
                  </div>

                  <div className="evaluation-box">
                    <h4>💡 Ideal Answer</h4>
                    <p>{evaluation.ideal_answer || "No ideal answer available."}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="interview-actions action-bar">
          <button className="next-button" disabled>
            {isPreparingNext ? (prefetchedQuestion ? "Starting next question..." : "Preparing next question...") : totalQuestions === TOTAL_QUESTIONS ? "Finishing interview..." : "Next question will start automatically"}
          </button>
        </div>

      </div>

    </div>
  );
}

export default InterviewRoom;