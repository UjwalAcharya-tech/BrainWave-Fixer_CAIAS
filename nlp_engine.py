import re
from typing import List

import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import wordpunct_tokenize


def _ensure():
    try:
        stopwords.words("english")
    except LookupError:
        nltk.download("stopwords", quiet=True)
    try:
        nltk.data.find("corpora/wordnet")
    except LookupError:
        nltk.download("wordnet", quiet=True)
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)


_ensure()
STOP = set(stopwords.words("english"))
LEM = WordNetLemmatizer()


def preprocess(text: str) -> List[str]:
    toks = wordpunct_tokenize(text.lower())
    out = []
    for t in toks:
        if not re.match(r"[a-z0-9]+$", t):
            continue
        if t in STOP:
            continue
        out.append(LEM.lemmatize(t))
    return out


def detect_question_type(text: str) -> str:
    t = text.lower().strip()
    if any(k in t for k in ["solve", "integrate", "differentiate", "equation", "simplify"]):
        return "math"
    if any(k in t for k in ["code", "program", "debug", "python", "java", "loop", "algorithm"]):
        return "coding"
    if any(k in t for k in ["why", "how"]):
        return "how"
    if t.startswith("what"):
        return "what"
    return "explain"
