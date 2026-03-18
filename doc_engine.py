import docx
import PyPDF2
from pathlib import Path
from typing import List, Tuple, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from nlp_engine import preprocess


class DocEngine:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(exist_ok=True)
        self.chunks: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.matrix = None
        self.filename: Optional[str] = None

    def available(self) -> bool:
        return bool(self.chunks)

    def ingest(self, werk_file) -> dict:
        filename = werk_file.filename or "uploaded"
        path = self.upload_dir / filename
        werk_file.save(str(path))
        text = self._load(path)
        self.chunks = self._chunk(text)
        self.vectorizer = TfidfVectorizer(tokenizer=preprocess, lowercase=True)
        self.matrix = self.vectorizer.fit_transform(self.chunks)
        self.filename = filename
        return {"filename": filename, "chunks": len(self.chunks)}

    def query(self, question: str) -> Tuple[str, float]:
        if not self.vectorizer or self.matrix is None:
            return "No document indexed.", 0.0
        q_vec = self.vectorizer.transform([question])
        sims = cosine_similarity(q_vec, self.matrix)[0]
        idx = sims.argmax()
        return self.chunks[idx], float(sims[idx])

    def _load(self, path: Path) -> str:
        ext = path.suffix.lower()
        if ext == ".pdf":
            return self._pdf(path)
        if ext == ".docx":
            return self._docx(path)
        if ext == ".txt":
            return path.read_text(encoding="utf-8", errors="ignore")
        raise ValueError("Unsupported file type")

    def _pdf(self, path: Path) -> str:
        parts = []
        with path.open("rb") as f:
            reader = PyPDF2.PdfReader(f)
            for p in reader.pages:
                parts.append(p.extract_text() or "")
        return "\n".join(parts)

    def _docx(self, path: Path) -> str:
        d = docx.Document(str(path))
        return "\n".join([p.text for p in d.paragraphs])

    def _chunk(self, text: str, max_len: int = 900) -> List[str]:
        paras = [p.strip() for p in text.replace("\r", "\n").split("\n") if p.strip()]
        chunks, buf, length = [], [], 0
        for para in paras:
            if length + len(para) > max_len and buf:
                chunks.append(" ".join(buf))
                buf, length = [], 0
            buf.append(para)
            length += len(para)
        if buf:
            chunks.append(" ".join(buf))
        return chunks or ["No readable text found in the document."]
