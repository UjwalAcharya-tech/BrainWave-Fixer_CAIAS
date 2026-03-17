# BrainWave Fixer — AI Learning Platform

Teach · Test · Track · Adapt

## Features
- Lecture-style explanations (intro, steps, deep dive, example, summary, tips, mistakes)
- Auto-generated MCQ quizzes with difficulty hints
- Progress tracking: total, correct, score %, level, suggestions (stored in `user_data.json`)
- Adaptive: wrong answers → simpler tone next time; strong performance → tougher quiz items
- Math via SymPy, science/general via Wikipedia, doc-grounded QA from uploaded PDF/DOCX/TXT
- Voice input (SpeechRecognition) and output (Text-to-Speech)

## Project structure
```
ai-teacher/
├── app.py
├── user_data.json
├── nlp_engine.py
├── math_engine.py
├── quiz_generator.py
├── progress_tracker.py
├── doc_engine.py
├── lecture_generator.py
├── wiki_engine.py
├── static/
│   ├── style.css
│   └── script.js
└── templates/
    └── index.html
```

## Quick start
```bash
python -m venv .venv
.venv\Scripts\activate          # or source .venv/bin/activate
pip install -r requirements.txt
python app.py
# visit http://localhost:5000
```

Optional HTTPS:
```bash
set SSL_CERT=path\to\cert.pem
set SSL_KEY=path\to\key.pem
python app.py
# then open https://localhost:5000 (trust self-signed if needed)
```

## Notes
- Upload a PDF/DOCX/TXT to answer/quiz from that file; otherwise general math/wiki/coding routes are used.
- Progress is stored locally in `user_data.json`; delete it to reset.
