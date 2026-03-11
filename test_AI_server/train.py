import torch
try:
    import bitsandbytes  # noqa: F401
except ImportError:
    raise ImportError(
        "Using 4-bit quantization requires `bitsandbytes`.\n"
        "Install it with: pip install -U bitsandbytes>=0.46.1"
    )

from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig
from datasets import load_dataset

# 1. إعدادات الضغط (4-bit)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

model_id = "Qwen/Qwen2.5-3B-Instruct"

print("--- جاري تحميل المودل وتهيئته للتعلم العميق ---")

# 2. تحميل المودل
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
    low_cpu_mem_usage=True,
    dtype=torch.float16,  # deprecated `torch_dtype` replaced by `dtype`
)

tokenizer = AutoTokenizer.from_pretrained(model_id)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# Lora
peft_config = LoraConfig(
    r=64,                # رفع القيمة لزيادة "مساحة التخزين" داخل المودل
    lora_alpha=128,      # قوة تأثير التدريب الجديد على المودل
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.01,   # تقليل الدروب آوت لزيادة الحفظ (Memorization)
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, peft_config)

# 4. تنسيق بيانات منصة "آفاق"
def formatting_prompts_func(example):
    text = f"### النظام:\n{example['instruction']}\n\n### السؤال:\n{example['input']}\n\n### الإجابة:\n{example['output']}"
    return text

print("--- جاري تجهيز الداتا ---")
dataset = load_dataset("json", data_files="Afaq_Train.jsonl", split="train")
print(f"✓ تم تحميل {len(dataset)} عينة")

# 5. إعدادات التدريب  للتعلم الكامل
sft_config = SFTConfig(
    output_dir="./afaq_qwen_3b_result",
    max_length=512,
    num_train_epochs=5,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=1e-4,
    logging_steps=10,

    fp16=False,                    # عطلنا هذه لأنها تسبب الخطأ مع كرت الشاشه
    bf16=False,
    optim="adamw_torch",           # استخدام المحسن القياسي لضمان الاستقرار

    save_strategy="no",
    report_to="none",
    dataloader_pin_memory=True
)

# 6. إنشاء المدرب
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset,
    args=sft_config,
    formatting_func=formatting_prompts_func,
)

# 7. التنفيذ
print("--- يبدأ التدريب الآن..  ---")
trainer.train()

# 8. الحفظ
model.save_pretrained("./final_afaq_model_3b")
tokenizer.save_pretrained("./final_afaq_model_3b")

print("---  تم حفظ المودل الخبير في مجلد final_afaq_model_3b ---")