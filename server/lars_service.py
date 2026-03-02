import sys
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# مسار ثابت — src/LARS هو الجذر الصح
LARS_SRC = Path("/Users/a12/Buraidah_lars/src/LARS")

# تحقق إنه موجود
if not LARS_SRC.exists():
    raise FileNotFoundError(f"LARS not found at: {LARS_SRC}")

# أضف src/LARS للـ path فقط
if str(LARS_SRC) not in sys.path:
    sys.path.insert(0, str(LARS_SRC))

print(f"✅ Linked LARS at: {LARS_SRC}")
print(f"📁 modules exists: {(LARS_SRC / 'modules').exists()}")

try:
    from modules.core_query_engine import get_query_engine
    print("🚀 Import successful!")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    raise

_engine = None

def get_lars_engine():
    global _engine
    if _engine is None:
        db_path = str(LARS_SRC / "data" / "lars_data.duckdb")
        print(f"📂 Initializing Engine with DB: {db_path}")
        _engine = get_query_engine(db_path=db_path, enable_llm=False)
    return _engine

def query_lars(question: str) -> str:
    try:
        engine = get_lars_engine()
        response, df = engine.process(question)
        
        lines = response.split('\n')
        voice_lines = []
        for line in lines:
            if '|' in line or line.startswith('---'):
                continue
            line = line.replace('**', '').replace('*', '').replace('#', '').strip()
            if line:
                voice_lines.append(line)
        
        voice_response = ' '.join(voice_lines[:5])
        if df is not None and not df.empty:
            voice_response += f" — إجمالي النتائج: {len(df)} سجل."
        
        return voice_response or "لم أجد نتائج لهذا الاستعلام."
        
    except Exception as e:
        return f"عذراً، حدث خطأ أثناء البحث: {str(e)[:100]}"