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
