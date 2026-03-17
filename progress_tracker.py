import json
from pathlib import Path


class ProgressTracker:
    def __init__(self, path: Path):
        self.path = path
        if not self.path.exists():
            self._write({"total": 0, "correct": 0, "topics": [], "weak": []})

    def _read(self):
        with self.path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def _write(self, data):
        with self.path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def update(self, topic: str, correct: bool):
        data = self._read()
        data["total"] += 1
        if correct:
            data["correct"] += 1
        if topic and topic not in data["topics"]:
            data["topics"].append(topic)
        self._write(data)
        return self.get()

    def get(self):
        data = self._read()
        total = max(data.get("total", 0), 1)
        score = round(100 * data.get("correct", 0) / total, 1)
        level = "Beginner"
        if score > 75 and total >= 5:
            level = "Intermediate"
        if score > 90 and total >= 10:
            level = "Advanced"
        suggestions = "Focus on weak areas and retake quizzes."
        return {
            "total": data.get("total", 0),
            "correct": data.get("correct", 0),
            "score": score,
            "level": level,
            "topics": data.get("topics", []),
            "suggestions": suggestions,
        }
