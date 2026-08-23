import os
import time
import json
import re

from google import genai
from dotenv import load_dotenv


# ==========================================
# Load Environment Variables
# ==========================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY)


# ==========================================
# Fallback Questions
# ==========================================

FALLBACK_QUESTIONS = {

    "Python": [
        "What is the difference between a list and a tuple in Python?",
        "What are Python decorators and where would you use them?",
        "Explain the concept of generators in Python.",
        "What is the difference between shallow copy and deep copy in Python?",
        "Explain exception handling in Python with an example.",
        "What is the difference between == and is in Python?",
        "What are dictionaries in Python and how are they different from lists?",
        "Explain object-oriented programming concepts in Python."
    ],

    "Java": [
        "What is the difference between JDK, JRE, and JVM?",
        "Explain the four main principles of object-oriented programming.",
        "What is the difference between an interface and an abstract class in Java?",
        "Explain exception handling in Java.",
        "What is method overloading and method overriding?"
    ],

    "JavaScript": [
        "What is the difference between var, let, and const in JavaScript?",
        "Explain the concept of closures in JavaScript.",
        "What is the difference between == and === in JavaScript?",
        "Explain promises and async/await in JavaScript.",
        "What is the JavaScript event loop?"
    ],

    "React": [
        "What are React components?",
        "What is the difference between state and props in React?",
        "What are React hooks?",
        "Explain the useEffect hook in React.",
        "What is the virtual DOM in React?"
    ],

    "SQL": [
        "What is the difference between INNER JOIN and LEFT JOIN?",
        "What is a primary key in SQL?",
        "What is the difference between WHERE and HAVING?",
        "Explain the concept of database normalization.",
        "What is the difference between DELETE, DROP, and TRUNCATE?"
    ]
}


# ==========================================
# Get Fallback Question
# ==========================================

def get_fallback_question(skill):

    questions = FALLBACK_QUESTIONS.get(
        skill,
        [
            "Explain the main concepts of your primary technical skill.",
            "What are some common challenges you have faced while working with your technical skills?",
            "Explain one important concept related to your technical skill."
        ]
    )

    index = int(time.time()) % len(questions)

    return questions[index]


# ==========================================
# Generate Interview Question
# ==========================================

def generate_interview_question(
    role,
    experience,
    skill,
    difficulty
):

    prompt = f"""
You are an AI technical interviewer.

Generate ONE interview question for the following candidate:

Job Role: {role}
Experience Level: {experience}
Primary Skill: {skill}
Difficulty: {difficulty}

Requirements:
- Ask only one question.
- Make it relevant to the candidate's role and skill.
- Do not provide the answer.
- Keep the question clear and suitable for an interview.
"""

    try:

        print("Generating interview question...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        question = response.text.strip()

        print("Generated question:", question)

        return question

    except Exception as e:

        error_message = str(e)

        print("Gemini error:", error_message)

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
            or "quota" in error_message.lower()
        ):

            print(
                "Gemini quota exceeded. "
                "Using fallback interview question."
            )

        else:

            print(
                "Gemini API unavailable. "
                "Using fallback interview question."
            )

        question = get_fallback_question(skill)

        print("Fallback question:", question)

        return question


# ==========================================
# AI Answer Evaluation - DAY 4
# ==========================================

def evaluate_answer(question, answer, role="", experience="", skill=""):

    prompt = f"""
You are an experienced technical interviewer.

Evaluate the candidate's answer to the interview question below.

Candidate context:
Role: {role or "Not provided"}
Experience: {experience or "Not provided"}
Primary Skill: {skill or "Not provided"}

Interview Question:
{question}

Candidate's Answer:
{answer}

Evaluate based on:
1. Conceptual correctness and semantic meaning
2. Technical understanding and relevance
3. Whether the candidate's intended answer is correct
4. Relevant examples or explanations
5. Clarity, while allowing natural spoken delivery

Evaluate the candidate's intended semantic meaning rather than requiring an exact textual match. The transcript is generated by speech recognition and may contain minor transcription errors, incorrectly recognized technical terms, pauses, filler words, repetitions, or pronunciation-related mistakes. Do not heavily penalize the candidate for these errors when the intended technical concept is clear.
Tolerate small grammatical mistakes, incomplete sentences caused by natural speaking, and repeated words. Do not invent knowledge that the candidate did not demonstrate. If the answer is genuinely incorrect, score it appropriately.

Return ONLY valid JSON in exactly this format:

{{
    "score": 0,
    "correctness": "",
    "strengths": [],
    "areas_to_improve": [],
    "feedback": "",
    "ideal_answer": ""
}}

Rules:
- Score must be an integer from 0 to 10.
- Correctness must be a short assessment.
- Strengths and areas_to_improve must be arrays of short points.
- Keep each response concise and evaluate the actual candidate answer.
- Do not score mainly by matching exact words from the transcript.
- Do not give a high score automatically.
- Do not add markdown.
- Do not add ```json.
"""

    fallback = {
        "score": 0,
        "correctness": "Evaluation unavailable.",
        "strengths": [],
        "areas_to_improve": ["The answer could not be evaluated."],
        "feedback": "Evaluation is temporarily unavailable. Please try again.",
        "ideal_answer": "Provide a direct answer that explains the key concept and includes a relevant example."
    }

    def normalize_evaluation(value):
        if not isinstance(value, dict):
            return fallback

        score = value.get("score", 0)
        if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 10:
            score = 0

        def text_field(name):
            field = value.get(name, "")
            return field.strip() if isinstance(field, str) else ""

        def list_field(name):
            field = value.get(name, [])
            if not isinstance(field, list):
                return []
            return [item.strip() for item in field if isinstance(item, str) and item.strip()]

        return {
            "score": score,
            "correctness": text_field("correctness"),
            "strengths": list_field("strengths"),
            "areas_to_improve": list_field("areas_to_improve"),
            "feedback": text_field("feedback"),
            "ideal_answer": text_field("ideal_answer")
        }

    try:

        print("Evaluating candidate answer...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        evaluation_text = response.text.strip()

        print("Raw evaluation:")
        print(evaluation_text)

        # Accept a fenced response or extra surrounding text without trusting it blindly.
        fenced_match = re.search(r"```(?:json)?\s*(.*?)\s*```", evaluation_text, re.IGNORECASE | re.DOTALL)
        if fenced_match:
            evaluation_text = fenced_match.group(1).strip()
        else:
            object_match = re.search(r"\{.*\}", evaluation_text, re.DOTALL)
            if object_match:
                evaluation_text = object_match.group(0)

        evaluation = normalize_evaluation(json.loads(evaluation_text))

        print("Evaluation parsed successfully:")
        print(evaluation)

        return evaluation

    except Exception as e:

        print("Gemini evaluation error:", str(e))

        return fallback