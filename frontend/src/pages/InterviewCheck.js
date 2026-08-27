import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const getDeviceError = (device) => {
  if (device === "camera") {
    return "Camera access was unavailable. Check your browser permission and try again.";
  }
  return "Microphone access was unavailable. Check your browser permission and try again.";
};

function InterviewCheck() {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const microphoneTimeoutRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState("Not tested");
  const [microphoneError, setMicrophoneError] = useState("");
  const [isTestingMicrophone, setIsTestingMicrophone] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [speakerAnswer, setSpeakerAnswer] = useState("");
  const [isPlayingSpeakerTest, setIsPlayingSpeakerTest] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const checkCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stopStream();
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (error) {
      console.error("Camera check error:", error);
      setCameraReady(false);
      setCameraError(getDeviceError("camera"));
    }
  }, []);

  const testMicrophone = async () => {
    if (isTestingMicrophone) return;
    setIsTestingMicrophone(true);
    setMicrophoneReady(false);
    setMicrophoneError("");
    setMicrophoneStatus("Listening for input...");

    let stream;
    let audioContext;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const samples = new Uint8Array(analyser.fftSize);
      source.connect(analyser);
      const startedAt = Date.now();
      let detected = false;

      const detectInput = () => {
        analyser.getByteTimeDomainData(samples);
        const peak = samples.reduce((highest, sample) => Math.max(highest, Math.abs(sample - 128)), 0);
        if (peak > 3) detected = true;
        if (Date.now() - startedAt < 2500) {
          microphoneTimeoutRef.current = window.setTimeout(detectInput, 100);
          return;
        }
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        audioContextRef.current = null;
        setMicrophoneReady(detected);
        setMicrophoneStatus(detected ? "Microphone detected" : "Microphone is not working");
        setIsTestingMicrophone(false);
        if (!detected) setMicrophoneError("Allow microphone access and speak near your microphone while testing.");
      };

      audioContextRef.current = audioContext;
      detectInput();
    } catch (error) {
      console.error("Microphone check error:", error);
      stream?.getTracks().forEach((track) => track.stop());
      audioContext?.close();
      audioContextRef.current = null;
      setMicrophoneReady(false);
      setMicrophoneStatus("Microphone is not working");
      setMicrophoneError(getDeviceError("microphone"));
      setIsTestingMicrophone(false);
    }
  };

  const testSpeaker = () => {
    if (isPlayingSpeakerTest) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    setIsPlayingSpeakerTest(true);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    oscillator.onended = () => {
      audioContext.close();
      setIsPlayingSpeakerTest(false);
    };
  };

  useEffect(() => {
    checkCamera();
    return () => {
      if (microphoneTimeoutRef.current) window.clearTimeout(microphoneTimeoutRef.current);
      audioContextRef.current?.close();
      stopStream();
    };
  }, [checkCamera]);

  const startInterview = () => {
    navigate("/interview-room", { state: location.state });
  };

  const statusIcon = (ready) => <span className={`check-list-icon${ready ? " ready" : ""}`}>{ready ? "✓" : "○"}</span>;

  return (
    <main className="interview-check-page">
      <div className="interview-check-container">
        <header className="check-heading">
          <span className="check-eyebrow">INTERVIEW READINESS</span>
          <h1>Check your interview setup</h1>
          <p>Make sure your camera, microphone, and speakers are ready before the first question begins.</p>
        </header>

        <div className="check-layout">
          <section className="device-check-card">
            <h2>Camera check</h2>
            <p>Your camera preview stays on this page and is not recorded.</p>
            {cameraReady ? <video ref={videoRef} autoPlay muted playsInline className="camera-check-preview" /> : <div className="camera-check-placeholder">Camera preview unavailable</div>}
            <div className={`check-status ${cameraError ? "error" : ""}`}><span className="check-status-icon">{cameraReady ? "✓" : "○"}</span>{cameraReady ? "Camera is working" : cameraError ? "Camera is not ready" : "Checking camera..."}</div>
            {cameraError && <p className="check-error">{cameraError}</p>}
            <div className="check-card-actions"><button className="check-action-button" type="button" onClick={checkCamera}>{cameraReady ? "Retry Camera" : "Retry Camera"}</button></div>
          </section>

          <div>
            <section className="device-check-card">
              <h2>Microphone check</h2>
              <p>Speak naturally for a couple of seconds so we can detect input.</p>
              <div className={`check-status ${microphoneReady ? "" : microphoneError ? "error" : "pending"}`}><span className="check-status-icon">{microphoneReady ? "✓" : "○"}</span>{microphoneStatus}</div>
              {microphoneError && <p className="check-error">{microphoneError}</p>}
              <div className="check-card-actions"><button className="check-action-button" type="button" onClick={testMicrophone} disabled={isTestingMicrophone}>{isTestingMicrophone ? "Listening..." : "Test Microphone"}</button></div>
            </section>

            <section className="device-check-card" style={{ marginTop: 22 }}>
              <h2>Speaker check</h2>
              <p>Play a short tone, then confirm that you heard it.</p>
              <div className="check-card-actions"><button className="check-action-button check-secondary-button" type="button" onClick={testSpeaker} disabled={isPlayingSpeakerTest}>{isPlayingSpeakerTest ? "Playing..." : "Test Speaker"}</button></div>
              <p className="speaker-question">Did you hear the sound?</p>
              <div className="speaker-choices"><button className={`speaker-choice${speakerAnswer === "yes" ? " selected" : ""}`} type="button" onClick={() => { setSpeakerAnswer("yes"); setSpeakerTested(true); }}>Yes</button><button className={`speaker-choice${speakerAnswer === "no" ? " selected" : ""}`} type="button" onClick={() => { setSpeakerAnswer("no"); setSpeakerTested(false); }}>No</button></div>
            </section>

            <section className="device-check-card" style={{ marginTop: 22 }}>
              <h2>System status</h2>
              <ul className="check-list"><li>{statusIcon(cameraReady)}Camera {cameraReady ? "Ready" : "Not Ready"}</li><li>{statusIcon(microphoneReady)}Microphone {microphoneReady ? "Ready" : "Not Ready"}</li><li>{statusIcon(speakerTested)}Speaker {speakerTested ? "Ready" : "Not Tested"}</li></ul>
              <button className="check-start-button" type="button" onClick={startInterview} disabled={!cameraReady || !microphoneReady || !speakerTested}>Start Interview</button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default InterviewCheck;
