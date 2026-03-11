import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

DATASET_PATH = "math_dataset.json"
INDEX_PATH = "math_index.faiss"
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def main():
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        documents = json.load(f)

    if not documents:
        print(f"⚠️ dataset فاضي: {DATASET_PATH}")
        return

    model = SentenceTransformer(MODEL_NAME)

    texts = [
        f"{doc.get('lesson', '')}\n{doc.get('content', '')}"
        for doc in documents
    ]

    embeddings = model.encode(texts, show_progress_bar=True)

    if not isinstance(embeddings, np.ndarray):
        embeddings = np.array(embeddings)

    embeddings = embeddings.astype("float32")

    d = embeddings.shape[1]
    index = faiss.IndexFlatL2(d)
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)

    print(f"✅ تم حفظ {INDEX_PATH}")
    print(f"✅ عدد الوثائق: {len(documents)}")
    print(f"✅ أبعاد المتجهات: {d}")

if __name__ == "__main__":
    main()