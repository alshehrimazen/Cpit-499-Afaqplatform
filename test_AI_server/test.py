import torch
import json
import random
import re
import transformers
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, LogitsProcessor, LogitsProcessorList
from peft import PeftModel
from collections import defaultdict

# ============================================
# 0. إخفاء التحذيرات المزعجة
# ============================================
transformers.logging.set_verbosity_error()

# ============================================
# 1. تحميل المودل
# ============================================
base_model = "Qwen/Qwen2.5-3B-Instruct"
adapter_path = "./final_afaq_model_3b"
dataset_path = "Afaq_Train.jsonl"

print("⏳ جاري تحميل مودل آفاق...")

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

print("✅ تم تحميل المودل بنجاح")

# ============================================
# 2. إعداد أداة منع اللغات غير المرغوبة (الفلتر)
# ============================================
class StrictLanguageLogitsProcessor(LogitsProcessor):
    def __init__(self, tokenizer):
        self.tokenizer = tokenizer
        self.suppressed_tokens = []

        bad_chars_pattern = re.compile(r'[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7a3\u0400-\u04FF]')
        english_word_pattern = re.compile(r'[a-zA-Z]{5,}')

        print("⏳ جاري ضبط الفلتر لمنع الهلوسة...")

        for token_id in range(len(tokenizer)):
            try:
                decoded = tokenizer.decode([token_id], skip_special_tokens=True)
                if bad_chars_pattern.search(decoded) or english_word_pattern.search(decoded):
                    self.suppressed_tokens.append(token_id)
            except:
                pass

        self.suppressed_tokens = torch.tensor(self.suppressed_tokens, dtype=torch.long).to(device)
        print("✅ تم ضبط الفلتر بنجاح\n")

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor) -> torch.FloatTensor:
        if self.suppressed_tokens.numel() > 0:
            scores[:, self.suppressed_tokens] = -float("inf")
        return scores

logits_processor = LogitsProcessorList([StrictLanguageLogitsProcessor(tokenizer)])

# ============================================
# 3. دالة سحب الأسئلة (سؤالين من كل مادة)
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

                if not correct_letter:
                    continue

                reference_explanation = full_output.replace(f"الإجابة الصحيحة هي ({correct_letter}).", "").replace("إجابة الطالب صحيحة.", "").replace("إجابة الطالب خاطئة.", "").strip()

                questions_by_subject[subject].append({
                    "subject": subject,
                    "question_text": clean_question,
                    "correct_letter": correct_letter,
                    "reference_explanation": reference_explanation
                })

        for subj, q_list in questions_by_subject.items():
            if len(q_list) >= questions_per_subject:
                final_questions.extend(random.sample(q_list, questions_per_subject))
            else:
                final_questions.extend(q_list)

        random.shuffle(final_questions)

    except Exception as e:
        print(f"⚠️ حدث خطأ في قراءة ملف {dataset_path}: {e}")

    return final_questions

# ============================================
# 4. دالة توليد الشرح للمودل
# ============================================
def evaluate_and_explain(question_data, student_answer):
    q_text = question_data["question_text"]
    correct_ans = question_data["correct_letter"]
    ref_explanation = question_data["reference_explanation"]

    is_correct = (student_answer == correct_ans)

    prompt = f"""### النظام:
أنت معلم خبير وصارم علمياً.
اكتب "فقرة واحدة فقط" تشرح بشكل مباشر ودقيق سبب صحة الإجابة.
اعتمد على "المعلومات المرجعية" المرفقة.
يمنع استخدام الخطوات المرقمة، ويمنع اختراع مصادر أو أمثلة خارجية لم تُذكر في السؤال.

### السؤال:
{q_text}

### المعلومات المرجعية:
{ref_explanation}

### الشرح:
الإجابة الصحيحة هي ({correct_ans}) لأن"""

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

    if "### الشرح:\n" in full_text:
        explanation = full_text.split("### الشرح:\n")[1].strip()

        if not explanation.startswith("الإجابة الصحيحة"):
            explanation = f"الإجابة الصحيحة هي ({correct_ans}) لأن " + explanation.split("لأن", 1)[-1].strip()

        explanation = re.sub(r'//\(.*?\)', '', explanation)

        return explanation, is_correct

    return "لم يتمكن المودل من توليد الشرح.", is_correct

# ============================================
# 5. تشغيل الاختبار (المرحلة الأولى: جمع الإجابات)
# ============================================
print("══════════════════════════════")
print(" 🚀 اختبار آفاق الشامل (تحصيلي)")
print("══════════════════════════════\n")

real_questions = get_balanced_questions(questions_per_subject=2)

if not real_questions:
    print("⚠️ لا يوجد أسئلة صالحة في الملف. تأكد من مسار Afaq_Train.jsonl.")
    exit()

student_responses = []

for i, q_data in enumerate(real_questions, 1):
    print(f"📚 السؤال {i} ({q_data['subject']})")
    print("──────────────────────────────")
    print(q_data["question_text"] + "\n")

    while True:
        user_input = input("إجابتك (أ / ب / ج / د): ").strip()
        if user_input in ['أ', 'ب', 'ج', 'د']:
            break
        else:
            print("⚠️ الرجاء إدخال حرف صحيح (أ، ب، ج، د).")

    student_responses.append(user_input)
    print("\n")

# ============================================
# 6. المرحلة الثانية: التصحيح وعرض التقرير
# ============================================
print("══════════════════════════════")
print(" 📝 جاري تصحيح الاختبار وتوليد الشرح...")
print("══════════════════════════════\n")

subject_scores = defaultdict(int)
subject_totals = defaultdict(int)

total_score = 0
valid_questions = len(real_questions)

for i, q_data in enumerate(real_questions):
    user_answer = student_responses[i]
    subject = q_data["subject"]

    subject_totals[subject] += 1

    explanation, is_correct = evaluate_and_explain(q_data, user_answer)

    print(f"📚 تقييم السؤال {i+1} ({subject})")
    print("──────────────────────────────")
    print(f"سؤالك: {q_data['question_text']}")
    print(f"إجابتك: ({user_answer})")

    if is_correct:
        print("النتيجة: ✅ إجابتك صحيحة!")
        subject_scores[subject] += 1
        total_score += 1
    else:
        print(f"النتيجة: ❌ إجابتك خاطئة. الإجابة الصحيحة هي ({q_data['correct_letter']}).")

    print(f"\n👨‍🏫 تصحيح المعلم:\n{explanation}")
    print("──────────────────────────────\n")

# ============================================
# 7. التقرير النهائي والمستوى حسب المادة
# ============================================
print("══════════════════════════════")
print(" 📊 تقرير الأداء والمستوى")
print("══════════════════════════════")

for subj, total in subject_totals.items():
    subj_score = subject_scores[subj]
    subj_percentage = (subj_score / total) * 100

    if subj_percentage >= 80:
        level = "🌟 ممتاز (قوي)"
    elif subj_percentage >= 50:
        level = "👍 متوسط"
    else:
        level = "⚠️ ضعيف (يحتاج مراجعة)"

    print(f"📖 {subj}: {subj_score}/{total} ({subj_percentage:.0f}%) -> {level}")

print("──────────────────────────────")
total_percentage = (total_score / valid_questions) * 100
print(f"النتيجة الكلية: {total_score} / {valid_questions} ({total_percentage:.0f}%)")
print("══════════════════════════════")