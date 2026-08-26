import os
import json
import google.generativeai as genai
from pypdf import PdfReader
import config

# Configure Gemini API
if config.GEMINI_API_KEY:
    genai.configure(api_key=config.GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY is not set in environment.")

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts plain text from a PDF resume."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def tailor_resume(base_resume_text: str, job_title: str, company: str, job_description: str) -> dict:
    """
    Uses Gemini to analyze a job description and base resume text, then outputs
    a tailored version of the resume in structured JSON format.
    """
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")
        
    prompt = f"""
You are an expert technical recruiter and resume editor. 
Your task is to tailor a candidate's resume for a specific job application to maximize ATS relevance and highlight the most appropriate experiences. 

CRITICAL RULES:
1. Maintain factual integrity. Do NOT invent companies, degrees, dates, or certifications.
2. Emphasize relevant achievements, technologies, and responsibilities already present in the base resume that match the job description.
3. Rewrite the Professional Summary and refine job description bullet points to align with key keywords and requirements from the job description.
4. Extract the candidate's actual name and contact details (email, phone, address/location, links) from their base resume and populate the "full_name" and "contact_info" fields. Do NOT use the example placeholder values ("Candidate Name", "candidate@email.com", etc.) in your final output.
5. Output the result STRICTLY as a JSON object matching the schema below.

Job Details:
- Title: {job_title}
- Company: {company}
- Job Description:
{job_description}

Candidate's Base Resume Text:
{base_resume_text}

Output JSON Schema:
{{
  "full_name": "Extract Actual Name",
  "contact_info": {{
    "email": "extract_email@domain.com",
    "phone": "extract_phone",
    "location": "extract_city_state",
    "linkedin": "extract_linkedin_url",
    "portfolio": "extract_portfolio_url",
    "github": "extract_github_url"
  }},
  "tailored_summary": "A 3-4 sentence professional summary tailored to the job requirements.",
  "experience": [
    {{
      "job_title": "Original or slightly refined Job Title",
      "company": "Company Name",
      "location": "City, State",
      "dates": "Start Date - End Date",
      "tailored_bullets": [
        "Tailored bullet point 1, highlighting matching keywords and metrics",
        "Tailored bullet point 2, focusing on relevant tech stack used"
      ]
    }}
  ],
  "skills": [
    "Skill 1", "Skill 2", "Skill 3"
  ],
  "education": [
    {{
      "degree": "Degree Name",
      "school": "University Name",
      "dates": "Graduation Date",
      "details": "Any honors/details"
    }}
  ]
}}
"""

    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    
    try:
        tailored_data = json.loads(response.text)
        return tailored_data
    except Exception as e:
        print(f"Failed to parse Gemini resume response: {e}")
        return {
            "full_name": "",
            "contact_info": {},
            "tailored_summary": "",
            "experience": [],
            "skills": [],
            "education": []
        }

def analyze_and_fill_form(
    fields_list: list, 
    job_description: str, 
    tailored_resume_json: dict, 
    learned_qa_dict: dict
) -> dict:
    """
    Takes a list of form fields extracted from the webpage, maps them to the tailored resume data
    and learned answers, and returns a JSON dictionary of actions: selector -> value.
    """
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    prompt = f"""
You are an text processing agent tasked with filling out a job application form correctly.
You are given:
1. A list of form fields on the current page.
2. The job description.
3. The candidate's tailored resume details.
4. A dictionary of past successfully answered questions.

Form Fields on Page:
{json.dumps(fields_list, indent=2)}

Candidate Tailored Resume:
{json.dumps(tailored_resume_json, indent=2)}

Past Successful Q&As:
{json.dumps(learned_qa_dict, indent=2)}

INSTRUCTIONS:
- Generate a JSON mapping of fields where keys are the exact 'selector' strings from the Form Fields list, and values are the appropriate answers to fill.
- For 'select' and 'radio' fields, you MUST pick one of the values listed in their 'options' array. Return the exact matching option string.
- If a checkbox is required, set the value to true.
- If a field is optional and there is no clear answer, you may omit it or set it to null.
- Be consistent, professional, and match the candidate's profile exactly.

Return ONLY a JSON mapping like:
{{
  "selector_string_1": "Value to write",
  "selector_string_2": "Option from select list",
  "selector_string_3": true
}}
"""

    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    
    try:
        fill_map = json.loads(response.text)
        return fill_map
    except Exception as e:
        print(f"Failed to parse Gemini form fill response: {e}")
        return {}

def resolve_form_errors(
    fields_list: list, 
    previous_fill: dict, 
    validation_errors: list, 
    tailored_resume_json: dict
) -> dict:
    """
    Given a form that failed validation, this takes the errors and recommends fixes.
    """
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    prompt = f"""
An automated job application attempt failed because some fields had validation errors.
You need to correct the answers for those fields.

Form Fields:
{json.dumps(fields_list, indent=2)}

Previous Inputs:
{json.dumps(previous_fill, indent=2)}

Validation Errors:
{json.dumps(validation_errors, indent=2)}

Candidate Resume Profile:
{json.dumps(tailored_resume_json, indent=2)}

INSTRUCTIONS:
- Return a JSON object containing the updated values ONLY for the fields that have errors.
- Ensure the new values satisfy the validation rules stated in the error text.

Return ONLY a JSON mapping:
{{
  "selector_string_with_error": "Corrected value"
}}
"""

    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )
    
    try:
        corrections = json.loads(response.text)
        return corrections
    except Exception as e:
        print(f"Failed to parse Gemini correction response: {e}")
        return {}
