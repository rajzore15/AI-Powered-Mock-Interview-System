from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
import os
import time
import uuid
import whisper
from docx import Document
from pypdf import PdfReader

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
MAX_RESUME_SIZE = 10 * 1024 * 1024
resume_contexts = {}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def extract_resume_text(resume, extension):
    content = resume.read()
    if not content:
        raise ValueError("The selected resume is empty")

    if extension == ".pdf":
        reader = PdfReader(BytesIO(content))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        document = Document(BytesIO(content))
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)

    cleaned = " ".join(text.split())
    if not cleaned:
        raise ValueError("No readable text was found in the resume")
    return cleaned[:12000]


def get_resume_context(resume_id):
    if not resume_id:
        return None
    context = resume_contexts.get(resume_id)
    if context and context["expires_at"] > time.time():
        return context["text"]
    resume_contexts.pop(resume_id, None)
    return None


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


@app.route("/api/upload-resume", methods=["POST"])
def upload_resume():
    resume = request.files.get("resume")
    if not resume or not resume.filename:
        return jsonify({"error": "Please choose a resume file"}), 400

    extension = os.path.splitext(resume.filename)[1].lower()
    if extension not in {".pdf", ".docx"}:
        return jsonify({"error": "Only PDF and DOCX resumes are supported"}), 400

    resume.seek(0, os.SEEK_END)
    size = resume.tell()
    resume.seek(0)
    if size == 0:
        return jsonify({"error": "The selected resume is empty"}), 400
    if size > MAX_RESUME_SIZE:
        return jsonify({"error": "Resume must be 10 MB or smaller"}), 400

    try:
        text = extract_resume_text(resume, extension)
        resume_id = uuid.uuid4().hex
        resume_contexts[resume_id] = {
            "text": text,
            "expires_at": time.time() + 60 * 60,
        }
        return jsonify({"resume_id": resume_id})
    except Exception as error:
        print("Resume extraction error:", str(error))
        return jsonify({
            "error": "Unable to read this resume",
            "details": "The file may be corrupt or contain no readable text."
        }), 400


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
    resume_id = data.get("resume_id")

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
            difficulty,
            resume_context=get_resume_context(resume_id)
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