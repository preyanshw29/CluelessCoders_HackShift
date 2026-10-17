from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.db import DATA_DIR, REPORTS_DIR, get_conn
from app.report import generate_claim_pdf

router = APIRouter()


@router.get("/api/claims/{id}/report.pdf")
def get_claim_report_pdf(id: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, pdf_path FROM claims WHERE id = ?;", (id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Claim {id} not found")

    pdf_rel_path = row["pdf_path"]
    target_file = None

    if pdf_rel_path:
        candidate = DATA_DIR / pdf_rel_path
        if candidate.exists() and candidate.is_file():
            target_file = candidate

    if not target_file:
        try:
            new_rel_path = generate_claim_pdf(id)
            target_file = DATA_DIR / new_rel_path
        except ValueError as ve:
            raise HTTPException(status_code=404, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {e}")

    if not target_file.exists():
        raise HTTPException(status_code=500, detail="Generated PDF file not found on disk")

    return FileResponse(
        path=str(target_file),
        media_type="application/pdf",
        filename=f"claim_{id}_evidence_report.pdf",
    )
