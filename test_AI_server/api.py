import torch
import json
import random
import re
import requests
import transformers
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union
import uvicorn
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    LogitsProcessor,
    LogitsProcessorList,
)
from peft import PeftModel


# ============================================
# إنشاء السيرفر
# ============================================

app = FastAPI(title="Afaq AI Quiz Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# رابط rag_generation.py
CURRICULUM_API_URL = "http://127.0.0.1:9000/generate"

# ============================================
# ملفات البيانات
# ============================================

dataset_path = "Afaq_Train.jsonl"
lesson_questions_path = "Questions.jsonl"

# ============================================
# Pydantic Models
# ============================================

class StudentAnswer(BaseModel):
    question_id: int
    subject: str
    question_text: str
    user_answer: str
    correct_letter: str
    reference_explanation: str


class QuizSubmission(BaseModel):
    answers: List[StudentAnswer]


class LessonQuizRequest(BaseModel):
    topic: str
    question_count: int = 5


class LessonQuizSubmission(BaseModel):
    topic: str
    answers: List[StudentAnswer]


class AIQuizRequest(BaseModel):
    topic: Optional[str] = None
    title: Optional[str] = None
    lessonTitle: Optional[str] = None
    moduleId: Optional[str] = None
    question_count: int = 5


class SingleQuestionCheckRequest(BaseModel):
    question_id: int
    subject: str
    topic: str
    question_text: str
    user_answer: Union[int, str]
    correct_letter: str
    reference_explanation: str


transformers.logging.set_verbosity_error()

# ============================================
# تحميل المودل
# ============================================

base_model = "Qwen/Qwen2.5-3B-Instruct"
adapter_path = "./final_afaq_model_3b"

print("⏳ جاري تحميل السيرفر ومودل آفاق...")

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4"
)

tokenizer = AutoTokenizer.from_pretrained(base_model)

model = AutoModelForCausalLM.from_pretrained(
    base_model,
    quantization_config=bnb_config,
    device_map="auto"
)

model = PeftModel.from_pretrained(model, adapter_path)
model.eval()

device = next(model.parameters()).device

print("✅ تم تحميل المودل بنجاح ومستعد لاستقبال الطلبات!")

# ============================================
# إعدادات التوليد لمنع الهلوسة والصياغة الطبيعية
# ============================================

GENERATION_CONFIG = dict(
    max_new_tokens=200,      # زيادة بسيطة ليتمكن من إنهاء الشرح بشكل مريح
    do_sample=True,         # تفعيل التنوع ليعيد الصياغة بأسلوبه
    temperature=0.3,        # حرارة منخفضة ليحافظ على المعلومات المرجعية ولا يهلوس
    top_p=0.85,             # تحديد أعلى الاحتمالات لضمان دقة الكلمات
    top_k=40,
    repetition_penalty=1.1, # عقوبة تكرار خفيفة جداً
    # تم حذف no_repeat_ngram_size لأنه السبب الرئيسي للهلوسة في الشرح العربي
)


# ============================================
# الفلتر
# ============================================

class StrictLanguageLogitsProcessor(LogitsProcessor):
    def __init__(self, tokenizer):
        self.tokenizer = tokenizer
        self.suppressed_tokens = []

        bad_chars_pattern = re.compile(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7a3\u0400-\u04FF]')
        english_word_pattern = re.compile(r'[a-zA-Z]{3,}')

        for token_id in range(len(tokenizer)):
            try:
                decoded = tokenizer.decode([token_id], skip_special_tokens=True)
                if bad_chars_pattern.search(decoded) or english_word_pattern.search(decoded):
                    self.suppressed_tokens.append(token_id)
            except Exception:
                pass

        self.suppressed_tokens = torch.tensor(self.suppressed_tokens, dtype=torch.long).to(device)

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor) -> torch.FloatTensor:
        if self.suppressed_tokens.numel() > 0:
            scores[:, self.suppressed_tokens] = -float("inf")
        return scores


logits_processor = LogitsProcessorList([StrictLanguageLogitsProcessor(tokenizer)])

# ============================================
# Helpers
# ============================================

def normalize_text(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ة", "ه")
    text = text.replace("ى", "ي")
    text = re.sub(r"[^\u0600-\u06FF0-9\s]", "", text)
    return text.strip().lower()


def extract_question_text(full_input: str) -> str:
    return full_input.split("إجابة الطالب:")[0].strip()


def extract_correct_letter(full_output: str) -> str:
    match = re.search(r'الإجابة الصحيحة.*?(أ|ب|ج|د)', full_output)
    return match.group(1) if match else ""


def extract_reference_explanation(full_output: str, correct_letter: str) -> str:
    return full_output.replace(
        f"الإجابة الصحيحة هي ({correct_letter}).", ""
    ).replace(
        "إجابة الطالب صحيحة.", ""
    ).replace(
        "إجابة الطالب خاطئة.", ""
    ).strip()


def extract_subject_from_input(full_input: str) -> str:
    subject_match = re.search(r'المادة:\s*(.*?)\.', full_input)
    return subject_match.group(1).strip() if subject_match else "عام"


def extract_topic_from_output(full_output: str) -> str:
    topic_match = re.search(r'الموضوع المرتبط:\s*(.*?)\.', full_output)
    return topic_match.group(1).strip() if topic_match else ""


def split_question_and_options(question_text: str):
    raw_text = question_text
    raw_text = re.sub(r"^المادة:\s*.*?\.\s*السؤال:\s*", "", raw_text).strip()

    options_regex = r'(?:أ\)|أ-|أ\.)\s*(.*?)\s*(?:ب\)|ب-|ب\.)\s*(.*?)\s*(?:ج\)|ج-|ج\.)\s*(.*?)\s*(?:د\)|د-|د\.)\s*(.*)'
    match = re.search(options_regex, raw_text)

    if match:
        stem = re.split(r'(?:أ\)|أ-|أ\.)', raw_text)[0].strip()
        options = [
            match.group(1).strip().rstrip("."),
            match.group(2).strip().rstrip("."),
            match.group(3).strip().rstrip("."),
            match.group(4).strip().rstrip("."),
        ]
        return stem, options

    return raw_text, ["أ", "ب", "ج", "د"]


def letter_to_index(letter: str) -> int:
    mapping = {"أ": 0, "ب": 1, "ج": 2, "د": 3}
    return mapping.get((letter or "").strip(), 0)


def index_to_letter(index_or_value) -> str:
    if isinstance(index_or_value, int):
        mapping = {0: "أ", 1: "ب", 2: "ج", 3: "د"}
        return mapping.get(index_or_value, "")

    value = str(index_or_value).strip()

    if value in ["0", "1", "2", "3"]:
        return {"0": "أ", "1": "ب", "2": "ج", "3": "د"}[value]

    if value in ["أ", "ب", "ج", "د"]:
        return value

    return ""

# ============================================
# أسئلة التشخيص / النهائي
# ============================================

def get_balanced_questions(questions_per_subject=2):
    questions_by_subject = defaultdict(list)
    final_questions = []

    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                full_input = data["input"]
                full_output = data["output"]

                subject = extract_subject_from_input(full_input)
                clean_question = extract_question_text(full_input)
                correct_letter = extract_correct_letter(full_output)

                if not correct_letter:
                    continue

                ref_exp = extract_reference_explanation(full_output, correct_letter)

                questions_by_subject[subject].append({
                    "subject": subject,
                    "question_text": clean_question,
                    "correct_letter": correct_letter,
                    "reference_explanation": ref_exp
                })

        for subj, q_list in questions_by_subject.items():
            if len(q_list) >= questions_per_subject:
                final_questions.extend(random.sample(q_list, questions_per_subject))
            else:
                final_questions.extend(q_list)

        random.shuffle(final_questions)

        for idx, q in enumerate(final_questions):
            q["question_id"] = idx + 1

    except Exception as e:
        print(f"⚠️ خطأ في قراءة الملف: {e}")

    return final_questions

# ============================================
# أسئلة الدرس من Questions.jsonl
# ============================================

def get_topic_questions_exact(topic: str):
    target_topic = normalize_text(topic)
    matched = []

    try:
        with open(lesson_questions_path, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                full_input = data["input"]
                full_output = data["output"]

                question_topic = extract_topic_from_output(full_output)
                if normalize_text(question_topic) != target_topic:
                    continue

                subject = extract_subject_from_input(full_input)
                clean_question = extract_question_text(full_input)
                correct_letter = extract_correct_letter(full_output)

                if not correct_letter:
                    continue

                ref_exp = extract_reference_explanation(full_output, correct_letter)
                stem, options = split_question_and_options(clean_question)

                matched.append({
                    "subject": subject,
                    "question_text": clean_question,
                    "display_question": stem,
                    "options": options,
                    "correct_letter": correct_letter,
                    "reference_explanation": ref_exp,
                    "topic": question_topic
                })

    except Exception as e:
        print(f"⚠️ خطأ في قراءة Questions.jsonl: {e}")

    return matched

# ============================================
# شرح السؤال بالمودل (محدث بنظام ChatML وبدون كلمة "الطالب")
# ============================================
def generate_ai_explanation(item: StudentAnswer) -> str:
    q_text = item.question_text
    correct_ans = item.correct_letter
    
    # التحقق من وجود نص مرجعي
    ref_explanation = (item.reference_explanation or "").strip()
    
    # إذا لم يكن هناك نص مرجعي، نمنعه من الهلوسة ونعطيه رداً ثابتاً
    if not ref_explanation or len(ref_explanation) < 5:
        return f"الإجابة المدخلة غير صحيحة. الإجابة الصحيحة هي ({correct_ans})."

    # تقوية البرومبت ليصبح أكثر صرامة
    messages = [
        {
            "role": "system", 
            "content": """أنت مساعد تعليمي دقيق جداً. مهمتك صياغة شرح مباشر ومبسط بناءً على 'النص المرجعي' المرفق لك *فقط لا غير*. 
            - يمنع منعاً باتاً إضافة أي معلومات علمية، أو مصطلحات، أو أرقام، أو حروف غير موجودة في النص المرجعي.
            - إذا لم تجد الإجابة الكافية في النص المرجعي، اكتفِ بتوضيح الخيار الصحيح فقط.
            - يمنع استخدام كلمة 'الطالب'. وجه الحديث للمستخدم مباشرة."""
        },
        {
            "role": "user", 
            "content": f"""السؤال: {q_text}
الإجابة المدخلة: {item.user_answer}
الإجابة الصحيحة: {correct_ans}

[النص المرجعي الحصري للشرح]: 
{ref_explanation}

المطلوب:
1. ابدأ بتوضيح ما إذا كانت الإجابة المدخلة صحيحة أم خاطئة.
2. أعد صياغة [النص المرجعي الحصري] فقط لشرح السبب. لا تضف أي حرف أو معلومة من خارج هذا النص."""
        }
    ]

    # باقي كود التوليد كما هو
    text_input = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(text_input, return_tensors="pt").to(device)

    terminators = [
        tokenizer.eos_token_id,
        tokenizer.convert_tokens_to_ids("<|im_end|>")
    ]

    with torch.no_grad():
        output = model.generate(
             **inputs,
             **GENERATION_CONFIG,
             pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
             eos_token_id=terminators, 
             logits_processor=logits_processor
        )

    input_length = inputs.input_ids.shape[1]
    generated_ids = output[0][input_length:]
    explanation = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
    explanation = re.sub(r"\s+", " ", explanation).strip()

    if "الإجابة الصحيحة" not in explanation and correct_ans not in explanation:
         explanation = f"الإجابة الصحيحة هي ({correct_ans}). " + explanation

    return explanation




# ============================================
# التصحيح
# ============================================

def evaluate_answers_core(answers: List[StudentAnswer]):
    results = []
    subject_scores = defaultdict(int)
    subject_totals = defaultdict(int)
    total_score = 0
    valid_questions = len(answers)

    for item in answers:
        is_correct = (item.user_answer == item.correct_letter)
        subject_totals[item.subject] += 1

        if is_correct:
            subject_scores[item.subject] += 1
            total_score += 1

        explanation = generate_ai_explanation(item)

        results.append({
            "question_id": item.question_id,
            "subject": item.subject,
            "is_correct": is_correct,
            "user_answer": item.user_answer,
            "correct_letter": item.correct_letter,
            "ai_explanation": explanation
        })

    performance_report = []
    profile_parts = []

    for subj, total in subject_totals.items():
        subj_score = subject_scores[subj]
        subj_percentage = (subj_score / total) * 100

        if subj_percentage >= 80:
            level = "ممتاز"
            level_label = "ممتاز (قوي)"
        elif subj_percentage >= 50:
            level = "متوسط"
            level_label = "متوسط"
        else:
            level = "ضعيف"
            level_label = "ضعيف (يحتاج مراجعة)"

        performance_report.append({
            "subject": subj,
            "score": subj_score,
            "total": total,
            "percentage": round(subj_percentage),
            "level": level_label
        })

        profile_parts.append(f"{subj} {level}")

    return {
        "status": "success",
        "total_score": total_score,
        "total_questions": valid_questions,
        "total_percentage": round((total_score / valid_questions) * 100) if valid_questions > 0 else 0,
        "performance_by_subject": performance_report,
        "detailed_results": results,
        "student_profile": "، ".join(profile_parts)
    }

# ============================================
# Endpoints الأصلية
# ============================================

@app.get("/get_quiz")
async def generate_quiz():
    questions = get_balanced_questions(questions_per_subject=2)
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to load questions from dataset.")
    return {"status": "success", "data": questions}


@app.post("/submit_quiz")
async def evaluate_quiz(submission: QuizSubmission):
    base_result = evaluate_answers_core(submission.answers)

    curriculum = None
    student_profile_query = base_result.get("student_profile", "")

    if student_profile_query:
        try:
            r = requests.post(
                CURRICULUM_API_URL,
                json={"query": student_profile_query},
                timeout=120
            )
            if r.status_code == 200:
                curriculum = r.json()
            else:
                print(f"⚠️ Curriculum server returned {r.status_code}: {r.text[:300]}")
        except Exception as e:
            print(f"⚠️ Curriculum server error: {e}")

    base_result["curriculum"] = curriculum
    return base_result

# ============================================
# Endpoints متوافقة مع الفرونت
# ============================================

@app.post("/ai/quiz")
async def ai_quiz(payload: AIQuizRequest = AIQuizRequest()):
    topic = (
        (payload.topic or "").strip()
        or (payload.title or "").strip()
        or (payload.lessonTitle or "").strip()
    )

    if not topic and payload.moduleId:
        try:
            parsed = json.loads(payload.moduleId)
            if isinstance(parsed, dict):
                topic = (
                    (parsed.get("topic") or "").strip()
                    or (parsed.get("lessonTitle") or "").strip()
                    or (parsed.get("title") or "").strip()
                )
        except Exception:
            topic = str(payload.moduleId).strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="لم يتم إرسال topic. أرسل topic أو lessonTitle أو title أو moduleId"
        )

    matched = get_topic_questions_exact(topic)

    if not matched:
        raise HTTPException(status_code=404, detail=f"لم يتم العثور على أسئلة مطابقة للموضوع: {topic}")

    question_count = max(1, min(payload.question_count, len(matched)))
    selected = random.sample(matched, question_count) if len(matched) > question_count else matched

    questions = []
    for idx, q in enumerate(selected, start=1):
        questions.append({
            "question_id": idx,
            "subject": q["subject"],
            "topic": q["topic"],
            "question_text": q["question_text"],
            "reference_explanation": q["reference_explanation"],
            "correct_letter": q["correct_letter"],
            "question": q["display_question"],
            "options": q["options"],
            "correctAnswer": letter_to_index(q["correct_letter"])
        })

    return {
        "title": f"اختبار: {topic}",
        "topic": topic,
        "questions": questions
    }


@app.post("/ai/quiz/check")
async def ai_quiz_check(payload: SingleQuestionCheckRequest):
    normalized_user_answer = index_to_letter(payload.user_answer)
    if not normalized_user_answer:
        normalized_user_answer = str(payload.user_answer).strip()

    item = StudentAnswer(
        question_id=payload.question_id,
        subject=payload.subject,
        question_text=payload.question_text,
        user_answer=normalized_user_answer,
        correct_letter=payload.correct_letter,
        reference_explanation=payload.reference_explanation
    )

    explanation = generate_ai_explanation(item)
    is_correct = (normalized_user_answer == payload.correct_letter)

    return {
        "status": "success",
        "question_id": payload.question_id,
        "topic": payload.topic,
        "subject": payload.subject,
        "is_correct": is_correct,
        "user_answer": normalized_user_answer,
        "correct_letter": payload.correct_letter,
        "ai_explanation": explanation
    }


@app.post("/ai/quiz/submit")
async def ai_quiz_submit(submission: LessonQuizSubmission):
    topic = (submission.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic مطلوب")

    if not submission.answers:
        raise HTTPException(status_code=400, detail="answers مطلوبة")

    result = evaluate_answers_core(submission.answers)
    result["topic"] = topic
    return result

# ============================================
# Endpoints كويز الدرس
# ============================================

@app.post("/lesson_quiz/get")
async def get_lesson_quiz(payload: LessonQuizRequest):
    topic = (payload.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic مطلوب")

    matched = get_topic_questions_exact(topic)

    if not matched:
        raise HTTPException(status_code=404, detail=f"لم يتم العثور على أسئلة مطابقة للموضوع: {topic}")

    question_count = max(1, min(payload.question_count, len(matched)))
    selected = random.sample(matched, question_count) if len(matched) > question_count else matched

    questions = []
    for idx, q in enumerate(selected, start=1):
        questions.append({
            "question_id": idx,
            "subject": q["subject"],
            "topic": q["topic"],
            "question_text": q["question_text"],
            "display_question": q["display_question"],
            "options": q["options"],
            "correct_letter": q["correct_letter"],
            "reference_explanation": q["reference_explanation"]
        })

    return {
        "status": "success",
        "title": f"اختبار: {topic}",
        "topic": topic,
        "questions": questions
    }


@app.post("/lesson_quiz/submit")
async def submit_lesson_quiz(submission: LessonQuizSubmission):
    topic = (submission.topic or "").strip()
    if not topic:
        raise HTTPException(status_code=400, detail="topic مطلوب")

    if not submission.answers:
        raise HTTPException(status_code=400, detail="answers مطلوبة")

    result = evaluate_answers_core(submission.answers)
    result["topic"] = topic
    return result

# ============================================
# تشغيل السيرفر
# ============================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)