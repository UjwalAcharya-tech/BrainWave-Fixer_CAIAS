import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

from flask import Flask, jsonify, render_template, request

from doc_engine import DocEngine
from lecture_generator import build_lecture_response
from math_engine import is_math_question, solve_math
from nlp_engine import detect_question_type, preprocess
from progress_tracker import ProgressTracker
from quiz_generator import generate_quiz
from wiki_engine import wiki_summary

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Initialize OpenAI client with validation
if OPENAI_API_KEY and OPENAI_API_KEY.strip():
    openai_client = OpenAI(api_key=OPENAI_API_KEY.strip())
else:
    print("⚠️  WARNING: No valid OpenAI API key found in .env file")
    openai_client = None

BASE_DIR = Path(__file__).parent

app = Flask(__name__, static_folder="static", template_folder="templates")

doc_engine = DocEngine(upload_dir=BASE_DIR / "uploads")
tracker = ProgressTracker(BASE_DIR / "user_data.json")


def level_from_score(score: float) -> str:
    if score > 90:
        return "Advanced"
    if score > 70:
        return "Intermediate"
    return "Beginner"


def craft_lecture(question: str, base_text: str, source: str, example: str = ""):
    topic = question
    intro = f"Let’s explore {topic} from the ground up."
    explanation = (
        "Step-by-step teaching explanation:\n"
        "- Start from basics: " + base_text + "\n"
        "- Build the concept gradually, highlighting why it matters.\n"
        "- Show how the pieces fit together."
    )
    deep = "For deeper insight, connect this to related principles and edge cases."
    summary = "Remember the core idea and when to apply it."
    tips = "Teach it aloud, practice two examples, and quiz yourself."
    mistakes = "Common mistakes: skipping fundamentals, memorizing without context, ignoring assumptions."
    return intro, explanation, deep, example or base_text, summary, tips, mistakes

def get_openai_response(question: str) -> dict:
    """Get detailed educational response from OpenAI GPT-4 or fallback to local engines"""
    
    # Try OpenAI first if available
    if openai_client:
        system_prompt = """You are an advanced AI tutor for a professional AI learning platform called BrainWave.

Your role is to act as:
- A highly knowledgeable expert
- A clear and structured teacher
- A smart problem-solving assistant

Response Guidelines:
1. Answer accurately and professionally
2. For simple questions → give short and clear answers
3. For complex questions → give detailed explanations step-by-step
4. Use examples wherever possible
5. Break down difficult concepts into simple language
6. Use clear formatting with headings and bullet points

Provide responses in JSON format with these fields:
{
    "introduction": "Brief intro to the topic",
    "lecture_explanation": "Detailed step-by-step explanation with bullet points",
    "deep_dive": "Technical deeper understanding",
    "example": "Practical examples with code or illustrations",
    "summary": "Key points to remember",
    "tips": "Pro tips for better learning",
    "mistakes": "Common mistakes to avoid"
}"""

        try:
            response = openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            
            # Try to parse as JSON, otherwise create structured response
            import json
            try:
                data = json.loads(content)
            except json.JSONDecodeError:
                # If response isn't JSON, structure it
                data = {
                    "introduction": content.split('\n')[0] if content else question,
                    "lecture_explanation": content,
                    "deep_dive": "See the detailed explanation above for technical insights.",
                    "example": "Refer to the examples in the explanation.",
                    "summary": "Review the key points from the explanation.",
                    "tips": "Practice and review the concepts regularly.",
                    "mistakes": "Avoid memorizing without understanding."
                }
            
            return data
        except Exception as e:
            print(f"OpenAI API Error: {str(e)}")
            # Fall through to fallback
    
    # Fallback: Use local engines for math and general knowledge
    print(f"Using fallback engines for: {question}")
    
    # Check if it's a math question
    if is_math_question(question):
        math_res = solve_math(question)
        base_text = math_res.get("steps", math_res.get("solution", "Unable to solve"))
        example = math_res.get("example", "")
        source = "Math Engine (Local)"
    else:
        # Try to get from uploaded documents or Wikipedia
        base_text = ""
        example = ""
        source = "General Knowledge (Local)"
        
        if doc_engine.available():
            base_text, score = doc_engine.query(question)
            source = f"Uploaded Files (Similarity: {score:.2f})"
        else:
            base_text = wiki_summary(question) or "Unable to find specific information."
            source = "Wikipedia (Local)"
    
    # Use craft_lecture to structure the response
    intro, explanation, deep, example, summary, tips, mistakes = craft_lecture(question, base_text, source, example)
    
    return {
        "introduction": intro,
        "lecture_explanation": explanation,
        "deep_dive": deep,
        "example": example,
        "summary": summary,
        "tips": tips,
        "mistakes": mistakes
    }

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    try:
        info = doc_engine.ingest(file)
        return jsonify({"status": "ok", **info})
    except Exception as exc:
        return jsonify({"error": f"Failed to process file: {exc}"}), 500


@app.route("/ask", methods=["POST"])
def ask():
    payload = request.get_json(silent=True) or {}
    question = (payload.get("question") or "").strip()
    if len(question) < 3:
        return jsonify({"error": "Please ask a fuller question."}), 400

    # Get response from OpenAI GPT-4
    openai_data = get_openai_response(question)
    
    # Get user progress state for difficulty level
    score_state = tracker.get()
    difficulty = "easy" if score_state["level"] == "Beginner" else "medium" if score_state["level"] == "Intermediate" else "hard"
    
    # Generate quiz based on the response
    quiz = generate_quiz(openai_data.get("lecture_explanation", ""), difficulty=difficulty, num_q=8)

    # Build response
    resp = build_lecture_response(
        topic=question,
        introduction=openai_data.get("introduction", ""),
        explanation=openai_data.get("lecture_explanation", ""),
        deep_dive=openai_data.get("deep_dive", ""),
        example=openai_data.get("example", ""),
        summary=openai_data.get("summary", ""),
        quiz={"topic": question, "questions": quiz},
        score_update=score_state,
        level=score_state["level"],
        suggestions=score_state["suggestions"],
        tips=openai_data.get("tips", ""),
        mistakes=openai_data.get("mistakes", ""),
        source="OpenAI GPT-4",
    )
    return jsonify(resp)


@app.route("/quiz_submit", methods=["POST"])
def quiz_submit():
    payload = request.get_json(silent=True) or {}
    topic = payload.get("topic", "quiz")
    correct = bool(payload.get("correct", False))
    updated = tracker.update(topic=topic, correct=correct)
    return jsonify(updated)


@app.route("/health")
def health():
    return jsonify({"status": "ok", **tracker.get()})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    ssl_cert = os.environ.get("SSL_CERT")
    ssl_key = os.environ.get("SSL_KEY")
    ssl_ctx = (ssl_cert, ssl_key) if ssl_cert and ssl_key else None
    app.run(host="0.0.0.0", port=port, debug=True, ssl_context=ssl_ctx)
from math_engine import calculate

@app.route("/calculate", methods=["POST"])
def calc():
    expression = request.form.get("expression")
    result = calculate(expression)
    return str(result)
