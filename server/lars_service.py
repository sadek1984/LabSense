"""
lars_service.py - Transparent LARS Microservice Bridge for Gemini Live

PURPOSE:
    This replaces the old lars_service.py that restricted queries to specific
    hardcoded patterns (e.g., COUNT_SAMPLES_LIMIT, search_pesticide_data).

    The NEW approach: LARS core_query_engine already handles ALL query types
    internally (intent detection, SQL building, risk assessment, etc.).
    This service is just a thin transparent proxy — it forwards ANY query
    from Gemini Live to LARS and returns the result.

ARCHITECTURE:
    Gemini Live Voice → (any natural language) → lars_service.py → core_query_engine → DuckDB → result
    
    NO pattern matching here. NO intent detection here. NO query restriction here.
    LARS handles everything. This service just bridges the connection.

USAGE:
    From the Immergo/Gemini Live app:
        POST /api/lars/query
        {"query": "any natural language question about pesticide data"}
    
    Returns:
        {"success": true, "answer": "...", "data": {...}, "query_type": "..."}
"""

import os
import sys
import json
import logging
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# IMPORTANT: Adjust this path to wherever your LARS core lives
# ---------------------------------------------------------------------------
LARS_PROJECT_PATH = os.environ.get(
    "LARS_PROJECT_PATH",
    "/Users/a12/Buraidah_lars/src/LARS"
)
sys.path.insert(0, LARS_PROJECT_PATH)

# Import YOUR existing LARS core — this already has ALL the intelligence
try:
    from core_query_engine import CoreQueryEngine
    LARS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Could not import CoreQueryEngine: {e}")
    LARS_AVAILABLE = False

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DUCKDB_PATH = os.environ.get(
    "LARS_DUCKDB_PATH",
    "/Users/a12/Buraidah_lars/src/LARS/data/lars_data.duckdb"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lars_service")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="LARS Microservice Bridge",
    description="Transparent proxy to LARS core_query_engine — forwards ANY query",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Singleton: Initialize LARS engine once
# ---------------------------------------------------------------------------
_lars_engine = None

def get_lars_engine():
    """
    Lazy-initialize the CoreQueryEngine singleton.
    This connects to DuckDB and loads all LARS capabilities ONCE.
    """
    global _lars_engine

    if _lars_engine is None:
        if not LARS_AVAILABLE:
            raise HTTPException(
                status_code=503,
                detail="LARS CoreQueryEngine not available. Check LARS_PROJECT_PATH.",
            )
        logger.info(f"Initializing LARS CoreQueryEngine with DB: {DUCKDB_PATH}")
        _lars_engine = CoreQueryEngine(db_path=DUCKDB_PATH)
        logger.info("LARS CoreQueryEngine initialized successfully")

    return _lars_engine


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    """
    The ONLY thing the client needs to send is a natural language query.
    No intent, no category, no pattern — just the question.
    """
    query: str
    # Optional overrides (client can ignore these entirely)
    year: Optional[int] = None
    include_risk: Optional[bool] = None


class QueryResponse(BaseModel):
    success: bool
    answer: str
    query: str
    query_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# THE KEY ENDPOINT: One endpoint to rule them all
# ---------------------------------------------------------------------------
@app.post("/api/lars/query", response_model=QueryResponse)
async def query_lars(request: QueryRequest):
    """
    THE TRANSPARENT PROXY.

    Takes ANY natural language query and forwards it to LARS core_query_engine.
    LARS internally handles:
        - Intent detection (count, list, compare, risk, trends, etc.)
        - Sample type detection (tomato, cucumber, pepper, etc.)
        - Pesticide name matching (Bifenthrin, Pyridaben, etc.)
        - Neighborhood/location detection
        - Compliance status filtering
        - Year extraction
        - SQL query building
        - Risk assessment (when detected)
        - Response formatting

    We do NONE of that here. We just call engine.process_query() and return.
    """
    try:
        engine = get_lars_engine()

        # ---------------------------------------------------------------
        # OPTION A: If your core_query_engine has a single entry point
        # (most likely based on your codebase)
        # ---------------------------------------------------------------
        if hasattr(engine, "process_query"):
            result = engine.process_query(request.query)

        # ---------------------------------------------------------------
        # OPTION B: If your engine uses .ask() like the hybrid system
        # ---------------------------------------------------------------
        elif hasattr(engine, "ask"):
            result = engine.ask(request.query)

        # ---------------------------------------------------------------
        # OPTION C: If your engine uses .execute_query() 
        # ---------------------------------------------------------------
        elif hasattr(engine, "execute_query"):
            result = engine.execute_query(request.query)

        else:
            raise HTTPException(
                status_code=500,
                detail="CoreQueryEngine has no recognized query method "
                       "(process_query / ask / execute_query).",
            )

        # ---------------------------------------------------------------
        # Normalize the result into a consistent response
        # ---------------------------------------------------------------
        return _normalize_result(request.query, result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        return QueryResponse(
            success=False,
            answer=f"Error processing your question: {str(e)}",
            query=request.query,
            error=str(e),
        )


# ---------------------------------------------------------------------------
# Convenience endpoints (all delegate to the same engine)
# ---------------------------------------------------------------------------
@app.get("/api/lars/health")
async def health_check():
    """Check if LARS engine is available and connected."""
    try:
        engine = get_lars_engine()
        # Quick verification: check DB connection
        if hasattr(engine, "db_path"):
            return {
                "status": "healthy",
                "lars_available": True,
                "db_path": str(engine.db_path),
            }
        return {"status": "healthy", "lars_available": True}
    except Exception as e:
        return {"status": "unhealthy", "lars_available": False, "error": str(e)}


@app.get("/api/lars/capabilities")
async def get_capabilities():
    """
    Tell the Gemini Live system prompt what LARS can do.
    This is useful for building the Gemini system prompt dynamically.
    """
    return {
        "name": "LARS — Laboratory Analysis and Risk System",
        "description": "Voice-enabled AI assistant for pesticide residue data analysis",
        "capabilities": [
            "Count samples (total, by vegetable, by pesticide, by year)",
            "List violations and non-compliant samples",
            "Search by pesticide name (Bifenthrin, Pyridaben, Chlorpyrifos, etc.)",
            "Search by vegetable/commodity (Tomato, Cucumber, Pepper, etc.)",
            "Filter by compliance status (compliant vs non-compliant)",
            "Filter by neighborhood/location",
            "Filter by year (2022, 2023, 2024)",
            "Risk assessment for specific samples or pesticides",
            "Trend analysis across years",
            "Statistical summaries (ANOVA, seasonal patterns)",
            "Compare pesticide violations across vegetables",
            "Top violators by category",
            "Exceedance ratio analysis",
        ],
        "example_queries": [
            "How many tomato samples were tested in 2023?",
            "Show me all Bifenthrin violations",
            "What is the compliance rate for cucumbers?",
            "Which neighborhood has the most violations?",
            "Assess the health risk for Pyridaben in peppers",
            "Compare violation rates between 2022 and 2023",
            "What are the top 5 most violated pesticides?",
        ],
        "data_source": "DuckDB database with GC-MS/MS and LC-MS/MS laboratory results",
        "language": "English queries (database contains English sample names)",
    }


# ---------------------------------------------------------------------------
# Gemini Live Tool Definition
# ---------------------------------------------------------------------------
def get_gemini_tool_definition() -> dict:
    """
    Returns a tool definition for Gemini Live's function calling.
    
    USE THIS in your Gemini Live system instead of the old
    search_pesticide_data tool that had hardcoded patterns.
    
    This single tool handles EVERYTHING — no pattern restrictions.
    """
    return {
        "name": "query_lars",
        "description": (
            "Query the LARS laboratory data system. Send ANY natural language "
            "question about pesticide residue testing data. The system handles "
            "all types of queries including: counting samples, finding violations, "
            "searching by pesticide or vegetable name, filtering by year or "
            "neighborhood, risk assessments, trend analysis, and statistical "
            "summaries. Just pass the user's question as-is."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": (
                        "The user's natural language question about pesticide "
                        "data. Examples: 'How many tomato samples in 2023?', "
                        "'Show Bifenthrin violations', 'What is the compliance "
                        "rate?', 'Risk assessment for Pyridaben'. Send the "
                        "user's question exactly as spoken — LARS handles "
                        "intent detection internally."
                    ),
                },
            },
            "required": ["query"],
        },
    }


# ---------------------------------------------------------------------------
# Helper: Normalize various result formats from CoreQueryEngine
# ---------------------------------------------------------------------------
def _normalize_result(original_query: str, result: Any) -> QueryResponse:
    """
    CoreQueryEngine might return different types depending on the query.
    This normalizes everything into a consistent QueryResponse.
    """

    # Case 1: result is already a dict with 'answer' or 'result'
    if isinstance(result, dict):
        answer = (
            result.get("answer")
            or result.get("result")
            or result.get("summary")
            or result.get("response")
            or json.dumps(result, indent=2, default=str)
        )
        return QueryResponse(
            success=True,
            answer=str(answer),
            query=original_query,
            query_type=result.get("query_type") or result.get("intent"),
            data=result,
        )

    # Case 2: result is a string
    if isinstance(result, str):
        return QueryResponse(
            success=True,
            answer=result,
            query=original_query,
        )

    # Case 3: result is a tuple (answer, metadata) — some engines return this
    if isinstance(result, (list, tuple)) and len(result) >= 1:
        return QueryResponse(
            success=True,
            answer=str(result[0]),
            query=original_query,
            data={"additional": result[1:]} if len(result) > 1 else None,
        )

    # Case 4: pandas DataFrame (from direct query execution)
    try:
        import pandas as pd
        if isinstance(result, pd.DataFrame):
            return QueryResponse(
                success=True,
                answer=result.to_string(index=False),
                query=original_query,
                data={"records": result.to_dict(orient="records")[:50]},  # limit for voice
            )
    except ImportError:
        pass

    # Fallback
    return QueryResponse(
        success=True,
        answer=str(result),
        query=original_query,
    )


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "lars_service:app",
        host="0.0.0.0", 
        port=8100,
        reload=True,
    )