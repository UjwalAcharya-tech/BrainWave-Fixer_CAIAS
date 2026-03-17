from typing import List, Tuple

from nlp_engine import preprocess
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class DocumentIndex:
    def __init__(self, chunks: List[str]):
        self.chunks = chunks
        self.vectorizer = TfidfVectorizer(tokenizer=preprocess, lowercase=True)
        self.matrix = self.vectorizer.fit_transform(chunks) if chunks else None

    def query(self, question: str, top_k: int = 1) -> Tuple[str, float]:
        if not self.matrix:
            return "No document indexed.", 0.0
        q_vec = self.vectorizer.transform([question])
        sims = cosine_similarity(q_vec, self.matrix)[0]
        best_idx = sims.argmax()
        return self.chunks[best_idx], float(sims[best_idx])
