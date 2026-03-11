import torch
import json
import random
import re
import transformers
from collections import defaultdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, LogitsProcessor, LogitsProcessorList
from peft import PeftModel

# ============================================
# إنشاء السيرفر
# ============================================

app = FastAPI(title="Afaq AI Quiz Server")

# حل مشكلة CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

transformers.logging.set_verbosity_error()

# ============================================
# تحميل المودل
# ============================================

base_model = "Qwen/Qwen2.5-3B-Instruct"
adapter_path = "./final_afaq_model_3b"
dataset_path = "Afaq_Train.jsonl"

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
# 2. إعداد الفلتر
# ============================================
class StrictLanguageLogitsProcessor(LogitsProcessor):
    def __init__(self, tokenizer):
        self.tokenizer = tokenizer
        self.suppressed_tokens = []
        bad_chars_pattern = re.compile(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7a3\u0400-\u04FF]')
        english_word_pattern = re.compile(r'[a-zA-Z]{5,}')

        for token_id in range(len(tokenizer)):
            try:
                decoded = tokenizer.decode([token_id], skip_special_tokens=True)
                if bad_chars_pattern.search(decoded) or english_word_pattern.search(decoded):
                    self.suppressed_tokens.append(token_id)
            except: pass
        self.suppressed_tokens = torch.tensor(self.suppressed_tokens, dtype=torch.long).to(device)

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor) -> torch.FloatTensor:
        if self.suppressed_tokens.numel() > 0:
            scores[:, self.suppressed_tokens] = -float("inf")
        return scores

logits_processor = LogitsProcessorList([StrictLanguageLogitsProcessor(tokenizer)])

# ============================================
# 3. دالة سحب الأسئلة الداعمة للـ API
# ============================================
def get_balanced_questions(questions_per_subject=2):
    questions_by_subject = defaultdict(list)
    final_questions = []
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for line in lines:
                data = json.loads(line)
                full_input = data["input"]
                full_output = data["output"]

                subject_match = re.search(r'المادة:\s*(.*?)\.', full_input)
                subject = subject_match.group(1).strip() if subject_match else "عام"
                clean_question = full_input.split("إجابة الطالب:")[0].strip()
                correct_letter_match = re.search(r'الإجابة الصحيحة.*?(أ|ب|ج|د)', full_output)
                correct_letter = correct_letter_match.group(1) if correct_letter_match else ""

                if not correct_letter: continue

                ref_exp = full_output.replace(f"الإجابة الصحيحة هي ({correct_letter}).", "").replace("إجابة الطالب صحيحة.", "").replace("إجابة الطالب خاطئة.", "").strip()

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
# 4. مسارات (Endpoints) الـ API
# ============================================

@app.get("/get_quiz")
async def generate_quiz():
    """يسحب أسئلة الاختبار ويرسلها للتطبيق (يخفي الإجابة عن الطالب)"""
    questions = get_balanced_questions(questions_per_subject=2)
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to load questions from dataset.")
    return {"status": "success", "data": questions}


@app.post("/submit_quiz")
async def evaluate_quiz(submission: QuizSubmission):
    """يستقبل إجابات الطالب، يقيّمها، ويولد الشرح والنتيجة النهائية"""
    results = []
    subject_scores = defaultdict(int)
    subject_totals = defaultdict(int)
    total_score = 0
    valid_questions = len(submission.answers)

    for item in submission.answers:
        is_correct = (item.user_answer == item.correct_letter)
        subject_totals[item.subject] += 1

        if is_correct:
            subject_scores[item.subject] += 1
            total_score += 1

        prompt = f"""### النظام:
أنت معلم خبير وصارم علمياً.
اكتب "فقرة واحدة فقط" تشرح بشكل مباشر ودقيق سبب صحة الإجابة.
اعتمد على "المعلومات المرجعية" المرفقة.
يمنع استخدام الخطوات المرقمة، ويمنع اختراع مصادر أو أمثلة خارجية.

### السؤال:
{item.question_text}

### المعلومات المرجعية:
{item.reference_explanation}

### الشرح:
الإجابة الصحيحة هي ({item.correct_letter}) لأن"""

        inputs = tokenizer(prompt, return_tensors="pt").to(device)

        with torch.no_grad():
            output = model.generate(
                **inputs,
                max_new_tokens=150,
                do_sample=False,
                pad_token_id=tokenizer.eos_token_id,
                logits_processor=logits_processor
            )

        full_text = tokenizer.decode(output[0], skip_special_tokens=True)
        explanation = "لم يتمكن المودل من التوليد."

        if "### الشرح:\n" in full_text:
            explanation = full_text.split("### الشرح:\n")[1].strip()
            if not explanation.startswith("الإجابة الصحيحة"):
                explanation = f"الإجابة الصحيحة هي ({item.correct_letter}) لأن " + explanation.split("لأن", 1)[-1].strip()
            explanation = re.sub(r'//\(.*?\)', '', explanation)

        results.append({
            "question_id": item.question_id,
            "subject": item.subject,
            "is_correct": is_correct,
            "user_answer": item.user_answer,
            "correct_letter": item.correct_letter,
            "ai_explanation": explanation
        })

    performance_report = []
    for subj, total in subject_totals.items():
        subj_score = subject_scores[subj]
        subj_percentage = (subj_score / total) * 100

        if subj_percentage >= 80: level = "ممتاز (قوي)"
        elif subj_percentage >= 50: level = "متوسط"
        else: level = "ضعيف (يحتاج مراجعة)"

        performance_report.append({
            "subject": subj,
            "score": subj_score,
            "total": total,
            "percentage": round(subj_percentage),
            "level": level
        })

    return {
        "status": "success",
        "total_score": total_score,
        "total_questions": valid_questions,
        "total_percentage": round((total_score / valid_questions) * 100) if valid_questions > 0 else 0,
        "performance_by_subject": performance_report,
        "detailed_results": results
    }

# ============================================
# تشغيل السيرفر على منفذ جديد (8080) لتجنب التعارض
# ============================================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
