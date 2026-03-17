import wikipedia


def wiki_summary(topic: str, sentences: int = 4) -> str:
    try:
        return wikipedia.summary(topic, sentences=sentences, auto_suggest=True, redirect=True)
    except Exception:
        try:
            hits = wikipedia.search(topic, results=1)
            if hits:
                return wikipedia.summary(hits[0], sentences=sentences)
        except Exception:
            return ""
    return ""
