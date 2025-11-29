import copy
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Body, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from server.database import get_db, init_db, is_db_available
from server.models import SolverSession
from server.services.posting_allocator import allocate_timetable
from server.services.postprocess import compute_postprocess
from server.services.preprocessing import (
    normalise_current_year_entries,
    prepare_solver_input,
)
from server.services.validate import validate_assignment
from server.utils import MONTH_LABELS


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="R2S API", lifespan=lifespan)

# configure CORS middleware
# Allow localhost for development and Replit domains for preview/deployment
origins = [
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://0.0.0.0:5000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.(replit\.dev|repl\.co)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# helpter functions for deepcopy and building postprocess payload
def _deepcopy(value: Any) -> Any:
    return copy.deepcopy(value)


def _build_postprocess_payload(
    base_input: Dict[str, Any], solver_solution: Dict[str, Any]
) -> Dict[str, Any]:
    payload = {
        "residents": _deepcopy(base_input.get("residents") or []),
        "resident_history": _deepcopy(base_input.get("resident_history") or []),
        "resident_preferences": _deepcopy(base_input.get("resident_preferences") or []),
        "resident_sr_preferences": _deepcopy(
            base_input.get("resident_sr_preferences") or []
        ),
        "postings": _deepcopy(base_input.get("postings") or []),
        "weightages": _deepcopy(base_input.get("weightages") or {}),
        "resident_leaves": _deepcopy(base_input.get("resident_leaves") or []),
        "solver_solution": solver_solution,
    }
    return payload


@app.post("/api/solve")
async def solve(request: Request):
    try:
        # parse form data
        form = await request.form()

        # prepare solver input (stateless - client provides previous context if needed)
        solver_input = await prepare_solver_input(form=form)
        solver_payload = _deepcopy(solver_input)

        # call the posting allocator
        allocator_result = allocate_timetable(
            residents=solver_payload["residents"],
            resident_history=solver_payload["resident_history"],
            resident_preferences=solver_payload["resident_preferences"],
            resident_sr_preferences=solver_payload["resident_sr_preferences"],
            postings=solver_payload["postings"],
            weightages=solver_payload["weightages"],
            resident_leaves=solver_payload.get("resident_leaves", []),
            pinned_assignments=solver_payload.get("pinned_assignments", []),
            max_time_in_minutes=solver_payload.get("max_time_in_minutes"),
        )
        if not allocator_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=allocator_result.get(
                    "error", "Posting allocator service failed unexpectedly."
                ),
            )

        # extract solver solution
        solver_solution = allocator_result.get("solver_solution")

        # build postprocess payload
        postprocess_payload = _build_postprocess_payload(
            allocator_result, solver_solution
        )

        # call the postprocess service
        final_result = compute_postprocess(postprocess_payload)
        if not final_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=final_result.get("error", "Postprocess failed"),
            )

        return final_result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=str(exc) or "Failed to process files"
        )


@app.post("/api/save")
async def save(payload: Dict[str, Any] = Body(...)):
    """
    Save manual edits to a resident's schedule.
    Stateless: client must provide the full context (previous API response).
    """
    resident_mcr = str(payload.get("resident_mcr") or "").strip()
    if not resident_mcr:
        raise HTTPException(status_code=400, detail="missing resident_mcr")

    # Client must provide the full context from previous API response
    context = payload.get("context") or {}
    if not context.get("residents") or not context.get("postings"):
        raise HTTPException(
            status_code=400,
            detail="Missing context. Please provide the full API response context.",
        )

    current_year = normalise_current_year_entries(payload.get("current_year") or [])

    validation_payload = {
        "resident_mcr": resident_mcr,
        "current_year": [
            {"month_block": entry["month_block"], "posting_code": entry["posting_code"]}
            for entry in current_year
        ],
        "residents": context.get("residents") or [],
        "resident_history": context.get("resident_history") or [],
        "postings": context.get("postings") or [],
    }

    validation_result = validate_assignment(validation_payload)
    if not validation_result.get("success"):
        return JSONResponse(status_code=400, content=validation_result)

    residents = _deepcopy(context.get("residents") or [])
    resident_history = _deepcopy(context.get("resident_history") or [])

    filtered_history = [
        row
        for row in resident_history
        if not (row.get("mcr") == resident_mcr and row.get("is_current_year"))
    ]

    resident = next((r for r in residents if r.get("mcr") == resident_mcr), None)
    resident_year = resident.get("resident_year") if resident else None

    new_entries: List[Dict[str, Any]] = []
    for entry in current_year:
        month_block = entry["month_block"]
        posting_code = entry["posting_code"]
        career_block = entry.get("career_block")
        new_entries.append(
            {
                "mcr": resident_mcr,
                "year": resident_year,
                "month_block": month_block,
                "career_block": career_block,
                "posting_code": posting_code,
                "is_current_year": True,
                "is_leave": False,
                "leave_type": "",
            }
        )

    weightages = _deepcopy(context.get("weightages") or {})

    updated_payload = {
        "residents": residents,
        "resident_history": filtered_history + new_entries,
        "resident_preferences": context.get("resident_preferences") or [],
        "resident_sr_preferences": context.get("resident_sr_preferences") or [],
        "postings": context.get("postings") or [],
        "weightages": weightages,
        "resident_leaves": context.get("resident_leaves") or [],
    }

    result = compute_postprocess(updated_payload)
    if not result.get("success"):
        raise HTTPException(
            status_code=500, detail=result.get("error", "Postprocess failed")
        )

    return result


@app.post("/api/download-csv")
async def download_csv(payload: Dict[str, Any] = Body(...)):
    success = payload.get("success")
    residents = payload.get("residents")
    resident_history = payload.get("resident_history")
    optimisation_scores = payload.get("optimisation_scores")

    if not (
        success
        and isinstance(residents, list)
        and isinstance(resident_history, list)
        and isinstance(optimisation_scores, list)
    ):
        raise HTTPException(status_code=400, detail="Invalid API response shape")

    history_by_mcr: Dict[str, Dict[int, str]] = {}
    for row in resident_history:
        if not row.get("is_current_year"):
            continue
        mcr = str(row.get("mcr") or "").strip()
        block = row.get("month_block") or row.get("block")
        try:
            block_int = int(block)
        except (TypeError, ValueError):
            continue
        posting_code = str(row.get("posting_code") or "").strip()
        if mcr and posting_code:
            history_by_mcr.setdefault(mcr, {})[block_int] = posting_code

    header_cols = [
        "mcr",
        "name",
        "resident_year",
        "optimisation_score",
        *MONTH_LABELS,
        "ccr_posting_code",
    ]

    rows: List[str] = []
    for idx, resident in enumerate(residents):
        mcr = resident.get("mcr", "")
        name = resident.get("name", "")
        year = resident.get("resident_year", "")
        score = optimisation_scores[idx] if idx < len(optimisation_scores) else ""
        by_block = history_by_mcr.get(mcr, {})
        block_codes = [by_block.get(i + 1, "") for i in range(12)]
        ccr = resident.get("ccr_status", {}).get("posting_code", "")
        cols = [mcr, name, year, score, *block_codes, ccr]
        escaped = ['"{}"'.format(str(col).replace('"', '""')) for col in cols]
        rows.append(",".join(escaped))

    csv_content = ",".join(header_cols) + "\n" + "\n".join(rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="final_timetable.csv"',
        },
    )


@app.get("/api/db-status")
async def db_status():
    """Check if database is available for session persistence."""
    return {"available": is_db_available()}


@app.get("/api/sessions")
async def list_sessions(db: Session = Depends(get_db)):
    """List all saved solver sessions (without full api_response data)."""
    sessions = db.query(SolverSession).order_by(SolverSession.updated_at.desc()).all()
    return {"sessions": [s.to_dict() for s in sessions]}


@app.post("/api/sessions")
async def create_session(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Save a new solver session to the database."""
    name = str(payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Session name is required")
    
    api_response = payload.get("api_response")
    if not api_response or not isinstance(api_response, dict):
        raise HTTPException(status_code=400, detail="api_response is required")
    
    session = SolverSession(
        name=name,
        academic_year=str(payload.get("academic_year") or "").strip() or None,
        api_response=api_response,
        notes=str(payload.get("notes") or "").strip() or None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {"success": True, "session": session.to_dict()}


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get a specific session with full api_response data."""
    session = db.query(SolverSession).filter(SolverSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_full_dict()


@app.put("/api/sessions/{session_id}")
async def update_session(session_id: int, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Update an existing session (name, notes, or api_response)."""
    session = db.query(SolverSession).filter(SolverSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if "name" in payload:
        name = str(payload["name"]).strip()
        if not name:
            raise HTTPException(status_code=400, detail="Session name cannot be empty")
        session.name = name
    
    if "notes" in payload:
        session.notes = str(payload["notes"]).strip() or None
    
    if "academic_year" in payload:
        session.academic_year = str(payload["academic_year"]).strip() or None
    
    if "api_response" in payload:
        api_response = payload["api_response"]
        if not isinstance(api_response, dict):
            raise HTTPException(status_code=400, detail="api_response must be a valid object")
        session.api_response = api_response
    
    db.commit()
    db.refresh(session)
    
    return {"success": True, "session": session.to_dict()}


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: int, db: Session = Depends(get_db)):
    """Delete a session."""
    session = db.query(SolverSession).filter(SolverSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"success": True, "message": "Session deleted"}


# Static files and SPA routing for production deployment
_client_dist_path = Path(__file__).parent.parent / "client" / "dist"
_assets_path = _client_dist_path / "assets"

# Mount assets directory if it exists (for production)
if _assets_path.exists() and _assets_path.is_dir():
    app.mount("/assets", StaticFiles(directory=str(_assets_path)), name="assets")


@app.get("/")
async def serve_index():
    """Serve the main index.html for the SPA."""
    index_file = _client_dist_path / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "R2S API", "docs": "/docs"}


@app.get("/{path:path}")
async def serve_static_or_spa(path: str):
    """Serve static files or fallback to SPA index.html."""
    # Skip API paths - they should 404 if not matched by explicit routes
    if path.startswith("api"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    # Check if client dist exists (production mode)
    if not _client_dist_path.exists():
        raise HTTPException(status_code=404, detail="Not found")
    
    # Try to serve the exact file if it exists
    file_path = _client_dist_path / path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Fallback to index.html for SPA routing
    index_file = _client_dist_path / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    raise HTTPException(status_code=404, detail="Not found")
