# server/lars_service.py
import sys
import os
from pathlib import Path

# 1. Get the base LARS path (which you already fixed)
LARS_BASE = Path("/Users/a12/Buraidah_lars")

# 2. Add the BASE and the SRC/LARS directories to sys.path
# This tells Python where to look when it sees "from modules import..."
paths_to_add = [
    str(LARS_BASE),
    str(LARS_BASE / "src" / "LARS") # Adding the internal directory
]

for p in paths_to_add:
    if p not in sys.path:
        sys.path.insert(0, p)

print(f"✅ Linked LARS at: {LARS_BASE}")

# Now try the import
from src.LARS.modules.core_query_engine import get_query_engine

# Singleton — يتحمل مرة واحدة
_engine = None

def get_lars_engine():
    global _engine
    if _engine is None:
        db_path = os.environ.get("LARS_DB_PATH")
        _engine = get_query_engine(db_path=db_path, enable_llm=False)
    return _engine

def query_lars(question: str) -> str:
    """
    الواجهة الوحيدة بين Gemini Live و LARS
    بتاخد سؤال → بترجع إجابة نصية مختصرة للصوت
    """
    try:
        engine = get_lars_engine()
        response, df = engine.process(question)
        
        # اختصر الرد للصوت — شيل الـ markdown tables
        lines = response.split('\n')
        voice_lines = []
        for line in lines:
            # شيل سطور الجداول
            if '|' in line or line.startswith('---'):
                continue
            # شيل الـ markdown formatting
            line = line.replace('**', '').replace('*', '').replace('#', '')
            line = line.strip()
            if line:
                voice_lines.append(line)
        
        voice_response = ' '.join(voice_lines[:5])  # أول 5 جمل بس للصوت
        
        # لو في dataframe، أضف ملخص رقمي
        if df is not None and not df.empty:
            voice_response += f" — إجمالي النتائج: {len(df)} سجل."
        
        return voice_response or "لم أجد نتائج لهذا الاستعلام."
        
    except Exception as e:
        return f"عذراً، حدث خطأ أثناء البحث: {str(e)[:100]}"