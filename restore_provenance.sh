#!/bin/bash
# LARS Provenance Feature Recovery Script
# Run this in Cloud Shell: bash restore_provenance.sh
set -e
cd ~/labsense

echo "========================================="
echo "  LARS Provenance Recovery Script"
echo "========================================="
echo ""

# =============================================
# FIX 1: server/lars_service.py
# =============================================
echo "🔧 FIX 1: Restoring server/lars_service.py..."

cat > server/lars_service.py << 'PYEOF'
import os
import aiohttp
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lars_service")
LARS_ENGINE_URL = os.environ.get("LARS_ENGINE_URL", "")
_engine = None
def get_lars_engine():
    return True

async def query_lars_remote(question: str) -> tuple:
    if not LARS_ENGINE_URL:
        return "LARS engine URL not configured.", None
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{LARS_ENGINE_URL}/api/lars/query",
                json={"query": question},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                data = await resp.json()
                answer = data.get("answer", "No answer returned.")
                provenance = data.get("provenance", None)
                if not provenance:
                    provenance = _extract_provenance(answer)
                return answer, provenance
    except Exception as e:
        logger.error(f"LARS remote call failed: {e}")
        return f"Error contacting LARS: {e}", None

def _extract_provenance(answer: str) -> dict:
    import re
    provenance = {
        "source": "GC-MS/MS & LC-MS/MS Lab Results",
        "status": "Verified lab data"
    }
    m = re.search(r'Total unique samples[:\s*]+\*{0,2}(\d+)', answer)
    if m:
        provenance["records"] = int(m.group(1))
    m = re.search(r'Above limit[:\s*]+\*{0,2}(\d+)', answer)
    if m:
        provenance["above_limit"] = int(m.group(1))
    m = re.search(r'Below limit[:\s*]+\*{0,2}(\d+)', answer)
    if m:
        provenance["below_limit"] = int(m.group(1))
    commodities = re.findall(r'\|\s*([A-Za-z][A-Za-z\s]+?)\s*\|', answer)
    if commodities:
        skip = {'sample', 'type', 'unique', 'samples', 'above', 'below', 'limit'}
        values = [c for c in commodities if c.lower() not in skip]
        if values:
            provenance["values"] = values[:5]
    return provenance if len(provenance) > 2 else None
PYEOF
echo "  ✅ server/lars_service.py restored"

# =============================================
# FIX 2: server/main.py — patch lars_query endpoint
# =============================================
echo "🔧 FIX 2: Patching server/main.py (lars_query endpoint)..."

python3 << 'PYFIX2'
import re

with open("server/main.py", "r") as f:
    content = f.read()

# Find and replace the lars_query function
old_pattern = r'''(@app\.post\("/api/lars/query"\)\s*\nasync def lars_query\(request: Request\):\s*\n\s*from server\.lars_service import query_lars_remote\s*\n\s*data = await request\.json\(\)\s*\n\s*question = data\.get\("question", ""\) or data\.get\("query", ""\)\s*\n\s*answer = await query_lars_remote\(question\)\s*\n\s*return \{"answer": answer\})'''

new_code = '''@app.post("/api/lars/query")
async def lars_query(request: Request):
    from server.lars_service import query_lars_remote
    data = await request.json()
    question = data.get("question", "") or data.get("query", "")
    answer, provenance = await query_lars_remote(question)
    response = {"answer": answer}
    if provenance:
        response["provenance"] = provenance
    return response'''

result = re.sub(old_pattern, new_code, content)

if result == content:
    # Try simpler replacement
    old_simple = 'answer = await query_lars_remote(question)\n    return {"answer": answer}'
    new_simple = '''answer, provenance = await query_lars_remote(question)
    response = {"answer": answer}
    if provenance:
        response["provenance"] = provenance
    return response'''
    result = content.replace(old_simple, new_simple)

if result != content:
    with open("server/main.py", "w") as f:
        f.write(result)
    print("  ✅ server/main.py patched")
else:
    print("  ⚠️  server/main.py — pattern not found (may already be patched or different format)")
    print("     Please check manually!")
PYFIX2

# =============================================
# FIX 3: server/gemini_live.py — patch tool registration + provenance emit
# =============================================
echo "🔧 FIX 3: Patching server/gemini_live.py..."

python3 << 'PYFIX3'
with open("server/gemini_live.py", "r") as f:
    content = f.read()

changes_made = 0

# Fix 3a: Change search_pesticide_data return type from str to dict
old_tool = '''def search_pesticide_data(question: str) -> str:
            """Search the pesticide residue database for any question."""
            try:
                resp = _requests.post(
                    "http://localhost:8080/api/lars/query",
                    json={"question": question},
                    timeout=30
                )
                data = resp.json()
                return data.get("answer", str(data))
            except Exception as e:
                return f"LARS query failed: {e}"'''

new_tool = '''def search_pesticide_data(question: str) -> dict:
            """Search the pesticide residue database for any question."""
            try:
                resp = _requests.post(
                    "http://localhost:8080/api/lars/query",
                    json={"question": question},
                    timeout=30
                )
                data = resp.json()
                result = {"answer": data.get("answer", str(data))}
                if "provenance" in data:
                    result["provenance"] = data["provenance"]
                return result
            except Exception as e:
                return {"answer": f"LARS query failed: {e}"}'''

if old_tool in content:
    content = content.replace(old_tool, new_tool)
    changes_made += 1
    print("  ✅ search_pesticide_data changed to return dict")
else:
    print("  ⚠️  search_pesticide_data pattern not found exactly — check manually")

# Fix 3b: Add provenance emit before function_responses.append
old_emit = '''                                        # ✅ MUST use "output" key — Gemini SDK requires it
                                        function_responses.append(types.FunctionResponse(
                                            name=func_name,
                                            id=fc.id,
                                            response={"output": str(result)}
                                        ))
                                        await event_queue.put({
                                            "type": "tool_call",
                                            "name": func_name,
                                            "args": args,
                                            "result": str(result)
                                        })'''

new_emit = '''                                        # ✅ MUST use "output" key — Gemini SDK requires it
                                        answer_str = result.get("answer", str(result)) if isinstance(result, dict) else str(result)
                                        if isinstance(result, dict) and "provenance" in result:
                                            print(f"📊 EMITTING provenance event: {result['provenance']}")
                                            await event_queue.put({
                                                "type": "provenance",
                                                "provenance": result["provenance"]
                                            })
                                        function_responses.append(types.FunctionResponse(
                                            name=func_name,
                                            id=fc.id,
                                            response={"output": answer_str}
                                        ))
                                        await event_queue.put({
                                            "type": "tool_call",
                                            "name": func_name,
                                            "args": args,
                                            "result": answer_str
                                        })'''

if old_emit in content:
    content = content.replace(old_emit, new_emit)
    changes_made += 1
    print("  ✅ provenance emit block added")
else:
    print("  ⚠️  emit pattern not found exactly — check manually")

with open("server/gemini_live.py", "w") as f:
    f.write(content)

print(f"  Total changes in gemini_live.py: {changes_made}")
PYFIX3

# =============================================
# FIX 4: src/lib/gemini-live/geminilive.js — add PROVENANCE type + handler
# =============================================
echo "🔧 FIX 4: Patching src/lib/gemini-live/geminilive.js..."

python3 << 'PYFIX4'
with open("src/lib/gemini-live/geminilive.js", "r") as f:
    content = f.read()

changes_made = 0

# Fix 4a: Add PROVENANCE to enum
old_enum = '  OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",\n};'
new_enum = '  OUTPUT_TRANSCRIPTION: "OUTPUT_TRANSCRIPTION",\n  PROVENANCE: "PROVENANCE",\n};'

if 'PROVENANCE: "PROVENANCE"' not in content:
    if old_enum in content:
        content = content.replace(old_enum, new_enum)
        changes_made += 1
        print("  ✅ PROVENANCE added to MultimodalLiveResponseType")
    else:
        print("  ⚠️  enum pattern not found — check manually")
else:
    print("  ℹ️  PROVENANCE already in enum")

# Fix 4b: Add provenance handler before toolCall handler
old_handler = '      } else if (data?.toolCall) {'
new_handler = '''      } else if (data?.type === "provenance") {
        console.log("📊 PROVENANCE event", data.provenance);
        this.type = MultimodalLiveResponseType.PROVENANCE;
        this.data = data.provenance;
      } else if (data?.toolCall) {'''

if 'data?.type === "provenance"' not in content:
    if old_handler in content:
        content = content.replace(old_handler, new_handler, 1)
        changes_made += 1
        print("  ✅ PROVENANCE handler added")
    else:
        print("  ⚠️  toolCall handler pattern not found — check manually")
else:
    print("  ℹ️  PROVENANCE handler already exists")

with open("src/lib/gemini-live/geminilive.js", "w") as f:
    f.write(content)

print(f"  Total changes in geminilive.js: {changes_made}")
PYFIX4

# =============================================
# FIX 5: src/components/live-transcript.js — add addProvenance method + CSS
# =============================================
echo "🔧 FIX 5: Patching src/components/live-transcript.js..."

python3 << 'PYFIX5'
with open("src/components/live-transcript.js", "r") as f:
    content = f.read()

changes_made = 0

# Fix 5a: Add addProvenance method after addOutputTranscript
old_method = """  addOutputTranscript(text, isFinal) {
    this.updateTranscript('model', text, isFinal);
  }"""

new_method = """  addOutputTranscript(text, isFinal) {
    this.updateTranscript('model', text, isFinal);
  }

  addProvenance(provenance) {
    const container = this.shadowRoot.querySelector('.transcript-container');
    if (!container || !provenance) return;
    const card = document.createElement('div');
    card.className = 'provenance-card';
    const rows = [
      { icon: '📋', label: 'Records',    value: provenance.records ?? '—' },
      { icon: '📊', label: 'Source',     value: provenance.source || '—' },
      { icon: '🔍', label: 'Values',     value: (provenance.values || []).join(', ') || '—' },
      { icon: '✅', label: 'Status',     value: provenance.status || '—' },
    ];
    card.innerHTML = rows.map(r =>
      '<div class="provenance-row">' +
      '<span class="prov-icon">' + r.icon + '</span>' +
      '<span class="prov-label">' + r.label + '</span>' +
      '<span class="prov-value">' + r.value + '</span>' +
      '</div>'
    ).join('');
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }"""

if 'addProvenance' not in content:
    if old_method in content:
        content = content.replace(old_method, new_method)
        changes_made += 1
        print("  ✅ addProvenance method added")
    else:
        print("  ⚠️  addOutputTranscript pattern not found — check manually")
else:
    print("  ℹ️  addProvenance already exists")

# Fix 5b: Add provenance CSS before scrollbar CSS
old_css = "        .transcript-container::-webkit-scrollbar {"
new_css = """        .provenance-card {
          align-self: flex-start;
          background: rgba(92, 107, 72, 0.07);
          border: 1px solid rgba(92, 107, 72, 0.22);
          border-radius: 8px;
          padding: 0.45rem 0.75rem;
          font-size: 0.76rem;
          margin-top: -0.2rem;
          animation: popIn 0.4s ease forwards;
          max-width: 80%;
        }
        .provenance-row { display: flex; align-items: center; gap: 0.4rem; padding: 0.08rem 0; }
        .prov-icon { font-size: 0.82rem; }
        .prov-label { font-weight: 600; color: #5c6b48; min-width: 90px; }
        .prov-value { color: #444; }
        .transcript-container::-webkit-scrollbar {"""

if '.provenance-card' not in content:
    if old_css in content:
        content = content.replace(old_css, new_css, 1)
        changes_made += 1
        print("  ✅ provenance CSS added")
    else:
        print("  ⚠️  scrollbar CSS pattern not found — check manually")
else:
    print("  ℹ️  provenance CSS already exists")

with open("src/components/live-transcript.js", "w") as f:
    f.write(content)

print(f"  Total changes in live-transcript.js: {changes_made}")
PYFIX5

# =============================================
# FIX 6: src/components/view-chat.js — add PROVENANCE handler + render fix
# =============================================
echo "🔧 FIX 6: Patching src/components/view-chat.js..."

python3 << 'PYFIX6'
with open("src/components/view-chat.js", "r") as f:
    content = f.read()

changes_made = 0

# Fix 6a: Add PROVENANCE handler in onReceiveResponse
# Look for the last else-if block before the closing of onReceiveResponse
if 'PROVENANCE' not in content:
    # Find OUTPUT_TRANSCRIPTION handler and add PROVENANCE after it
    old_output = '''} else if (response.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addOutputTranscript(response.data.text, response.data.finished);
        }
      }'''

    new_output = '''} else if (response.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addOutputTranscript(response.data.text, response.data.finished);
        }
      } else if (response.type === MultimodalLiveResponseType.PROVENANCE) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addProvenance(response.data);
        }
      }'''

    if old_output in content:
        content = content.replace(old_output, new_output, 1)
        changes_made += 1
        print("  ✅ PROVENANCE handler added to onReceiveResponse")
    else:
        # Try alternate pattern with different indentation
        old_alt = 'transcriptEl.addOutputTranscript(response.data.text, response.data.finished);\n        }\n      }\n    };'
        new_alt = '''transcriptEl.addOutputTranscript(response.data.text, response.data.finished);
        }
      } else if (response.type === MultimodalLiveResponseType.PROVENANCE) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addProvenance(response.data);
        }
      }
    };'''
        if old_alt in content:
            content = content.replace(old_alt, new_alt, 1)
            changes_made += 1
            print("  ✅ PROVENANCE handler added (alt pattern)")
        else:
            print("  ⚠️  Could not find OUTPUT_TRANSCRIPTION block to insert after — check manually")
else:
    print("  ℹ️  PROVENANCE handler already exists")

# Fix 6b: CRITICAL — Make live-transcript render for lars mode too (not just immergo_teacher)
old_condition = 'this._mode === "immergo_teacher"'
new_condition = 'this._mode === "immergo_teacher" || this._mode === "lars"'

if 'this._mode === "lars"' not in content:
    count = content.count(old_condition)
    if count > 0:
        content = content.replace(old_condition, new_condition)
        changes_made += 1
        print(f"  ✅ live-transcript now renders for lars mode ({count} occurrences fixed)")
    else:
        print("  ⚠️  immergo_teacher condition not found — check manually")
else:
    print("  ℹ️  lars mode condition already present")

with open("src/components/view-chat.js", "w") as f:
    f.write(content)

print(f"  Total changes in view-chat.js: {changes_made}")
PYFIX6

# =============================================
# VERIFICATION
# =============================================
echo ""
echo "========================================="
echo "  VERIFICATION"
echo "========================================="
echo ""

echo "🔍 Checking server/lars_service.py..."
grep -q "async def query_lars_remote.*tuple" server/lars_service.py && echo "  ✅ returns tuple" || echo "  ❌ NOT returning tuple"
grep -q "_extract_provenance" server/lars_service.py && echo "  ✅ _extract_provenance exists" || echo "  ❌ _extract_provenance missing"

echo "🔍 Checking server/main.py..."
grep -q "answer, provenance" server/main.py && echo "  ✅ unpacks provenance" || echo "  ❌ provenance unpack missing"

echo "🔍 Checking server/gemini_live.py..."
grep -q "provenance" server/gemini_live.py && echo "  ✅ provenance handling present" || echo "  ❌ provenance handling missing"

echo "🔍 Checking src/lib/gemini-live/geminilive.js..."
grep -q "PROVENANCE" src/lib/gemini-live/geminilive.js && echo "  ✅ PROVENANCE type present" || echo "  ❌ PROVENANCE type missing"

echo "🔍 Checking src/components/live-transcript.js..."
grep -q "addProvenance" src/components/live-transcript.js && echo "  ✅ addProvenance method present" || echo "  ❌ addProvenance missing"
grep -q "provenance-card" src/components/live-transcript.js && echo "  ✅ provenance CSS present" || echo "  ❌ provenance CSS missing"

echo "🔍 Checking src/components/view-chat.js..."
grep -q "PROVENANCE" src/components/view-chat.js && echo "  ✅ PROVENANCE handler present" || echo "  ❌ PROVENANCE handler missing"
grep -q '_mode === "lars"' src/components/view-chat.js && echo "  ✅ lars mode renders live-transcript" || echo "  ❌ lars mode NOT rendering live-transcript"

echo ""
echo "========================================="
echo "  NEXT STEPS"
echo "========================================="
echo "1. Build frontend:  npx vite build"
echo "2. Deploy:          gcloud builds submit --config cloudbuild.yaml"
echo "3. Then:            gcloud run deploy lars-backend --image gcr.io/gen-lang-client-0519489172/lars-backend --region us-central1"
echo "========================================="
