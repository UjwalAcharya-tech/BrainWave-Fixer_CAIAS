import re
import sympy as sp


def is_math_question(q: str) -> bool:
    tokens = q.lower()
    has_keyword = any(
        k in tokens
        for k in [
            "solve",
            "integrate",
            "differentiate",
            "derivative",
            "limit",
            "equation",
            "simplify",
            "factor",
            "expand",
            "∫",
            "dx",
            "calculate",
            "compute",
            "evaluate",
        ]
    )
    has_arithmetic = bool(re.search(r"\d[\d\s\+\-\*/\^×·xX\(\)\.]*\d", tokens))
    return has_keyword or has_arithmetic


def solve_math(question: str):
    try:
        text = question.lower()
        # Pull out the last arithmetic-looking chunk; fallback to the whole question.
        match = re.findall(r"[-+*/^×·xX()\d\s\.]+", text)
        expr_text = match[-1] if match else text

        # Normalize multiplication symbols and trim filler words.
        expr_text = re.sub(r"(?<=\d)\s*[xX×·]\s*(?=\d)", "*", expr_text)
        expr_text = re.sub(r"\b(whats|what is|calculate|compute|evaluate|solve)\b", "", expr_text).strip()

        expr = sp.sympify(expr_text)
        steps = []
        result = None
        if "integrate" in text or "∫" in text:
            result = sp.integrate(expr)
            steps.append(f"Integrate the expression: ∫ {expr} dx = {result}")
        elif "differentiate" in text or "derivative" in text:
            result = sp.diff(expr)
            steps.append(f"Take derivative d/dx: {expr} → {result}")
        elif "limit" in text:
            x = list(expr.free_symbols)[0] if expr.free_symbols else sp.symbols("x")
            result = sp.limit(expr, x, 0)
            steps.append(f"Compute limit as {x}->0: {result}")
        elif "factor" in text:
            result = sp.factor(expr)
            steps.append(f"Factor the expression: {expr} → {result}")
        elif "expand" in text:
            result = sp.expand(expr)
            steps.append(f"Expand the expression: {expr} → {result}")
        else:
            result = sp.simplify(expr)
            steps.append(f"Simplify: {expr} → {result}")

        example = f"Check at x=1: {expr.subs({'x':1}) if expr.free_symbols else result}"
        return {
            "topic": "Math problem",
            "solution": str(result),
            "steps": "; ".join(steps),
            "example": example,
        }
    except Exception as exc:
        return {
            "topic": "Math problem",
            "solution": "Couldn't parse the math expression.",
            "steps": "Rephrase the problem with clear symbols, e.g., simplify (x^2 + 2*x + 1).",
            "example": "",
            "error": str(exc),
        }
# math_engine.py

def calculate(expression):
    try:
        # Remove unwanted spaces
        expression = expression.replace(" ", "")

        # Evaluate the math expression safely
        result = eval(expression)

        return result

    except Exception as e:
        return "Error"


# Optional: advanced operations
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        return "Cannot divide by zero"
    return a / b
# math_engine.py

import math

def calculate(expression):
    try:
        # Replace custom keywords with math functions
        expression = expression.replace("log(", "math.log10(")   # base 10 log
        expression = expression.replace("ln(", "math.log(")      # natural log
        expression = expression.replace("sqrt(", "math.sqrt(")

        # Evaluate safely (for hackathon demo)
        result = eval(expression)

        return result

    except Exception:
        return "Error"


# Individual functions (optional use)

def log10(x):
    if x <= 0:
        return "Invalid input"
    return math.log10(x)

def ln(x):
    if x <= 0:
        return "Invalid input"
    return math.log(x)

def log_base(x, base):
    if x <= 0 or base <= 0:
        return "Invalid input"
    return math.log(x, base)
# math_engine.py

import math

def calculate(expression):
    try:
        expression = expression.replace(" ", "")

        # Logarithms
        expression = expression.replace("log(", "math.log10(")   # base 10
        expression = expression.replace("ln(", "math.log(")      # natural log

        # Square root
        expression = expression.replace("sqrt(", "math.sqrt(")

        # Trigonometric functions (in degrees)
        expression = expression.replace("sin(", "math.sin(math.radians(")
        expression = expression.replace("cos(", "math.cos(math.radians(")
        expression = expression.replace("tan(", "math.tan(math.radians(")

        # Inverse trigonometric functions (output in degrees)
        expression = expression.replace("asin(", "math.degrees(math.asin(")
        expression = expression.replace("acos(", "math.degrees(math.acos(")
        expression = expression.replace("atan(", "math.degrees(math.atan(")

        # Close brackets properly for trig conversions
        expression = expression.replace(")", "))")

        result = eval(expression)

        return result

    except Exception as e:
        return "Error"