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
OPENROUTER_API_KEY = "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"  # ضع مفتاحك هنا
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

# =================================================
# EMBEDDING MODEL (للبحث في الملفات فقط)
# =================================================
embed_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
_SUBJECT_CACHE = {}

# =================================================
# FASTAPI APP
# =================================================
app = FastAPI(title="AI-Powered RAG Curriculum Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
# HELPERS (تنظيف ومساعدة)
# =================================================
def normalize_subject_name(s: str) -> str:
    s = re.sub(r"\s+", " ", (s or "").strip())
    if s == "زياء":
        return "فيزياء"
    return s

def clean_text_by_subject(subject: str, text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()

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
# LOAD STORES & RETRIEVE (RAG)
# =================================================
def load_subject_store(subject: str):
    subject = normalize_subject_name(subject)
    if subject in _SUBJECT_CACHE:
        return _SUBJECT_CACHE[subject]

    cfg = SUBJECT_STORES.get(subject)
    if not cfg:
        raise ValueError(f"لا يوجد store للمادة: {subject}")

    dataset_path = cfg["dataset"]
    index_path = cfg["index"]

    with open(dataset_path, "r", encoding="utf-8") as f:
        docs = json.load(f)

    idx = faiss.read_index(index_path)
    _SUBJECT_CACHE[subject] = (docs, idx)
    return docs, idx

def retrieve_lesson_context(subject: str, lesson_title: str, top_k: int) -> str:
    docs, idx = load_subject_store(subject)
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
# MAIN OPENROUTER CALL
# =================================================
def system_prompt() -> str:
    return (
        "أنت مساعد تعليمي متخصص. مهمتك بناء محتوى الشرائح (Slides) التعليمية بناءً على 'النص المرجعي' المرفق فقط.\n"
        "تعليمات صارمة:\n"
        "1. لا تضف أي معلومات، أرقام، أو مصطلحات علمية من خارج النص المرجعي المرفق.\n"
        "2. قم بتعبئة القالب المرفق بذكاء، بحيث تغطي كل شريحة فكرة مستقلة من النص المسترجع.\n"
        "3. استخرج 'title' قصير لكل شريحة.\n"
        "4. اكتب 'explanation' لكل شريحة في 4 إلى 6 أسطر بناءً على النص.\n"
        "5. استخرج 'key_points' كنقاط مختصرة ومباشرة.\n"
        "6. أخرج JSON فقط بدون أي مقدمات أو تعليقات."
    )

def openrouter_one_call(prompt: str) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=401, detail="Missing API Key. Please provide OPENROUTER_API_KEY")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "AI RAG Curriculum Generator"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": MAX_TOKENS_ONE_CALL,
    }

    t0 = time.time()
    r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT_SEC)
    dt = time.time() - t0
    print(f"⏱️ API CALL finished in {dt:.1f}s")

    if r.status_code != 200:
        raise RuntimeError(f"OpenRouter HTTP {r.status_code}: {r.text[:250]}")

    data = r.json()
    return data["choices"][0]["message"]["content"]

# =================================================
# TEMPLATE BUILDER (يبني الهيكل الفارغ فقط للمودل)
# =================================================
def build_empty_template(profile: list[dict]) -> tuple[dict, list]:
    template = {"generated_at": time.time(), "profile": profile, "subjects": []}
    contexts_payload = []

    for item in profile:
        subject = item["subject"]
        level = item["level"]
        cfg = clamp_plan(level)

        units, lpu, spl, top_k = cfg["units"], cfg["lessons_per_unit"], cfg["slides_per_lesson"], cfg["top_k"]
        total_lessons = units * lpu
        lesson_titles = pick_lessons_from_dataset(subject, total_lessons)

        subj_obj = {
            "subject": subject,
            "student_level": level,
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

                # 1. RAG Retrieval (قراءة من الداتا سيت)
                context = retrieve_lesson_context(subject, lesson_title, top_k)
                contexts_payload.append({
                    "subject": subject,
                    "unit": u,
                    "lesson": lesson_title,
                    "retrieved_context": context
                })

                # بناء هيكل شرائح فارغ للمودل ليقوم بتعبئته
                slides = [{"slide_number": s, "title": "", "explanation": "", "key_points": []} for s in range(1, spl + 1)]

                unit_obj["lessons"].append({
                    "lesson_number": l,
                    "lesson_title": lesson_title,
                    "slides": slides
                })

            subj_obj["units"].append(unit_obj)
        template["subjects"].append(subj_obj)

    return template, contexts_payload

# =================================================
# GENERATION PIPELINE (RAG + AI MODEL)
# =================================================
def generate_curriculum(student_profile_query: str) -> dict:
    profile = parse_student_profile(student_profile_query)
    if not profile:
        raise ValueError('الكويري فارغ أو غير صالح.')

    template, contexts_payload = build_empty_template(profile)

    prompt = f"""
أمامك قالب JSON فارغ للدروس والشرائح، وأمامك النصوص المرجعية التي تم استرجاعها من المنهج.
المطلوب: قم بتعبئة القالب (الحقول الفارغة في السلايدات) بالاعتماد حصراً على النصوص المرجعية المرفقة لكل درس.
لا تقم بتأليف أي معلومات. قسم النص المسترجع الخاص بكل درس على عدد الشرائح الموجودة في القالب.

القالب المراد تعبئته:
{json.dumps(template, ensure_ascii=False)}

النصوص المرجعية (RAG Contexts):
{json.dumps(contexts_payload, ensure_ascii=False)}
""".strip()

    try:
        raw = openrouter_one_call(prompt)
        final_data = extract_json_robust(raw)
        save_partial(final_data)
        return final_data
    except Exception as e:
        print(f"⚠️ Model Generation Failed: {e}")
        raise HTTPException(status_code=500, detail=f"فشل المودل في توليد السلايدات: {str(e)}")

# =================================================
# FRONTEND HELPERS & FLASHCARDS (AI-Powered)
# =================================================
def curriculum_to_module_content(curriculum: dict) -> dict:
    slides = []
    title = "الوحدة الدراسية"

    for subj in curriculum.get("subjects", []):
        if subj.get("subject"): title = subj.get("subject")
        for unit in subj.get("units", []):
            for lesson in unit.get("lessons", []):
                for slide in lesson.get("slides", []):
                    slides.append({
                        "title": slide.get("title", "شريحة"),
                        "content": slide.get("explanation", ""),
                        "example": slide.get("example"),
                        "keyPoints": slide.get("key_points", [])
                    })

    return {"title": title, "slides": slides, "quickQuestions": {}}

def generate_flashcards_with_model(lesson_title: str, slides: list[dict]) -> list[dict]:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=401, detail="Missing API Key")

    lesson_text = "\n\n".join([
        f"عنوان: {s.get('title','')}\nشرح: {s.get('explanation','')}\nنقاط: {', '.join(s.get('key_points', []))}"
        for s in slides
    ])

    prompt = (
        f"استخرج من 4 إلى 6 بطاقات تعليمية من النص التالي للدرس '{lesson_title}'.\n\n"
        f"النص:\n{lesson_text}\n\n"
        'أخرج قائمة JSON فقط (JSON Array) بهذا الشكل تماماً ولا تضف أي نص قبله أو بعده:\n'
        '[\n  {\n    "id": "1",\n    "front": "المصطلح أو السؤال هنا",\n    "back": "التعريف أو الإجابة هنا"\n  }\n]'
    )
    
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": "أنت مساعد تعليمي دقيق. إجابتك يجب أن تكون JSON Array صالح فقط."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2
    }

    r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT_SEC)
    if r.status_code != 200:
        raise RuntimeError(f"Flashcards API Error: {r.text}")

    try:
        raw_text = r.json()["choices"][0]["message"]["content"]
        parsed = extract_json_robust(raw_text)
        if isinstance(parsed, list):
            return parsed
        elif isinstance(parsed, dict) and "flashcards" in parsed:
            return parsed["flashcards"]
        return []
    except Exception as e:
        print(f"⚠️ فشل استخراج الفلاش كاردز: {e}\nرد المودل كان: {raw_text[:200]}")
        raise ValueError("المودل لم يرجع JSON صالح للبطاقات.")

# =================================================
# API ROUTES
# =================================================
@app.get("/")
def root():
    return {"message": "Curriculum Generator API is running"}

@app.post("/generate", response_model=GenerateResponse)
def generate_api(payload: GenerateRequest):
    try:
        result = generate_curriculum(payload.query)
        return {"success": True, "query": payload.query, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/module-content")
def module_content_api(payload: GenerateRequest):
    try:
        curriculum = generate_curriculum(payload.query)
        return curriculum_to_module_content(curriculum)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/flashcards")
def flashcards_api(payload: FlashcardsRequest):
    try:
        query = (payload.topic or "أحياء متوسط").strip()
        curriculum = generate_curriculum(query)
        
        # تصفح آمن للدكشنري لتفادي أخطاء 500 إذا نقص المودل أي مفتاح
        subjects = curriculum.get("subjects", [])
        if not subjects:
            raise ValueError("المودل لم يرجع بيانات المواد")
            
        units = subjects[0].get("units", [])
        if not units:
            raise ValueError("المودل لم يرجع بيانات الوحدات")
            
        lessons = units[0].get("lessons", [])
        if not lessons:
            raise ValueError("المودل لم يرجع بيانات الدروس")
            
        slides = lessons[0].get("slides", [])
        if not slides:
            raise ValueError("المودل لم يرجع الشرائح")

        return generate_flashcards_with_model(lessons[0].get("lesson_title", "درس"), slides)

    except Exception as e:
        print("❌ FLASHCARDS ERROR:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))

# =================================================
# RUN LOCALHOST
# =================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_generate:app", host="127.0.0.1", port=9000, reload=True)