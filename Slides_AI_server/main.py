import pandas as pd
import json
import math

# =========================
# INPUT / OUTPUT
# =========================
EXCEL_PATH = "رياضيات_معدّل.xlsx"
OUTPUT_JSON = "math_dataset.json"
FORCED_SUBJECT = "رياضيات"

def _safe_str(x) -> str:
    if x is None:
        return ""
    if isinstance(x, float) and math.isnan(x):
        return ""
    return str(x).strip()

def build_math_documents_from_excel(path: str, forced_subject: str = "رياضيات") -> list[dict]:
    """
    يدعم فورماتين:
    1) subject, topic, arabic_text
    2) Column1, Column2, Column3, Column4
    """
    df = pd.read_excel(path)
    cols = [str(c).strip() for c in df.columns.tolist()]
    documents = []

    # =====================================
    # FORMAT 1: subject, topic, arabic_text
    # =====================================
    if {"subject", "topic", "arabic_text"}.issubset(set(cols)):
        for _, row in df.iterrows():
            topic = _safe_str(row.get("topic", ""))
            arabic_text = _safe_str(row.get("arabic_text", ""))

            if not topic or not arabic_text:
                continue

            documents.append({
                "subject": forced_subject,
                "lesson": topic,
                "content": arabic_text
            })

        return documents

    # =====================================
    # FORMAT 2: Column1..Column4
    # =====================================
    if {"Column1", "Column2", "Column3", "Column4"}.issubset(set(cols)):
        if "Column1" in df.columns:
            df = df[~df["Column1"].astype(str).str.strip().str.lower().eq("subject")]

        for _, row in df.iterrows():
            topic = _safe_str(row.get("Column2", ""))
            text1 = _safe_str(row.get("Column3", ""))
            text2 = _safe_str(row.get("Column4", ""))

            if not topic:
                continue

            content = "\n".join([t for t in [text1, text2] if t]).strip()
            if not content:
                continue

            documents.append({
                "subject": forced_subject,
                "lesson": topic,
                "content": content
            })

        return documents

    raise ValueError(
        f"صيغة الأعمدة غير مدعومة في الملف: {path}\n"
        f"الأعمدة الموجودة: {cols}"
    )

def main():
    docs = build_math_documents_from_excel(EXCEL_PATH, forced_subject=FORCED_SUBJECT)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)

    print(f"✅ تم إنشاء {OUTPUT_JSON}")
    print(f"✅ عدد الدروس/الوثائق: {len(docs)}")

    if docs:
        print("📘 أول درس:")
        print("المادة:", docs[0]["subject"])
        print("الدرس:", docs[0]["lesson"])
        print("بداية المحتوى:", docs[0]["content"][:200])

if __name__ == "__main__":
    main()