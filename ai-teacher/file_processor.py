import os
from pathlib import Path
from typing import List

import docx
import PyPDF2


def load_text(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    if ext == ".pdf":
        return _read_pdf(file_path)
    if ext == ".docx":
        return _read_docx(file_path)
    if ext == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")
    raise ValueError("Unsupported file type")


def _read_pdf(path: Path) -> str:
    text_parts: List[str] = []
    with path.open("rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts)


def _read_docx(path: Path) -> str:
    document = docx.Document(path)
    return "\n".join([p.text for p in document.paragraphs])


def normalize_and_chunk(raw_text: str, max_len: int = 800) -> List[str]:
    # basic cleanup
    cleaned = raw_text.replace("\r", "\n")
    paras = [p.strip() for p in cleaned.split("\n") if p.strip()]
    chunks: List[str] = []
    buf = []
    length = 0
    for para in paras:
        if length + len(para) > max_len and buf:
            chunks.append(" ".join(buf))
            buf = []
            length = 0
        buf.append(para)
        length += len(para)
    if buf:
        chunks.append(" ".join(buf))
    return chunks or ["No readable text found in the document."]
