from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import tempfile

from backend.parser import extract_text_from_pdf
from backend.analyzer import analyze_resume, match_resume_to_job

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "AI Resume Analyzer Running"}


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    temp_fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        with os.fdopen(temp_fd, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(temp_path)

        if not resume_text or not resume_text.strip():
            return {"error": "Could not extract text from resume. Try a different PDF."}

        result = analyze_resume(resume_text)

        return {
            "filename": file.filename,
            "text": resume_text,
            "analysis": result
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/match")
async def match(file: UploadFile = File(...), job_description: str = Form(...)):
    temp_fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        with os.fdopen(temp_fd, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(temp_path)

        if not resume_text or not resume_text.strip():
            return {"error": "Could not extract text from resume. Try a different PDF."}

        if not job_description or not job_description.strip():
            return {"error": "Job description is required."}

        result = match_resume_to_job(resume_text, job_description)

        return {
            "filename": file.filename,
            "match_result": result
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)