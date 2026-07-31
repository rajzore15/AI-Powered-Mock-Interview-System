from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import whisper

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Load Whisper model
print("Loading Whisper model...")

model = whisper.load_model("base")

print("Whisper model loaded successfully!")


@app.route("/")
def home():
    return jsonify({
        "message": "AI Mock Interview Backend Running"
    })


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

        result = model.transcribe(filepath)

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

        # Remove temporary audio file
        if os.path.exists(filepath):
            os.remove(filepath)


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )