import random
from typing import List, Dict


def generate_quiz(text: str, difficulty: str = "easy", num_q: int = 6) -> List[Dict]:
    """Create multiple-choice questions with randomized options and clear explanations."""
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 20]
    if not sentences:
        return []

    selected = random.sample(sentences, k=min(num_q, len(sentences)))
    questions: List[Dict] = []

    for i, base in enumerate(selected):
        correct = base
        distract_pool = [s for s in sentences if s != correct]

        # Build distractors
        distractors = random.sample(distract_pool, k=min(3, len(distract_pool))) if len(distract_pool) >= 3 else []
        while len(distractors) < 3:
            distractors.append(f"{correct[:30]} ... (incorrect)")

        options = distractors + [correct]
        random.shuffle(options)
        correct_index = options.index(correct)

        questions.append(
            {
                "id": f"q{i}",
                "question": f"What is correct about: {base[:80]}...",
                "options": options,
                "correct_index": correct_index,
                "explanation": f"Correct because: {correct}",
                "difficulty": difficulty,
            }
        )

    return questions
