import json
import re
import time
import os
from typing import Optional

import numpy as np
import faiss
import requests
from sentence_transformers import SentenceTransformer

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =================================================
# CONFIG
# =================================================
OPENROUTER_API_KEY = "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" # تأكد من وضع مفتاحك هنا
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

MODEL_NAME = "google/gemini-3.1-flash-lite-preview"

SUBJECT_STORES = {
    "أحياء":   {"dataset": "biology_dataset.json",   "index": "biology_index.faiss"},
    "كيمياء":  {"dataset": "chemistry_dataset.json", "index": "chemistry_index.faiss"},
    "فيزياء":  {"dataset": "physics_dataset.json",   "index": "physics_index.faiss"},
    "رياضيات": {"dataset": "math_dataset.json",      "index": "math_index.faiss"},
}

# =================================================
# LIMITS
# =================================================
MAX_UNITS = 2
MAX_LESSONS_PER_UNIT = 3
MAX_SLIDES_PER_LESSON = 4

CURRICULUM_BY_LEVEL = {
    "ضعيف":  {"units": 2, "lessons_per_unit": 3, "slides_per_lesson": 4, "top_k": 3},
    "متوسط": {"units": 2, "lessons_per_unit": 3, "slides_per_lesson": 4, "top_k": 3},
    "جيد":   {"units": 2, "lessons_per_unit": 2, "slides_per_lesson": 4, "top_k": 2},
    "ممتاز": {"units": 1, "lessons_per_unit": 2, "slides_per_lesson": 4, "top_k": 2},
}
DEFAULT_LEVEL = "متوسط"

# =================================================
# SETTINGS
# =================================================
SAVE_PATH = "generated_curriculum.json"

MAX_TOKENS_ONE_CALL = 14000
TIMEOUT_SEC = 140

MAX_CONTEXT_CHARS_PER_LESSON = 2200
MAX_TITLE_WORDS = 7
MAX_EXPLANATION_SENTENCES = 6
MAX_EXPLANATION_CHARS = 520
MAX_KEYPOINT_WORDS = 12

# =================================================
# EMBEDDING MODEL
# =================================================
embed_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
_SUBJECT_CACHE = {}

# =================================================
# FASTAPI APP
# =================================================
app = FastAPI(title="Curriculum & Flashcards API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    query: str

class GenerateResponse(BaseModel):
    success: bool
    query: str
    result: dict

class FlashcardsRequest(BaseModel):
    moduleId: str
    topic: Optional[str] = None

# =================================================
# HELPERS
# =================================================
def normalize_subject_name(s: str) -> str:
    s = re.sub(r"\s+", " ", (s or "").strip())
    if s == "زياء":
        return "فيزياء"
    return s

def normalize_simple(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text

def parse_module_id(module_id: str) -> dict:
    try:
        data = json.loads(module_id)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {"lessonTitle": module_id}

_LATEX_PATTERNS = [
    r"\$\$.*?\$\$",
    r"\$.*?\$",
    r"\\\[(.|\n)*?\\\]",
    r"\\\((.|\n)*?\\\)",
]

def _protect_latex(text: str):
    if not text:
        return "", {}
    big_pat = re.compile("|".join(_LATEX_PATTERNS), flags=re.DOTALL)
    latex_map = {}
    counter = 0

    def repl(m):
        nonlocal counter
        token = f"__LATEX_{counter}__"
        latex_map[token] = m.group(0)
        counter += 1
        return token

    return big_pat.sub(repl, text), latex_map

def _restore_latex(text: str, latex_map: dict):
    if not text or not latex_map:
        return text
    for token, latex in latex_map.items():
        text = text.replace(token, latex)
    return text

def clean_to_arabic(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"[A-Za-z]+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def clean_math_rag_text(text: str) -> str:
    if not text:
        return ""

    protected, latex_map = _protect_latex(text)
    t = protected

    t = re.sub(r"___\d+__", " ", t)
    t = re.sub(r"__\s*_\d+__", " ", t)
    t = re.sub(r"__\s*\d+__", " ", t)

    t = re.sub(r"\|[-:\s]+\|", " ", t)
    t = re.sub(r"\|", " ", t)

    t = re.sub(r"(الدرس:\s*){2,}", "الدرس: ", t)
    noise_patterns = [
        r"عنوان الشريحة\s*:\s*",
        r"تحقق من فهمك\s*[:：]?",
        r"لماذا\؟?",
        r"الخطوة\s*\d+\s*[:：]?",
        r"مفهوم أساسي",
        r"من واقع الحياة",
        r"الأهداف",
        r"الربط مع الحياة",
    ]
    for pat in noise_patterns:
        t = re.sub(pat, " ", t)

    t = re.sub(r"[•●■▪]", " ", t)
    t = re.sub(r"[-]{2,}", " ", t)
    t = re.sub(r"[A-Za-z]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()

    t = _restore_latex(t, latex_map)
    return t.strip()

def clean_text_by_subject(subject: str, text: str) -> str:
    subject = normalize_subject_name(subject)
    if subject == "رياضيات":
        return clean_math_rag_text(text)
    return clean_to_arabic(text)

def _escape_invalid_backslashes(s: str) -> str:
    return re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', s)

def extract_json_robust(text: str):
    if not text or not text.strip():
        raise ValueError("Empty response from model")

    t = text.strip()
    t = re.sub(r"```(?:json)?", "", t, flags=re.IGNORECASE).strip()
    t = t.replace("```", "").strip()

    try:
        return json.loads(t)
    except Exception:
        pass

    try:
        return json.loads(_escape_invalid_backslashes(t))
    except Exception:
        pass

    m = re.search(r"\{.*\}|\[.*\]", t, flags=re.DOTALL)
    if not m:
        raise ValueError("No JSON found in model response.")

    candidate = m.group(0).strip()
    candidate = candidate.replace("،", ",")
    candidate = candidate.replace("“", '"').replace("”", '"')
    candidate = re.sub(r",\s*([}\]])", r"\1", candidate)

    try:
        return json.loads(candidate)
    except Exception:
        pass

    candidate = _escape_invalid_backslashes(candidate)
    return json.loads(candidate)

def save_partial(data: dict):
    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# =================================================
# PROFILE PARSER
# =================================================
def parse_student_profile(text: str):
    if not text or not text.strip():
        return []

    levels = ["ضعيف", "متوسط", "جيد", "ممتاز"]
    parts = re.split(r"[,\n،;]+", text.strip())
    out = []

    for p in parts:
        p = p.strip()
        if not p:
            continue

        lvl = next((L for L in levels if re.search(rf"\b{L}\b", p)), None) or DEFAULT_LEVEL

        subj = p
        subj = re.sub(r"(مستوى|الطالب|فيها)\s*", " ", subj)
        subj = re.sub(rf"\b({'|'.join(levels)})\b", " ", subj)
        subj = re.sub(r"\s+", " ", subj).strip()
        subj = normalize_subject_name(subj)

        if subj:
            out.append({"subject": subj, "level": lvl})

    merged = {}
    for item in out:
        merged[item["subject"]] = item["level"]

    return [{"subject": s, "level": l} for s, l in merged.items()]

def clamp_plan(level: str) -> dict:
    base = CURRICULUM_BY_LEVEL.get(level, CURRICULUM_BY_LEVEL[DEFAULT_LEVEL])
    return {
        "units": min(int(base["units"]), MAX_UNITS),
        "lessons_per_unit": min(int(base["lessons_per_unit"]), MAX_LESSONS_PER_UNIT),
        "slides_per_lesson": min(int(base["slides_per_lesson"]), MAX_SLIDES_PER_LESSON),
        "top_k": int(base["top_k"]),
    }

# =================================================
# LOAD STORES
# =================================================
def load_subject_store(subject: str):
    subject = normalize_subject_name(subject)
    if subject in _SUBJECT_CACHE:
        return _SUBJECT_CACHE[subject]

    cfg = SUBJECT_STORES.get(subject)
    if not cfg:
        raise ValueError(f"لا يوجد store للمادة: {subject}")

    # --- التعديل يبدأ هنا لضمان العثور على الملفات ---
    # هذا السطر يحدد موقع ملف rag_generate.py الحالي على جهازك
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # دمج مسار المجلد مع اسم ملف الداتا سيت
    dataset_path = os.path.join(BASE_DIR, cfg["dataset"])
    index_path = os.path.join(BASE_DIR, cfg["index"])
    # --- نهاية التعديل ---

    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"ملف الداتا سيت غير موجود في المسار: {dataset_path}")
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"ملف الفهرس غير موجود في المسار: {index_path}")

    with open(dataset_path, "r", encoding="utf-8") as f:
        docs = json.load(f)

    idx = faiss.read_index(index_path)
    _SUBJECT_CACHE[subject] = (docs, idx)
    return docs, idx

# =================================================
# RAG
# =================================================
def retrieve_lesson_context(subject: str, lesson_title: str, top_k: int) -> str:
    docs, idx = load_subject_store(subject)
    subject = normalize_subject_name(subject)

    if subject == "رياضيات":
        exact_matches = []
        lt = clean_text_by_subject(subject, lesson_title)

        for doc in docs:
            lesson_name = clean_text_by_subject(subject, str(doc.get("lesson", "")))
            if lt and lesson_name and (lt == lesson_name or lt in lesson_name or lesson_name in lt):
                exact_matches.append(doc)

        if exact_matches:
            chunks = []
            for doc in exact_matches[:top_k]:
                chunks.append(
                    f"الدرس: {doc.get('lesson','')}\n"
                    f"{doc.get('content','')}\n"
                    "----\n"
                )
            context = "\n".join(chunks)[:MAX_CONTEXT_CHARS_PER_LESSON]
            return clean_text_by_subject(subject, context)

    q_emb = embed_model.encode([lesson_title])
    _, indices = idx.search(np.array(q_emb), top_k)

    chunks = []
    for i in indices[0]:
        if i < 0 or i >= len(docs):
            continue
        doc = docs[i]
        chunks.append(
            f"الدرس: {doc.get('lesson','')}\n"
            f"{doc.get('content','')}\n"
            "----\n"
        )

    context = "\n".join(chunks)[:MAX_CONTEXT_CHARS_PER_LESSON]
    return clean_text_by_subject(subject, context)

def pick_lessons_from_dataset(subject: str, n: int) -> list[str]:
    docs, _ = load_subject_store(subject)
    seen = set()
    titles = []

    for d in docs:
        t = clean_text_by_subject(subject, str(d.get("lesson", "")).strip())
        if not t or t in seen:
            continue
        seen.add(t)
        titles.append(t)
        if len(titles) >= n:
            break

    while len(titles) < n:
        titles.append(f"درس {len(titles)+1} في {subject}")

    return titles[:n]

# =================================================
# TEXT POST-PROCESSING FOR SLIDES
# =================================================
def split_sentences(text: str) -> list[str]:
    if not text:
        return []
    text = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[\.\!\؟])\s+", text)
    out = []
    for p in parts:
        p = p.strip()
        if len(p) >= 8:
            out.append(p)
    return out

def extract_formulas(ctx: str) -> list[str]:
    if not ctx:
        return []
    pat = re.compile("|".join(_LATEX_PATTERNS), flags=re.DOTALL)
    out = []
    for m in pat.finditer(ctx):
        s = m.group(0).strip()
        if s and s not in out:
            out.append(s)
    return out[:6]

def split_context_for_slides(subject: str, ctx: str, n_slides: int) -> list[str]:
    sents = split_sentences(ctx)
    if not sents:
        return [ctx] * n_slides

    unique_sents = []
    seen = set()
    for s in sents:
        key = re.sub(r"\s+", " ", s).strip()
        if key and key not in seen:
            seen.add(key)
            unique_sents.append(s)

    sents = unique_sents if unique_sents else sents
    total = len(sents)

    chunks = []
    window = max(3, total // n_slides) if total >= n_slides else 3

    for i in range(n_slides):
        start = int(i * total / n_slides)
        end = min(total, start + window)
        part = sents[start:end]
        if not part:
            part = [sents[i % total]]
        text = " ".join(part).strip()
        chunks.append(text if text else ctx)

    return chunks[:n_slides]

def shorten_title(subject: str, title: str, lesson_title: str = "") -> str:
    title = clean_text_by_subject(subject, title)
    title = re.sub(r"___\d+__", " ", title)
    title = re.sub(r"__\s*_\d+__", " ", title)
    title = re.sub(r"الدرس:\s*", "", title)
    title = re.sub(r"عنوان الشريحة:\s*", "", title)
    title = re.sub(r"\s+", " ", title).strip()

    words = title.split()
    if len(words) > MAX_TITLE_WORDS:
        title = " ".join(words[:MAX_TITLE_WORDS])

    title = title.strip(" -–—،؛:.")
    if not title:
        title = lesson_title if lesson_title else "عنوان مختصر"

    if len(title.split()) > MAX_TITLE_WORDS:
        title = " ".join(title.split()[:MAX_TITLE_WORDS])

    return title

def shorten_explanation(subject: str, explanation: str, formulas: Optional[list[str]] = None, formula_index: int = 0) -> str:
    explanation = clean_text_by_subject(subject, explanation)
    explanation = re.sub(r"___\d+__", " ", explanation)
    explanation = re.sub(r"__\s*_\d+__", " ", explanation)
    explanation = re.sub(r"الدرس:\s*", "", explanation)
    explanation = re.sub(r"عنوان الشريحة:\s*", "", explanation)
    explanation = re.sub(r"\s+", " ", explanation).strip()

    sents = split_sentences(explanation)
    if not sents:
        sents = [explanation] if explanation else []

    compact = []
    for s in sents:
        s = s.strip()
        if s and s not in compact:
            compact.append(s)
        if len(compact) >= MAX_EXPLANATION_SENTENCES:
            break

    text = " ".join(compact).strip()

    if subject == "رياضيات" and formulas:
        selected_formula = formulas[formula_index % len(formulas)]
        if selected_formula not in text:
            if len(text) + len(selected_formula) + 1 <= MAX_EXPLANATION_CHARS:
                text = f"{text} {selected_formula}".strip()

    if len(text) > MAX_EXPLANATION_CHARS:
        text = text[:MAX_EXPLANATION_CHARS].rsplit(" ", 1)[0].strip()
        if not text.endswith("."):
            text += "."

    return text or "شرح مختصر من النص."

def compact_keypoint(subject: str, kp: str) -> str:
    kp = clean_text_by_subject(subject, kp)
    kp = re.sub(r"___\d+__", " ", kp)
    kp = re.sub(r"__\s*_\d+__", " ", kp)
    kp = re.sub(r"الدرس:\s*", "", kp)
    kp = re.sub(r"عنوان الشريحة:\s*", "", kp)
    kp = re.sub(r"\s+", " ", kp).strip()

    words = kp.split()
    if len(words) > MAX_KEYPOINT_WORDS:
        kp = " ".join(words[:MAX_KEYPOINT_WORDS])

    return kp.strip(" -–—،؛:.")

def build_compact_keypoints(subject: str, ctx: str, existing: Optional[list[str]] = None) -> list[str]:
    out = []
    existing = existing or []

    for kp in existing:
        kp2 = compact_keypoint(subject, kp)
        if kp2 and kp2 not in out:
            out.append(kp2)
        if len(out) >= 4:
            return out[:4]

    sents = split_sentences(ctx)
    for s in sents:
        kp2 = compact_keypoint(subject, s)
        if kp2 and kp2 not in out:
            out.append(kp2)
        if len(out) >= 4:
            break

    while len(out) < 4:
        out.append("مفهوم رئيسي")

    return out[:4]

def generate_distinct_slide_titles(subject: str, lesson_title: str, slide_chunks: list[str]) -> list[str]:
    titles = []

    if subject == "رياضيات":
        patterns = [
            r"(المتتابعات الحسابية)",
            r"(المتتابعات الهندسية)",
            r"(المتسلسلات الحسابية)",
            r"(المتسلسلات الهندسية)",
            r"(الحد النوني)",
            r"(صيغة المجموع)",
            r"(المجموع الجزئي)",
            r"(نظرية ذات الحدين)",
            r"(الاستقراء الرياضي)",
            r"(القانون)",
        ]
    else:
        patterns = [r"([اأإآء-ي][^\.:\n]{6,40})"]

    for idx, chunk in enumerate(slide_chunks, start=1):
        title = ""
        for pat in patterns:
            m = re.search(pat, chunk)
            if m:
                title = m.group(1).strip()
                break

        if not title:
            words = chunk.split()
            title = " ".join(words[:MAX_TITLE_WORDS]) if words else f"فكرة {idx}"

        title = shorten_title(subject, title, lesson_title)
        if not title:
            title = f"فكرة {idx}"

        if title in titles:
            title = f"{title} {idx}"
            title = shorten_title(subject, title, lesson_title)

        if title in titles:
            base = lesson_title.split()[0] if lesson_title else "فكرة"
            title = f"{base} {idx}"

        titles.append(title)

    return titles

def split_math_context_into_slide_titles(lesson_title: str, ctx: str, n: int = 4) -> list[str]:
    slide_chunks = split_context_for_slides("رياضيات", ctx, n)
    return generate_distinct_slide_titles("رياضيات", lesson_title, slide_chunks)


# =================================================
# MAIN OPENROUTER CALL
# =================================================
def system_prompt() -> str:
    return (
        "أنت مولّد شرائح تعليمية عربي (تحصيلي). "
        "أخرج JSON فقط دون أي نص إضافي. "
        "اجعل عنوان كل شريحة قصيرًا جدًا. "
        "اجعل شرح كل شريحة أوضح وأطول من النسخة المختصرة، "
        "بحيث يكون شرحًا تعليميًا متماسكًا من 4 إلى 6 أسطر تقريبًا، "
        "وليس جملة أو جملتين فقط. "
        "اجعل كل شرائح الدرس مختلفة في الفكرة، ولا تكرر نفس الشرح أو نفس النقاط بين الشرائح. "
        "اجعل key_points قصيرة وواضحة. "
        "ممنوع placeholders مثل ___0__ أو __ _0__. "
        "للرياضيات: استخدم فقط المعادلات والقوانين الموجودة في النص المسترجع من الداتا سيت "
        "إذا كانت متوفرة، واكتبها بصيغة LaTeX داخل $...$. "
        "لا تؤلف معادلات جديدة من عندك. "
        "لا تكرر نفس المعادلة في جميع الشرائح إلا إذا لم يوجد غيرها."
    )

def openrouter_one_call(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=401, detail="Missing API Key. Please provide OPENROUTER_API_KEY")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "RAG One-Call Curriculum Generator"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.15,
        "top_p": 0.9,
        "max_tokens": int(MAX_TOKENS_ONE_CALL),
    }

    t0 = time.time()
    r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT_SEC)
    dt = time.time() - t0
    print(f"⏱️ ONE API CALL finished in {dt:.1f}s | model={MODEL_NAME}")

    if r.status_code == 429:
        raise RuntimeError("OpenRouter 429: Rate limit.")
    if r.status_code == 402:
        raise RuntimeError("OpenRouter 402: No credits.")
    if r.status_code >= 500:
        raise RuntimeError(f"OpenRouter 5xx: {r.text[:250]}")
    if r.status_code != 200:
        raise RuntimeError(f"OpenRouter HTTP {r.status_code}: {r.text[:250]}")

    data = r.json()
    if "choices" not in data or not data["choices"]:
        raise RuntimeError(f"OpenRouter JSON بدون choices: {json.dumps(data, ensure_ascii=False)[:250]}")

    return data["choices"][0]["message"]["content"]


# =================================================
# TEMPLATE
# =================================================
def build_template(profile: list[dict]) -> tuple[dict, dict]:
    template = {"generated_at": time.time(), "profile": profile, "subjects": []}
    ctx_map = {}

    for item in profile:
        subject = normalize_subject_name(item["subject"])
        level = item["level"]
        cfg = clamp_plan(level)

        units = cfg["units"]
        lpu = cfg["lessons_per_unit"]
        spl = cfg["slides_per_lesson"]
        top_k = cfg["top_k"]

        total_lessons = units * lpu
        lesson_titles = pick_lessons_from_dataset(subject, total_lessons)

        subj_obj = {
            "subject": subject,
            "student_level": level,
            "plan": {
                "units": units,
                "lessons_per_unit": lpu,
                "slides_per_lesson": spl,
                "top_k": top_k
            },
            "units": []
        }

        idx = 0
        for u in range(1, units + 1):
            unit_obj = {
                "unit_number": u,
                "unit_title": f"وحدة {u} في {subject}",
                "lessons": []
            }

            for l in range(1, lpu + 1):
                lesson_title = lesson_titles[idx]
                idx += 1

                context = retrieve_lesson_context(subject, lesson_title, top_k)
                ctx_map[(subject, u, l)] = context

                if subject == "رياضيات":
                    slide_titles = split_math_context_into_slide_titles(lesson_title, context, spl)
                else:
                    slide_chunks = split_context_for_slides(subject, context, spl)
                    slide_titles = generate_distinct_slide_titles(subject, lesson_title, slide_chunks)

                slides = []
                for s in range(1, spl + 1):
                    slides.append({
                        "slide_number": s,
                        "title": slide_titles[s - 1],
                        "explanation": "",
                        "key_points": [],
                        "example": None
                    })

                unit_obj["lessons"].append({
                    "lesson_number": l,
                    "lesson_title": lesson_title,
                    "slides": slides
                })

            subj_obj["units"].append(unit_obj)

        template["subjects"].append(subj_obj)

    return template, ctx_map


# =================================================
# LOCAL REPAIR
# =================================================
def repair_with_local_context(output_json: dict, ctx_map: dict) -> dict:
    for subj in output_json.get("subjects", []):
        subject = normalize_subject_name(subj.get("subject", ""))

        for unit in subj.get("units", []):
            u_no = int(unit.get("unit_number", 0) or 0)

            for lesson in unit.get("lessons", []):
                l_no = int(lesson.get("lesson_number", 0) or 0)
                lesson_title = lesson.get("lesson_title", "")
                ctx = ctx_map.get((subject, u_no, l_no), "")

                slide_chunks = split_context_for_slides(subject, ctx, MAX_SLIDES_PER_LESSON)
                local_titles = generate_distinct_slide_titles(subject, lesson_title, slide_chunks)

                used_titles = set()
                for i, slide in enumerate(lesson.get("slides", []), start=1):
                    chunk = slide_chunks[i - 1] if i - 1 < len(slide_chunks) else ctx

                    formulas = extract_formulas(chunk) if subject == "رياضيات" else []

                    title = str(slide.get("title", "") or "")
                    title = shorten_title(subject, title, lesson_title)

                    if (not title) or title in used_titles:
                        title = local_titles[i - 1]

                    if title in used_titles:
                        title = f"{lesson_title.split()[0] if lesson_title else 'فكرة'} {i}"

                    used_titles.add(title)
                    slide["title"] = title

                    explanation = str(slide.get("explanation", "") or "")
                    base_text = explanation if explanation else chunk
                    slide["explanation"] = shorten_explanation(
                        subject,
                        base_text,
                        formulas,
                        formula_index=i - 1
                    )

                    existing_kps = slide.get("key_points", [])
                    slide["key_points"] = build_compact_keypoints(subject, chunk, existing_kps)
                    slide["key_points"] = [kp for kp in slide["key_points"] if kp.strip()]

                    if subject == "رياضيات" and formulas:
                        formula_kp = formulas[(i - 1) % len(formulas)]
                        if formula_kp not in slide["key_points"]:
                            if len(slide["key_points"]) >= 4:
                                slide["key_points"][-1] = formula_kp
                            else:
                                slide["key_points"].append(formula_kp)

                    slide["example"] = None

    return output_json


# =================================================
# GENERATION PIPELINE
# =================================================
def generate_curriculum(student_profile_query: str) -> dict:
    profile = parse_student_profile(student_profile_query)
    if not profile:
        raise ValueError('الكويري فارغ أو غير صالح. مثال: "رياضيات ضعيف، أحياء ممتاز، فيزياء متوسط، كيمياء جيد"')

    template, ctx_map = build_template(profile)

    contexts_payload = []
    for (subject, u, l), ctx in ctx_map.items():
        contexts_payload.append({
            "subject": subject,
            "unit_number": u,
            "lesson_number": l,
            "context": ctx
        })

    prompt = f"""
املأ الحقول الفارغة في القالب فقط ولا تغيّر البنية.
المطلوب:
- title قصير جدًا.
- explanation أطول من النسخة السابقة، ويكون شرحًا تعليميًا واضحًا من 4 إلى 6 أسطر تقريبًا.
- key_points قصيرة وواضحة.
- اجعل كل 4 شرائح في كل درس مختلفة في الفكرة والشرح.
- لا تستخدم placeholders مثل ___0__ أو __ _0__.
- للرياضيات: استخدم فقط المعادلات والقوانين الموجودة في النص المسترجع من الداتا سيت،
  ولا تولّد معادلات جديدة من عندك.

أخرج JSON فقط.

القالب:
{json.dumps(template, ensure_ascii=False)}

المراجع النصية لكل درس:
{json.dumps(contexts_payload, ensure_ascii=False)}
""".strip()

    try:
        raw = openrouter_one_call(prompt)
        data = extract_json_robust(raw)

        if not isinstance(data, dict) or "subjects" not in data:
            raise ValueError("Model JSON missing subjects")

        final = repair_with_local_context(data, ctx_map)

    except Exception as e:
        print(f"⚠️ ONE CALL failed -> local compact build. Reason: {e}")
        final = repair_with_local_context(template, ctx_map)

    save_partial(final)
    return final


# =================================================
# FRONTEND HELPERS & FLASHCARDS
# =================================================
def curriculum_to_module_content(curriculum: dict) -> dict:
    slides = []
    title = "الوحدة الدراسية"

    for subj in curriculum.get("subjects", []):
        subject_name = subj.get("subject", "")
        if subject_name:
            title = subject_name

        for unit in subj.get("units", []):
            for lesson in unit.get("lessons", []):
                lesson_title = lesson.get("lesson_title", "")

                for slide in lesson.get("slides", []):
                    slide_title = slide.get("title", "") or lesson_title or "شريحة"
                    slides.append({
                        "title": slide_title,
                        "content": slide.get("explanation", ""),
                        "example": slide.get("example"),
                        "keyPoints": slide.get("key_points", [])
                    })

    return {
        "title": title,
        "slides": slides,
        "quickQuestions": {}
    }


def flashcards_system_prompt() -> str:
    return (
        "أنت مساعد تعليمي دقيق جداً. مهمتك استخراج بطاقات تعليمية (Flashcards) من 'النص المرجعي' للدرس *فقط لا غير*. "
        "يمنع منعاً باتاً إضافة أي معلومات أو أسئلة من خارج النص المرجعي. "
        "أخرج JSON فقط دون أي نص إضافي. "
        "كل بطاقة يجب أن تحتوي على:\n"
        '- "id": رقم تسلسلي.\n'
        '- "front": مصطلح أو فكرة موجودة في النص.\n'
        '- "back": تعريفها أو الشرح الخاص بها مستخرج حرفياً من النص.\n'
        "أخرج من 4 إلى 6 بطاقات فقط.\n"
        'صيغة الخرج تكون قائمة JSON مثل: [{"id":"1","front":"...","back":"..."}]'
    )

def build_flashcards_fallback(lesson_title: str, slides: list[dict]) -> list[dict]:
    flashcards = []

    for idx, slide in enumerate(slides[:6], start=1):
        title = (slide.get("title") or f"مفهوم {idx}").strip()
        key_points = slide.get("key_points", []) or []
        explanation = (slide.get("explanation") or "").strip()

        if key_points:
            answer = str(key_points[0]).strip()
        else:
            parts = re.split(r"[.؟!]\s*", explanation)
            answer = parts[0].strip() if parts and parts[0].strip() else explanation

        answer = re.sub(r"\s+", " ", answer).strip()
        words = answer.split()[:12]
        answer = " ".join(words).strip()

        if not answer:
            answer = "معلومة من الدرس"

        flashcards.append({
            "id": str(idx),
            "front": title,
            "back": answer
        })

    return flashcards

def generate_flashcards_with_model(lesson_title: str, slides: list[dict]) -> list[dict]:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=401, detail="Missing API Key. Please provide OPENROUTER_API_KEY")

    if not slides:
        return []

    lesson_text_parts = []
    for slide in slides:
        title = slide.get("title", "")
        explanation = slide.get("explanation", "")
        key_points = slide.get("key_points", []) or []

        block = f"عنوان الشريحة: {title}\nشرح: {explanation}\n"
        if key_points:
            block += "نقاط رئيسية:\n- " + "\n- ".join(key_points) + "\n"
        lesson_text_parts.append(block)

    lesson_text = "\n\n".join(lesson_text_parts)[:5000]

    prompt = f"""
أنشئ بطاقات تعليمية لهذا الدرس.

اسم الدرس:
{lesson_title}

محتوى الدرس:
{lesson_text}

أخرج JSON فقط.
""".strip()

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "Afaq Flashcards Generator"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": flashcards_system_prompt()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "top_p": 0.9,
        "max_tokens": 1200,
    }

    r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT_SEC)

    if r.status_code != 200:
        raise RuntimeError(f"Flashcards model error {r.status_code}: {r.text[:300]}")

    data = r.json()
    if "choices" not in data or not data["choices"]:
        raise RuntimeError("Flashcards model returned no choices")

    raw = data["choices"][0]["message"]["content"]
    parsed = extract_json_robust(raw)

    if not isinstance(parsed, list):
        raise ValueError("Flashcards response is not a JSON list")

    flashcards = []
    for idx, item in enumerate(parsed, start=1):
        if not isinstance(item, dict):
            continue

        front = str(item.get("front", "")).strip()
        back = str(item.get("back", "")).strip()

        if not front or not back:
            continue

        flashcards.append({
            "id": str(item.get("id", idx)),
            "front": front,
            "back": back
        })

    if not flashcards:
        return build_flashcards_fallback(lesson_title, slides)

    return flashcards[:6]

def curriculum_to_flashcards(curriculum: dict, module_id: str) -> list[dict]:
    parsed = parse_module_id(module_id)

    target_subject = normalize_simple(parsed.get("subject", ""))
    target_unit = normalize_simple(parsed.get("unitTitle", ""))
    target_lesson = normalize_simple(parsed.get("lessonTitle", ""))

    subjects = curriculum.get("subjects", [])
    if not subjects:
        return []

    for subject in subjects:
        subject_name = normalize_simple(subject.get("subject", ""))
        if target_subject and subject_name != target_subject:
            continue

        for unit in subject.get("units", []):
            unit_title = normalize_simple(unit.get("unit_title", ""))
            if target_unit and unit_title != target_unit:
                continue

            for lesson in unit.get("lessons", []):
                lesson_title = normalize_simple(lesson.get("lesson_title", ""))
                if target_lesson and lesson_title != target_lesson:
                    continue

                slides = lesson.get("slides", []) or []
                try:
                    return generate_flashcards_with_model(
                        lesson.get("lesson_title", "هذا الدرس"),
                        slides
                    )
                except Exception as e:
                    print("FLASHCARDS MODEL ERROR:", repr(e))
                    if isinstance(e, HTTPException):
                        raise e
                    return build_flashcards_fallback(
                        lesson.get("lesson_title", "هذا الدرس"),
                        slides
                    )

    return []

# =================================================
# API ROUTES
# =================================================
@app.get("/")
def root():
    return {
        "message": "Curriculum Generator API is running",
        "endpoints": ["/generate", "/ai/module-content", "/ai/flashcards"]
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate", response_model=GenerateResponse)
def generate_api(payload: GenerateRequest):
    try:
        query = (payload.query or "").strip()
        if not query:
            raise HTTPException(status_code=400, detail="query مطلوب")

        result = generate_curriculum(query)

        return {
            "success": True,
            "query": query,
            "result": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/module-content")
def module_content_api(payload: GenerateRequest):
    try:
        query = (payload.query or "").strip()
        if not query:
            raise HTTPException(status_code=400, detail="query مطلوب")

        curriculum = generate_curriculum(query)
        module_content = curriculum_to_module_content(curriculum)
        return module_content

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/flashcards")
def flashcards_api(payload: FlashcardsRequest):
    try:
        query = (payload.topic or "").strip()

        if not query:
            parsed = parse_module_id(payload.moduleId)
            subject = (parsed.get("subject") or "").strip()

            if subject:
                query = f"{subject} متوسط"
            else:
                query = "أحياء متوسط"

        # محاولة قراءة المنهج من الملف لتسريع الاستجابة وتقليل استهلاك الـ API
        curriculum = None
        if os.path.exists(SAVE_PATH):
            with open(SAVE_PATH, "r", encoding="utf-8") as f:
                curriculum = json.load(f)
                
        # إذا لم يكن موجوداً، قم بإنشائه
        if not curriculum:
            curriculum = generate_curriculum(query)

        flashcards = curriculum_to_flashcards(curriculum, payload.moduleId)

        if not flashcards:
            raise HTTPException(status_code=404, detail="لم يتم العثور على بطاقات لهذا الدرس")

        return flashcards

    except HTTPException:
        raise
    except Exception as e:
        print("FLASHCARDS ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# =================================================
# RUN LOCALHOST
# =================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_generate:app", host="127.0.0.1", port=9000, reload=True)