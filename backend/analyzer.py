import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


def analyze_resume(resume_text: str) -> dict:
    prompt = f"""
You are an ATS Resume Analyzer.

Analyze the following resume.

Return ONLY valid JSON.
Do not use markdown.
Do not add ```json.
Do not add any explanation.
Do not include any reasoning or thinking text before or after the JSON.

Use exactly this format:

{{
    "ATS Score": 0,
    "Strengths": [],
    "Weaknesses": [],
    "Suggestions": []
}}

Resume:
{resume_text}
"""

    response = client.chat.completions.create(
        model="nvidia/nemotron-3-ultra-550b-a55b:free",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    print("AI RESPONSE:")
    print(response)

    if not response.choices:
        raise Exception("AI did not return any choices")

    content = response.choices[0].message.content

    if not content:
        raise Exception("AI returned empty response")

    content = content.strip()
    content = content.replace("```json", "").replace("```", "").strip()

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        print("INVALID AI JSON:")
        print(content)
        raise Exception("AI returned invalid JSON")

    return result


def match_resume_to_job(resume_text: str, job_description: str) -> dict:
    prompt = f"""
You are an ATS Resume Matching Expert.

Compare the resume below with the job description.

Return ONLY valid JSON.
Do not use markdown.
Do not add ```json.
Do not add any explanation.
Do not include any reasoning or thinking text before or after the JSON.

Use exactly this format:

{{
    "Match Percentage": 0,
    "Matching Keywords": [],
    "Missing Keywords": [],
    "Summary": "",
    "Suggestions": []
}}

Resume:
{resume_text}

Job Description:
{job_description}
"""

    response = client.chat.completions.create(
        model="nvidia/nemotron-3-ultra-550b-a55b:free",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    print("MATCH RESPONSE:")
    print(response)

    if not response.choices:
        raise Exception("AI did not return any choices")

    content = response.choices[0].message.content

    if not content:
        raise Exception("AI returned empty response")

    content = content.strip()
    content = content.replace("```json", "").replace("```", "").strip()

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        print("INVALID AI JSON:")
        print(content)
        raise Exception("AI returned invalid JSON")

    return result