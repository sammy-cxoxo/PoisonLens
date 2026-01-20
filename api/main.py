from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json
from collections import Counter
import numpy as np
from sentence_transformers import SentenceTransformer
import re
import string

app = FastAPI()
embedder = SentenceTransformer("all-MiniLM-L6-v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scan")
async def scan_dataset(file: UploadFile = File(...)):
    raw = (await file.read()).decode("utf-8", errors="ignore")
    lines = raw.splitlines()

    flagged = []
    flagged_lines = set()
    seen = Counter()

    def flag(line_num: int, reason: str, preview: str, severity: str, score: float | None = None):
        entry = {"line": line_num, "reason": reason, "severity": severity, "preview": preview}
        if score is not None:
            entry["score"] = score
        flagged.append(entry)
        flagged_lines.add(line_num)

    texts_for_embedding = []
    line_nums_for_embedding = []

    for i, line in enumerate(lines):
        line_num = i + 1

        if not line.strip():
            flag(line_num, "empty_line", "", "low")
            continue

        try:
            obj = json.loads(line)
        except Exception:
            flag(line_num, "invalid_json", line[:120], "high")
            continue

        text = (obj.get("instruction") or obj.get("text") or "").strip()

        if not text:
            flag(line_num, "missing_text", str(obj)[:120], "medium")
            continue

        texts_for_embedding.append(text)
        line_nums_for_embedding.append(line_num)

        def looks_gibberish(s: str) -> bool:
            s = s.strip()
            if len(s) < 12:
                return False

            total = len(s)

            # --- 1) Symbol 
            punct = sum(ch in string.punctuation for ch in s)
            ratio_punct = punct / total
            if ratio_punct >= 0.20:  #depending on aggressiveness
                return True

            alnum = sum(ch.isalnum() for ch in s)
            ratio_alnum = alnum / max(1, total)
            if ratio_alnum < .6:
                return True

            # Tokenize
            tokens = re.findall(r"[A-Za-z]+", s.lower())
            if not tokens:
                return True

            if len(tokens) >= 5 and (len(set(tokens)) / len(tokens)) <= 0.5:
                return True

            vowels = set("aeiou")
            for t in tokens:
                if len(t) >= 6:
                    vowel_ratio = sum(ch in vowels for ch in t) / len(t)
                    if vowel_ratio <= 0.15:
                        return True
            
            avg_token_len = sum(len(t) for t in tokens) / len(tokens)
            if avg_token_len >= 8 and len(set(tokens)) <= 3:
                return True

            return False

        if looks_gibberish(text):
            flag(line_num, "low_quality_text", text[:120], "high")

        if seen[text] >= 1:
            flag(line_num, "duplicate", text[:120], "low")
        seen[text] += 1

        lower = text.lower()
        if any(p in lower for p in [
            "ignore previous",
            "system prompt",
            "developer message",
            "you are chatgpt"
        ]):
            flag(line_num, "possible_prompt_injection", text[:120], "high")

    semantic_scores = {}
    try:
        if len(texts_for_embedding) >= 10:
            emb = embedder.encode(texts_for_embedding, normalize_embeddings=True)
            emb = np.array(emb)

            centroid = emb.mean(axis=0, keepdims=True)
            distances = 1.0 - (emb @ centroid.T).reshape(-1)

            target_k = max(1, int(0.20 * len(distances)))

            sorted_idx = np.argsort(-distances)
            picked = 0

            for idx in sorted_idx:
                ln = line_nums_for_embedding[int(idx)]
                score = float(distances[int(idx)])

                if ln in flagged_lines:
                    continue

                severity = "high" if score >= float(np.quantile(distances, 0.98)) else "medium"

                preview = texts_for_embedding[int(idx)][:120]

                flag(
                    ln,
                    "semantic_outlier",
                    preview,
                    severity,
                    score=score,
                )

                picked += 1
                if picked >= target_k:
                    break

    except Exception as e:
        print("semantic outlier failed:", repr(e))




    flagged_line_reasons = {}
    for f in flagged:
        flagged_line_reasons.setdefault(str(f["line"]), []).append(f["reason"])


    cleaned_lines = [
        line for idx, line in enumerate(lines)
        if (idx + 1) not in flagged_lines and line.strip()
    ]
    cleaned_jsonl = "\n".join(cleaned_lines) + ("\n" if cleaned_lines else "")

    reason_counts = Counter([f["reason"] for f in flagged])

    return {
        "total_lines": len(lines),
        "flagged_count": len(flagged),
        "reason_counts": dict(reason_counts),
        "flagged_samples": flagged[:300],
        "raw_lines": lines,
        "flagged_line_reasons": flagged_line_reasons,
    }
