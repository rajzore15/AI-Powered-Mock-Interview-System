from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import whisper

from services.gemini_service import (
    generate_interview_question,
    evaluate_answer
)

app = Flask(__name__)
CORS(app)


# ==========================================
# Upload Folder
# ==========================================

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==========================================
# Load Whisper Model
# ==========================================

print("Loading Whisper model...")

model = whisper.load_model("base")

print("Whisper model loaded successfully!")


# ==========================================
# Home Route
# ==========================================

@app.route("/")
def home():

    return jsonify({
        "message": "AI Mock Interview Backend Running"
    })


# ==========================================
# Upload Audio
# ==========================================

@app.route("/api/upload-audio", methods=["POST"])
def upload_audio():

    if "audio" not in request.files:

        return jsonify({
            "error": "No audio file received"
        }), 400

    audio = request.files["audio"]

    if audio.filename == "":

        return jsonify({
            "error": "No audio file selected"
        }), 400

    filename = f"{uuid.uuid4()}.webm"

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    audio.save(filepath)

    return jsonify({
        "message": "Audio uploaded successfully",
        "filename": filename
    })


# ==========================================
# Speech To Text - Whisper
# ==========================================

@app.route("/api/transcribe", methods=["POST"])
def transcribe_audio():

    if "audio" not in request.files:

        return jsonify({
            "error": "No audio file received"
        }), 400

    audio = request.files["audio"]

    if audio.filename == "":

        return jsonify({
            "error": "No audio file selected"
        }), 400

    filename = f"{uuid.uuid4()}.webm"

    filepath = os.path.join(
        UPLOAD_FOLDER,
        filename
    )

    audio.save(filepath)

    try:

        print("Transcribing audio...")

        result = model.transcribe(
            filepath,
            language="en",
            task="transcribe",
            temperature=0,
            condition_on_previous_text=True,
            initial_prompt=(
                "Technical interview vocabulary: Python, Java, JavaScript, React, SQL, "
                "API, Flask, FastAPI, database, backend, frontend, function, class, object, "
                "algorithm, data structure, machine learning, artificial intelligence."
            ),
            fp16=False
        )

        transcript = result["text"].strip()

        print("Transcript:", transcript)

        return jsonify({
            "message": "Audio transcribed successfully",
            "transcript": transcript
        })

    except Exception as e:

        print("Transcription error:", str(e))

        return jsonify({
            "error": "Transcription failed",
            "details": str(e)
        }), 500

    finally:

        if os.path.exists(filepath):
            os.remove(filepath)


# ==========================================
# Gemini AI - Generate Interview Question
# ==========================================

@app.route("/api/generate-question", methods=["POST"])
def generate_question():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No data received"
        }), 400

    role = data.get("role")
    experience = data.get("experience")
    skill = data.get("skill")
    difficulty = data.get("difficulty")

    # Validate interview details

    if not all([
        role,
        experience,
        skill,
        difficulty
    ]):

        return jsonify({
            "error": "Missing interview details"
        }), 400

    try:

        print("Generating interview question...")

        question = generate_interview_question(
            role,
            experience,
            skill,
            difficulty
        )

        print("Generated question:", question)

        return jsonify({
            "question": question
        })

    except Exception as e:

        print("Gemini error:", str(e))

        return jsonify({
            "error": "Failed to generate interview question",
            "details": str(e)
        }), 500


# ==========================================
# Gemini AI - Evaluate Interview Answer
# ==========================================

@app.route("/api/evaluate-answer", methods=["POST"])
def evaluate_answer_api():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No data received"
        }), 400

    question = data.get("question")
    answer = data.get("answer")
    role = data.get("role", "")
    experience = data.get("experience", "")
    skill = data.get("skill", "")

    # Validate question

    if not question:

        return jsonify({
            "error": "Question is required"
        }), 400

    # Validate answer

    if not answer:

        return jsonify({
            "error": "Answer is required"
        }), 400

    try:

        print("Evaluating candidate answer...")

        evaluation = evaluate_answer(
            question,
            answer,
            role=role,
            experience=experience,
            skill=skill
        )

        print("Evaluation completed.")

        return jsonify({
            "evaluation": evaluation
        })

    except Exception as e:

        print("Answer evaluation error:", str(e))

        return jsonify({
            "error": "Failed to evaluate answer",
            "details": str(e)
        }), 500


# ==========================================
# Run Flask Server
# ==========================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )