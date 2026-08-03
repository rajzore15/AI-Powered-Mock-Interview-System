import os
import time

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

def evaluate_answer(question, answer):

    prompt = f"""
You are an experienced technical interviewer.

Evaluate the candidate's answer to the interview question below.

Interview Question:
{question}

Candidate's Answer:
{answer}

Evaluate based on:
1. Correctness
2. Relevance
3. Technical understanding
4. Clarity

Return ONLY valid JSON in exactly this format:

{{
    "score": 7,
    "feedback": "Short overall feedback",
    "strengths": "What the candidate did well",
    "weaknesses": "What could be improved",
    "improvement": "Specific suggestion to improve the answer"
}}

Rules:
- Score must be a number from 0 to 10.
- Keep each response concise.
- Do not provide the correct answer.
- Do not add markdown.
- Do not add ```json.
"""

    try:

        print("Evaluating candidate answer...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        evaluation_text = response.text.strip()

        print("Raw evaluation:")
        print(evaluation_text)

        # Remove markdown if Gemini adds it
        evaluation_text = evaluation_text.replace(
            "```json", ""
        ).replace(
            "```", ""
        ).strip()

        import json

        evaluation = json.loads(evaluation_text)

        print("Evaluation parsed successfully:")
        print(evaluation)

        return evaluation

    except Exception as e:

        print("Gemini evaluation error:", str(e))

        return {
            "score": "N/A",
            "feedback": "Unable to evaluate the answer right now.",
            "strengths": "Evaluation service was unavailable.",
            "weaknesses": "Evaluation could not be completed.",
            "improvement": "Please try submitting the answer again."
        }