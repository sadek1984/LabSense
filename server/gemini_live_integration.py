"""
GEMINI LIVE INTEGRATION - Updated Tool Handler

This replaces the OLD approach in your Immergo adaptation where
search_pesticide_data had hardcoded patterns.

NEW APPROACH: Single tool, one HTTP call, LARS handles everything.
"""

import aiohttp
import json
from typing import Any, Dict

# ---------------------------------------------------------------------------
# LARS service URL (wherever lars_service.py is running)
# ---------------------------------------------------------------------------
LARS_SERVICE_URL = "http://localhost:8100"


# ---------------------------------------------------------------------------
# THE SINGLE TOOL DEFINITION for Gemini Live
# Replace your old search_pesticide_data tool with this
# ---------------------------------------------------------------------------
LARS_TOOL = {
    "function_declarations": [
        {
            "name": "query_lars",
            "description": (
                "Query the LARS laboratory data system. Send ANY natural language "
                "question about pesticide residue testing data. The system handles "
                "all query types internally including counting samples, finding "
                "violations, searching by pesticide or vegetable, filtering by "
                "year or location, risk assessments, trend analysis, and "
                "statistical summaries. Pass the user's question exactly as "
                "spoken — do NOT try to parse or categorize it."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The user's exact question about pesticide data",
                    },
                },
                "required": ["query"],
            },
        }
    ]
}


# ---------------------------------------------------------------------------
# TOOL HANDLER: Replace your old handler that had pattern matching
# ---------------------------------------------------------------------------
async def handle_tool_call(function_name: str, function_args: Dict[str, Any]) -> str:
    """
    Handle Gemini Live tool calls.

    OLD WAY (what we had before — DON'T do this):
        if function_name == "search_pesticide_data":
            intent = function_args.get("intent")  # e.g., "COUNT_SAMPLES_LIMIT"
            if intent == "COUNT_SAMPLES_LIMIT":
                # hardcoded SQL...
            elif intent == "LIST_VIOLATIONS":
                # hardcoded SQL...
            # ❌ Limited to pre-defined patterns only

    NEW WAY (transparent proxy):
        Just forward the query to LARS. Done.
    """
    if function_name == "query_lars":
        query = function_args.get("query", "")
        return await call_lars(query)

    return json.dumps({"error": f"Unknown function: {function_name}"})


async def call_lars(query: str) -> str:
    """
    Call the LARS microservice with any query.
    Returns a string that Gemini Live can speak back to the user.
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{LARS_SERVICE_URL}/api/lars/query",
                json={"query": query},
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        return data.get("answer", "No results found.")
                    else:
                        return data.get("error", "Query failed.")
                else:
                    return f"LARS service returned status {response.status}"
    except aiohttp.ClientError as e:
        return f"Could not connect to LARS service: {e}"
    except Exception as e:
        return f"Error querying LARS: {e}"


# ---------------------------------------------------------------------------
# UPDATED SYSTEM PROMPT for Gemini Live
# Replace the old system prompt that listed specific question patterns
# ---------------------------------------------------------------------------
LARS_SYSTEM_PROMPT = """You are LARS — Laboratory Analysis and Risk System.

You are a voice-activated AI assistant for food safety laboratories in Saudi Arabia.
You help chemists and lab managers analyze pesticide residue testing data through
natural conversation.

IMPORTANT RULES:
1. When the user asks ANY question about pesticide data, samples, violations,
   compliance, risk assessment, or lab results — use the query_lars tool.
2. Do NOT try to answer data questions from your own knowledge.
3. Do NOT try to parse or categorize the question yourself — just pass it
   to query_lars exactly as the user said it.
4. After getting results from query_lars, summarize them in a clear,
   conversational way suitable for voice.
5. If results are long, give a summary first then offer details.
6. You can handle follow-up questions — each one is a new query_lars call.

WHAT LARS CAN DO (no need to memorize — just forward questions):
- Count samples (by vegetable, pesticide, year, location)
- Find violations and non-compliant samples
- Search by any pesticide name
- Search by any vegetable/commodity
- Filter by compliance status
- Filter by neighborhood/location
- Filter by year
- Risk assessment for specific samples or pesticides
- Trend analysis across years
- Statistical summaries
- Compare violations across categories

VOICE TIPS:
- Keep responses concise for voice delivery
- Round numbers for easier listening ("about 350 samples" not "347 samples")
- Highlight the most important finding first
- Offer to go deeper: "Would you like more details?"
"""


# ---------------------------------------------------------------------------
# EXAMPLE: How to wire this into your Gemini Live session
# ---------------------------------------------------------------------------
"""
# In your main Gemini Live session setup (adapted from Immergo):

import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",  # or whatever model you're using
    system_instruction=LARS_SYSTEM_PROMPT,
    tools=[LARS_TOOL],
)

# In your audio session handler, when you receive a tool call:
async def on_tool_call(tool_call):
    function_name = tool_call.function_name
    function_args = tool_call.args
    
    # This single handler covers ALL LARS queries
    result = await handle_tool_call(function_name, function_args)
    
    # Send result back to Gemini Live
    await session.send_tool_response(tool_call.id, result)
"""