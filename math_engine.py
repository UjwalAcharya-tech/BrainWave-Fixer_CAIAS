import math
import re
from typing import Dict, Union

import sympy as sp  # type: ignore

# Whitelisted math helpers for the lightweight calculator
SAFE_MATH_FUNCS = {
    "sin": lambda x: math.sin(math.radians(x)),
    "cos": lambda x: math.cos(math.radians(x)),
    "tan": lambda x: math.tan(math.radians(x)),
    "asin": lambda x: math.degrees(math.asin(x)),
    "acos": lambda x: math.degrees(math.acos(x)),
    "atan": lambda x: math.degrees(math.atan(x)),
    "sqrt": math.sqrt,
    "log": math.log10,  # base 10
    "ln": math.log,     # natural log
    "pi": math.pi,
    "e": math.e,
}


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
            "integral",
            "dx",
            "calculate",
            "compute",
            "evaluate",
        ]
    )
    has_arithmetic = bool(re.search(r"\d[\d\s\+\-\*/\^xX\(\)\.]*\d", tokens))
    return has_keyword or has_arithmetic


def solve_math(question: str) -> Dict[str, str]:
    try:
        text = question.lower()
        # Pull out the last arithmetic-looking chunk; fallback to the whole question.
        match = re.findall(r"[-+*/^xX()\d\s\.]+", text)
        expr_text = match[-1] if match else text

        # Normalize multiplication symbols and trim filler words.
        expr_text = re.sub(r"(?<=\d)\s*[xX]\s*(?=\d)", "*", expr_text)
        expr_text = re.sub(r"\b(whats|what is|calculate|compute|evaluate|solve)\b", "", expr_text).strip()

        expr = sp.sympify(expr_text)
        steps = []
        result = None
        if "integrate" in text or "integral" in text:
            result = sp.integrate(expr)
            steps.append(f"Integrate the expression: ? {expr} dx = {result}")
        elif "differentiate" in text or "derivative" in text:
            result = sp.diff(expr)
            steps.append(f"Take derivative d/dx: {expr} -> {result}")
        elif "limit" in text:
            x = list(expr.free_symbols)[0] if expr.free_symbols else sp.symbols("x")
            result = sp.limit(expr, x, 0)
            steps.append(f"Compute limit as {x}->0: {result}")
        elif "factor" in text:
            result = sp.factor(expr)
            steps.append(f"Factor the expression: {expr} -> {result}")
        elif "expand" in text:
            result = sp.expand(expr)
            steps.append(f"Expand the expression: {expr} -> {result}")
        else:
            result = sp.simplify(expr)
            steps.append(f"Simplify: {expr} -> {result}")

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


def calculate(expression: Union[str, None]) -> Union[float, str]:
    """Lightweight calculator backing the /calculate route."""
    if not expression:
        return "Error"

    expr = expression.replace(" ", "").replace("^", "**")

    try:
        return eval(expr, {"__builtins__": {}}, SAFE_MATH_FUNCS)
    except Exception:
        try:
            return float(sp.sympify(expr))
        except Exception:
            return "Error"

