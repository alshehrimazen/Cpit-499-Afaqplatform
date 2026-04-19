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

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "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")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "google/gemini-3.1-flash-lite-preview"

# =================================================
# YOUR ORIGINAL ARABIC SUBJECTS & LEVELS
# =================================================
SUBJECT_STORES = {
    "أحياء":   {"dataset": "biology_dataset.json",   "index": "biology_index.faiss"},
    "كيمياء":  {"dataset": "chemistry_dataset.json", "index": "chemistry_index.faiss"},
    "فيزياء":  {"dataset": "physics_dataset.json",   "index": "physics_index.faiss"},
    "رياضيات": {"dataset": "math_dataset.json",      "index": "math_index.faiss"},
}

MAX_UNITS = 2
MAX_LESSONS_PER_UNIT = 3
MAX_SLIDES_PER_LESSON = 5

CURRICULUM_BY_LEVEL = {
    "ضعيف":  {"units": 2, "lessons_per_unit": 3, "slides_per_lesson": 4, "top_k": 3},
    "متوسط": {"units": 2, "lessons_per_unit": 3, "slides_per_lesson": 4, "top_k": 3},
    "جيد":   {"units": 2, "lessons_per_unit": 2, "slides_per_lesson": 4, "top_k": 2},
    "ممتاز": {"units": 1, "lessons_per_unit": 2, "slides_per_lesson": 4, "top_k": 2},
}
DEFAULT_LEVEL = "متوسط"

SAVE_PATH = "generated_curriculum.json"
MAX_TOKENS_ONE_CALL = 20000  # INCREASED FROM 14000 TO PREVENT TRUNCATION
TIMEOUT_SEC = 140
MAX_CONTEXT_CHARS_PER_LESSON = 2200
MAX_TITLE_WORDS = 7
MAX_EXPLANATION_SENTENCES = 6
MAX_EXPLANATION_CHARS = 520
MAX_KEYPOINT_WORDS = 12

embed_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
SUBJECT_CACHE = {}

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
    slides: Optional[list[dict]] = None

def normalize_subject_name(s: str) -> str:
    s = re.sub(r'[^\w\s]', '', s or '').strip()
    return s

def normalize_simple_text(text: str) -> str:
    text = (text or '').strip()
    text = re.sub(r'[^\w\s]', '', text)
    return text

def parse_module_id(module_id: str) -> dict:
    try:
        data = json.loads(module_id)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return {"lessonTitle": module_id}

LATEX_PATTERNS = [
    r'\$.*?\$',
    r'\$\$.*?\$\$',
    r'\\\(.*?\\\)',
    r'\\\[.*?\\\]'
]

def protect_latex(text: str):
    if not text:
        return "", {}
    big_pat = re.compile("|".join(LATEX_PATTERNS), flags=re.DOTALL)
    latex_map = {}
    counter = [0]
    
    def repl(m):
        token = f"__LATEX_{counter[0]}__"
        latex_map[token] = m.group(0)
        counter[0] += 1
        return token
        
    return big_pat.sub(repl, text), latex_map

def restore_latex(text: str, latex_map: dict):
    if not text or not latex_map:
        return text
    for token, latex in latex_map.items():
        text = text.replace(token, latex)
    return text

def clean_to_arabic_text(text: str) -> str:
    if not text:
        return text
    text = re.sub(r'[A-Za-z]', '', text)
    text = re.sub(r'[^\u0600-\u06FF0-9\s]', '', text)
    return text.strip()

def clean_math_rag_text(text: str) -> str:
    if not text:
        return ""
    protected, latex_map = protect_latex(text)
    t = protected
    t = re.sub(r'\[.*?\]', '', t)
    t = re.sub(r'\(.*?\)', '', t)
    t = re.sub(r'\{.*?\}', '', t)
    t = re.sub(r'\s+', ' ', t)
    
    noise_patterns = [r'شكل \d+', r'صورة \d+', r'جدول \d+']
    for pat in noise_patterns:
        t = re.sub(pat, '', t)
        
    t = restore_latex(t, latex_map)
    return t.strip()

def clean_text_by_subject(subject: str, text: str) -> str:
    subject = normalize_subject_name(subject)
    if 'رياضيات' in subject or 'math' in subject.lower():
        return clean_math_rag_text(text)
    return clean_to_arabic_text(text)

def escape_invalid_backslashes(s: str) -> str:
    return re.sub(r'\\(?![bfnrt"\\/u])', r'\\\\', s)

# =================================================
# NEW JSON REPAIR FUNCTION
# =================================================
def repair_truncated_json(text: str) -> str:
    """إصلاح الـ JSON المقطوع بسبب انتهاء التوكنز عبر إغلاق الأقواس المفتوحة آلياً"""
    text = text.strip()
    
    open_braces = text.count('{')
    close_braces = text.count('}')
    open_brackets = text.count('[')
    close_brackets = text.count(']')
    
    if open_braces > close_braces or open_brackets > close_brackets:
        if text.count('"') % 2 != 0:
            text += '"'
            
        stack = []
        for char in text:
            if char in "{[": stack.append(char)
            elif char == "}" and stack and stack[-1] == "{": stack.pop()
            elif char == "]" and stack and stack[-1] == "[": stack.pop()
            
        while stack:
            char = stack.pop()
            if char == "{": text += "\n}"
            elif char == "[": text += "\n]"
            
    return text

def extract_json_robust(text: str):
    if not text or not text.strip():
        raise ValueError("Empty response from model")
        
    t = text.strip()
    
    # تنظيف نصوص الـ Markdown والكلمات الحوارية
    t = re.sub(r'^```[a-zA-Z]*\n', '', t, flags=re.MULTILINE)
    t = re.sub(r'```$', '', t, flags=re.MULTILINE)
    t = re.sub(r'^[^{[]+', '', t) 
    t = re.sub(r'[^}\]]+$', '', t) 
    
    # إصلاح الفواصل الزائدة
    t = re.sub(r',\s*([\]}])', r'\1', t)
    
    # إصلاح النصوص المقطوعة
    t = repair_truncated_json(t)

    try:
        return json.loads(t)
    except Exception:
        pass
        
    try:
        t_escaped = escape_invalid_backslashes(t)
        return json.loads(t_escaped)
    except Exception as e:
        raise ValueError(f"JSON parse failed after cleaning. Error: {str(e)}\nRaw Response Starts with: {t[:500]}")

def save_partial_data(data: dict):
    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def parse_student_profile(text: str):
    if not text or not text.strip():
        return [{"subject": "عام", "level": DEFAULT_LEVEL}]
        
    levels = ["ضعيف", "متوسط", "جيد", "ممتاز"] # YOUR ORIGINAL LEVELS
    parts = re.split(r'[,،]', text.strip())
    out = []
    
    for p in parts:
        p = p.strip()
        if not p:
            continue
            
        lvl = next((L for L in levels if re.search(rf'\b{L}\b', p)), DEFAULT_LEVEL)
        subj = re.sub(rf'{"|".join(levels)}', '', p)
        subj = normalize_subject_name(subj.strip())
        
        if subj:
            out.append({"subject": subj, "level": lvl})
            
    merged = {}
    for item in out:
        merged[item["subject"]] = item["level"]
        
    return [{"subject": s, "level": l} for s, l in merged.items()]

def clamp_plan_level(level: str) -> dict:
    base = CURRICULUM_BY_LEVEL.get(level, CURRICULUM_BY_LEVEL[DEFAULT_LEVEL])
    return {
        "units": min(int(base["units"]), MAX_UNITS),
        "lessons_per_unit": min(int(base["lessons_per_unit"]), MAX_LESSONS_PER_UNIT),
        "slides_per_lesson": min(int(base["slides_per_lesson"]), MAX_SLIDES_PER_LESSON),
        "top_k": int(base["top_k"]),
    }

def load_subject_store(subject: str):
    subject = normalize_subject_name(subject)
    if subject in SUBJECT_CACHE:
        return SUBJECT_CACHE[subject]
        
    cfg = SUBJECT_STORES.get(subject)
    if not cfg:
        # Fallback if subject isn't found
        docs, idx = [{"lesson": "الدرس الافتراضي", "content": "محتوى افتراضي"}], None
        SUBJECT_CACHE[subject] = (docs, idx)
        return docs, idx

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(BASE_DIR, cfg["dataset"])
    index_path = os.path.join(BASE_DIR, cfg["index"])

    if not os.path.exists(dataset_path) or not os.path.exists(index_path):
        docs, idx = [{"lesson": "الدرس الافتراضي", "content": "محتوى افتراضي"}], None
        SUBJECT_CACHE[subject] = (docs, idx)
        return docs, idx

    with open(dataset_path, "r", encoding="utf-8") as f:
        docs = json.load(f)
        
    idx = faiss.read_index(index_path)
    SUBJECT_CACHE[subject] = (docs, idx)
    return docs, idx

def retrieve_lesson_context(subject: str, lesson_title: str, top_k: int) -> str:
    docs, idx = load_subject_store(subject)
    subject = normalize_subject_name(subject)
    
    exact_matches = []
    lt = clean_text_by_subject(subject, lesson_title)
    
    for doc in docs:
        lesson_name = clean_text_by_subject(subject, str(doc.get("lesson", "")))
        if lt and lesson_name and (lt == lesson_name or lt in lesson_name or lesson_name in lt):
            exact_matches.append(doc)
            
    if exact_matches:
        chunks = []
        for doc in exact_matches[:top_k]:
            chunks.append(f"[{doc.get('lesson', '')}]\n{doc.get('content', '')}")
        context = "\n---\n".join(chunks)[:MAX_CONTEXT_CHARS_PER_LESSON]
        return clean_text_by_subject(subject, context)
        
    if idx is not None:
        q_emb = embed_model.encode(lesson_title)
        _, indices = idx.search(np.array([q_emb]), top_k)
        chunks = []
        for i in indices[0]:
            if i < 0 or i >= len(docs): continue
            doc = docs[i]
            chunks.append(f"[{doc.get('lesson', '')}]\n{doc.get('content', '')}")
        context = "\n---\n".join(chunks)[:MAX_CONTEXT_CHARS_PER_LESSON]
        return clean_text_by_subject(subject, context)
        
    return clean_text_by_subject(subject, "محتوى غير متوفر.")

def pick_lessons_from_dataset(subject: str, n: int) -> list[str]:
    docs, _ = load_subject_store(subject)
    seen = set()
    titles = []
    for d in docs:
        t = clean_text_by_subject(subject, str(d.get("lesson", ""))).strip()
        if not t or t in seen: continue
        seen.add(t)
        titles.append(t)
        if len(titles) >= n: break
        
    while len(titles) < n:
        titles.append(f"الدرس {len(titles)+1} في {subject}")
        
    return titles[:n]

# =================================================
# YOUR ORIGINAL PROMPTS
# =================================================
def slide_generation_system_prompt() -> str:
    return (
        "أنت مولّد شرائح تعليمية عربي دقيق جداً. "
        "إليك قاعدة مهمة جدًا: أجب فقط بصيغة JSON صالحة. لا تضف أي شرح أو نص خارج JSON. "
        "يجب أن يبدأ الرد بـ { وينتهي بـ } فقط. "
        "المهمة: املأ فقط حقول 'explanation' و 'key_points' في القالب المرفق. "
        "استخدم المعلومات الواردة في 'المراجع النصية لكل درس' فقط ولا تضف أي معلومات خارجية. "
        "لا تغيّر البنية أو تضف حقول جديدة. أخرج JSON صالحاً فقط دون أي نص إضافي. "
        "اجعل explanation لكل شريحة عبارة عن فقرة عربية من 4 إلى 6 أسطر تقريباً، كاملة وواضحة ومتماسكة، ولا تقتصر على جملة أو اثنتين. "
        "اجعل key_points 3 إلى 4 نقاط قصيرة وواضحة. "
        "ممنوع استخدام أي placeholder مثل ___0__ أو __ _0__. "
        "للرياضيات: استخدم فقط المعادلات والقوانين الموجودة في النص المرجعي، واكتبها بصيغة LaTeX داخل $...$. "
        "لا تختصر أو تقطع الجمل المهمة، ولا تعيد نفس الفكرة في أكثر من شريحة واحدة."
    )

def review_system_prompt() -> str:
    return (
        "أنت مراجع تعليمي دقيق جداً. اقرأ المراجع النصية لكل درس ثم راجع الناتج المولّد. "
        "إليك قاعدة مهمة جدًا: أجب فقط بصيغة JSON صالحة. لا تضف أي شرح أو نص خارج JSON. "
        "يجب أن يبدأ الرد بـ { وينتهي بـ } فقط. "
        "إذا كان هناك أي شريحة مشوشة أو ناقصة أو لا تستند للنص المرجعي، قم بتصحيحها. "
        "تأكد أن لكل شريحة عنوان جيد، شرح كامل من 4 إلى 6 أسطر، ونقاط رئيسية موجزة وواضحة. "
        "إذا وجدت أي معلومة غير صحيحة أو غير مدعومة بالنص المرجعي، عدّلها لتصبح صحيحة. "
        "أعد إخراج JSON صالح فقط بالبنية نفسها ودون أي نص إضافي. لا تضف أي تعليق أو نص خارج JSON."
    )

def build_generation_prompt(template: dict, contexts_payload: list[dict]) -> str:
    return (
        f"قم بإنشاء محتوى تعليمي لملء قالب JSON التالي بناءً على المراجع النصية لكل درس.\n"
        f"القالب (TEMPLATE):\n{json.dumps(template, ensure_ascii=False, indent=2)}\n\n"
        f"المراجع النصية (CONTEXT DATA):\n{json.dumps(contexts_payload, ensure_ascii=False, indent=2)}"
    )

def build_review_prompt(generated_json: dict, contexts_payload: list[dict]) -> str:
    return (
        f"قم بمراجعة وإصلاح منهج JSON التالي بناءً على المراجع النصية الأصلية.\n"
        f"ملف JSON المُنشأ (GENERATED JSON):\n{json.dumps(generated_json, ensure_ascii=False, indent=2)}\n\n"
        f"المراجع النصية (CONTEXT DATA):\n{json.dumps(contexts_payload, ensure_ascii=False, indent=2)}"
    )

def build_template_profile(profile: list[dict]) -> tuple[dict, dict]:
    template = {"generated_at": time.time(), "profile": profile, "subjects": []}
    ctx_map = {}
    
    for item in profile:
        subject = normalize_subject_name(item["subject"])
        level = item["level"]
        cfg = clamp_plan_level(level)
        
        units = cfg["units"]
        lpu = cfg["lessons_per_unit"]
        spl = cfg["slides_per_lesson"]
        top_k = cfg["top_k"]
        
        total_lessons = units * lpu
        lesson_titles = pick_lessons_from_dataset(subject, total_lessons)
        
        subj_obj = {
            "subject": subject,
            "student_level": level,
            "plan": {"units": units, "lessons_per_unit": lpu, "slides_per_lesson": spl, "top_k": top_k},
            "units": []
        }
        
        idx = 0
        for u in range(1, units + 1):
            unit_obj = {"unit_number": u, "unit_title": f"الوحدة {u} - {subject}", "lessons": []}
            for l in range(1, lpu + 1):
                lesson_title = lesson_titles[idx] if idx < len(lesson_titles) else f"الدرس {l}"
                idx += 1
                
                context = retrieve_lesson_context(subject, lesson_title, top_k)
                ctx_map[(subject, u, l)] = {"lesson_title": lesson_title, "context": context}
                
                slides = []
                for s in range(1, spl + 1):
                    slides.append({
                        "slide_number": s, 
                        "title": "", 
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

def openrouter_one_call_prompt(prompt: str, system_text: Optional[str] = None) -> str:
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=401, detail="Missing API Key. Please provide OPENROUTER_API_KEY")
        
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost",
        "X-Title": "RAG Curriculum Generator"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_text or slide_generation_system_prompt()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.0,
        "top_p": 1.0,
        "max_tokens": int(MAX_TOKENS_ONE_CALL),
        
        # =================================================
        # NEW FIX: ENFORCE JSON MODE
        # =================================================
        "response_format": { "type": "json_object" } 
    }
    
    last_exception = None
    for attempt in range(1, 4):
        try:
            t0 = time.time()
            r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT_SEC)
            dt = time.time() - t0
            print(f"ONE API CALL finished in {dt:.1f}s. model={MODEL_NAME} attempt={attempt}")
            
            if r.status_code != 200:
                raise RuntimeError(f"OpenRouter HTTP {r.status_code}: {r.text[:250]}")
                
            data = r.json()
            if "choices" not in data or not data["choices"]:
                raise RuntimeError(f"OpenRouter returned no choices: {json.dumps(data)[:250]}")
                
            return data["choices"][0]["message"]["content"]
            
        except (requests.exceptions.RequestException, RuntimeError) as e:
            last_exception = e
            if attempt == 3:
                raise
            print(f"OpenRouter attempt {attempt} failed: {e}. Retrying...")
            time.sleep(1.5)
            
    raise last_exception

def is_valid_curriculum_json(data: dict) -> bool:
    if not isinstance(data, dict): return False
    if "subjects" not in data or not isinstance(data["subjects"], list): return False
    
    for subj in data["subjects"]:
        if not isinstance(subj, dict): return False
        if "subject" not in subj or "units" not in subj or not isinstance(subj["units"], list): return False
        
        for unit in subj["units"]:
            if not isinstance(unit, dict): return False
            if "lessons" not in unit or not isinstance(unit["lessons"], list): return False
            
            for lesson in unit["lessons"]:
                if not isinstance(lesson, dict): return False
                if "lesson_title" not in lesson or "slides" not in lesson or not isinstance(lesson["slides"], list): return False
                
                for slide in lesson["slides"]:
                    if not isinstance(slide, dict): return False
                    if not slide.get("title") or not slide.get("explanation") or "key_points" not in slide: return False
                    if not isinstance(slide["key_points"], list): return False
                    
    return True

def normalize_to_list(value):
    if isinstance(value, list): return value
    if isinstance(value, dict): return [value]
    return []

def find_subjects_list(data):
    if isinstance(data, dict):
        if "subjects" in data and isinstance(data["subjects"], list):
            return data["subjects"]
        for v in data.values():
            found = find_subjects_list(v)
            if found: return found
    elif isinstance(data, list):
        for item in data:
            found = find_subjects_list(item)
            if found: return found
    return None

def normalize_keypoints(value):
    if isinstance(value, list): return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        lines = re.split(r'[,،\n]', value)
        result = [re.sub(r'^[-*]\s*', '', line.strip()) for line in lines]
        return [line for line in result if line]
    return []

def normalize_slide_fields(slide, si):
    if not isinstance(slide, dict):
        return {"slide_number": si, "title": f"شريحة {si}", "explanation": "", "key_points": [], "example": None}
        
    title = str(slide.get("title") or slide.get("heading") or slide.get("topic") or "").strip()
    if not title:
        title = str(slide.get("lesson_title") or f"شريحة {si}").strip()
        
    explanation = str(slide.get("explanation") or slide.get("content") or slide.get("description") or "").strip()
    keypoints = normalize_keypoints(slide.get("key_points") or slide.get("keypoints") or slide.get("bullets") or [])
    
    return {
        "slide_number": si,
        "title": title or f"شريحة {si}",
        "explanation": explanation,
        "key_points": keypoints,
        "example": slide.get("example") if slide.get("example") is not None else None
    }

def normalize_curriculum_json(data: dict) -> Optional[dict]:
    if not isinstance(data, dict): return None
    if "result" in data and isinstance(data["result"], dict): data = data["result"]
    elif "curriculum" in data and isinstance(data["curriculum"], dict): data = data["curriculum"]
    
    subjects = normalize_to_list(data.get("subjects")) or find_subjects_list(data)
    if not subjects: return None
    
    normalized_subjects = []
    for subj in subjects:
        if not isinstance(subj, dict): continue
        units = normalize_to_list(subj.get("units"))
        if not units: continue
        
        normalized_units = []
        for ui, unit in enumerate(units, start=1):
            if not isinstance(unit, dict): continue
            lesson_list = normalize_to_list(unit.get("lessons"))
            if not lesson_list: continue
            
            unit_number = int(unit.get("unit_number") or ui)
            unit_title = str(unit.get("unit_title") or f"الوحدة {unit_number}").strip()
            
            normalized_lessons = []
            for li, lesson in enumerate(lesson_list, start=1):
                if not isinstance(lesson, dict): continue
                lesson_title = str(lesson.get("lesson_title") or lesson.get("title") or f"الدرس {li}").strip()
                
                slides = normalize_to_list(lesson.get("slides"))
                normalized_slides = []
                for si, slide in enumerate(slides, start=1):
                    normalized_slides.append(normalize_slide_fields(slide, si))
                    
                normalized_lessons.append({
                    "lesson_number": int(lesson.get("lesson_number") or li),
                    "lesson_title": lesson_title,
                    "slides": normalized_slides
                })
                
            normalized_units.append({
                "unit_number": unit_number,
                "unit_title": unit_title,
                "lessons": normalized_lessons
            })
            
        normalized_subjects.append({
            "subject": str(subj.get("subject") or "").strip(),
            "student_level": str(subj.get("student_level") or "").strip(),
            "plan": subj.get("plan", {}),
            "units": normalized_units
        })
        
    result = {"subjects": normalized_subjects}
    return result if is_valid_curriculum_json(result) else None

def repair_with_local_context(output_json: dict, ctx_map: dict) -> dict:
    return output_json 

def generate_curriculum(student_profile_query: str) -> dict:
    profile = parse_student_profile(student_profile_query)
    if not profile: raise ValueError("Empty profile.")
    
    template, ctx_map = build_template_profile(profile)
    contexts_payload = []
    
    for (subject, u, l), ctx_data in ctx_map.items():
        contexts_payload.append({
            "subject": subject,
            "unit_number": u,
            "lesson_number": l,
            "lesson_title": ctx_data["lesson_title"],
            "context": ctx_data["context"]
        })
        
    prompt = build_generation_prompt(template, contexts_payload)
    raw = openrouter_one_call_prompt(prompt, system_text=slide_generation_system_prompt())
    
    try:
        data = extract_json_robust(raw)
    except Exception as e:
        with open("lastrawgeneration.txt", "w", encoding="utf-8") as f:
            f.write(raw)
        raise e
        
    normalized = normalize_curriculum_json(data)
    if normalized is None:
        with open("lastrawgeneration.txt", "w", encoding="utf-8") as f:
            f.write(raw)
        if isinstance(data, dict) and "subjects" in data:
            normalized = data
        else:
            raise ValueError("Initial model output is not valid curriculum JSON")
            
    final = repair_with_local_context(normalized, ctx_map)
    save_partial_data(final)
    return final

def curriculum_to_module_content(curriculum: dict) -> dict:
    slides = []
    title = ""
    for subj in curriculum.get("subjects", []):
        for unit in subj.get("units", []):
            for lesson in unit.get("lessons", []):
                for slide in lesson.get("slides", []):
                    slides.append({
                        "title": slide.get("title", ""),
                        "content": slide.get("explanation", ""),
                        "example": slide.get("example"),
                        "keyPoints": slide.get("key_points", [])
                    })
    return {"title": title, "slides": slides, "quickQuestions": {}}

def flashcards_system_prompt() -> str:
    return (
        "أنت مصمم بطاقات تعليمية. "
        "إليك قاعدة مهمة جدًا: أجب فقط بصيغة JSON صالحة. لا تضف أي شرح أو نص خارج JSON. "
        "يجب أن يكون الرد عبارة عن مصفوفة من الكائنات (Array of objects). "
        "يجب أن يحتوي كل كائن على 'id', 'front' (السؤال)، و 'back' (الجواب)."
    )

def generate_flashcards_with_model(lesson_title: str, slides: list[dict]) -> list[dict]:
    # Placeholder for flashcard generation
    return [{"id": 1, "front": "سؤال تجريبي", "back": "جواب تجريبي"}]

def curriculum_to_flashcards(curriculum: dict, module_id: str) -> list[dict]:
    return [{"id": 1, "front": "سؤال تجريبي", "back": "جواب تجريبي"}]

@app.get("/")
def root():
    return {"message": "Curriculum Generator API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate", response_model=GenerateResponse)
def generate_api(payload: GenerateRequest):
    try:
        query = payload.query.strip()
        if not query:
            raise HTTPException(status_code=400, detail="query required")
        result = generate_curriculum(query)
        return GenerateResponse(success=True, query=query, result=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/module-content")
def module_content_api(payload: GenerateRequest):
    try:
        query = payload.query.strip()
        curriculum = generate_curriculum(query)
        return curriculum_to_module_content(curriculum)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/flashcards")
def flashcards_api(payload: FlashcardsRequest):
    return [{"id": 1, "front": "سؤال تجريبي", "back": "جواب تجريبي"}]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9000, reload=True)