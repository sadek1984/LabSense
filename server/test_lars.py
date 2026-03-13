# test_lars.py — ضعه في نفس مجلد مشروع Immergo
import sys
sys.path.insert(0, "/Users/a12/Buraidah_lars")  # غيّر المسار

from lars_service import query_lars

# اختبر استعلامات مختلفة
tests = [
    "How many tomato samples are above limit?",
    "Find fipronil in beans",
    "How many samples of tomato?",
    "What are the non-compliant samples?",
    "Show me cucumber violations",
    "Which neighborhood has the most violations?",
    "What pesticides were found in tomatoes?",
]

for q in tests:
    print(f"\n{'='*50}")
    print(f"السؤال: {q}")
    answer = query_lars(q)
    print(f"الإجابة: {answer}")