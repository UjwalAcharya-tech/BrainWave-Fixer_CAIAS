from typing import Dict, List, Union


def build_lecture_response(
    topic: str,
    introduction: str,
    explanation: str,
    deep_dive: str,
    example: str,
    summary: str,
    tips: str,
    mistakes: str,
    quiz: Union[List[Dict], Dict],
    score_update: Dict,
    level: str,
    suggestions: str,
    source: str,
) -> Dict:
    return {
        "topic": topic,
        "introduction": introduction,
        "lecture_explanation": explanation,
        "deep_dive": deep_dive,
        "example": example,
        "summary": summary,
        "quiz": quiz,
        "score_update": score_update,
        "level": level,
        "suggestions": suggestions,
        "tips": tips,
        "mistakes": mistakes,
        "source": source,
    }
