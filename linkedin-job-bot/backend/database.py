import os
import sqlite3
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "job_bot.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Profile Data Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profile_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        linkedin_url TEXT,
        portfolio_url TEXT,
        github_url TEXT,
        base_resume_text TEXT,
        base_resume_path TEXT,
        job_titles TEXT, -- JSON list
        target_locations TEXT, -- JSON list
        search_keywords TEXT, -- JSON list
        custom_answers_json TEXT -- JSON string of arbitrary QA mappings
    )
    """)
    
    # 2. Applications Log Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT UNIQUE,
        title TEXT,
        company TEXT,
        location TEXT,
        platform TEXT, -- e.g., 'linkedin_easy_apply', 'workday', etc.
        status TEXT, -- 'applied', 'failed', 'pending'
        applied_at TEXT, -- ISO timestamp
        tailored_resume_path TEXT,
        cover_letter_path TEXT,
        error_message TEXT
    )
    """)
    
    # 3. Self-Learning QA Repository Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learned_qa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT UNIQUE, -- Normalized lowercase question
        question_options_json TEXT, -- JSON array of options if select/radio
        answer TEXT,
        is_success INTEGER DEFAULT 1, -- 1 = success, 0 = led to validation error
        error_feedback TEXT, -- The validation error text if any
        updated_at TEXT
    )
    """)
    
    conn.commit()
    conn.close()

# --- Profile Helpers ---

def get_profile():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profile_data LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        profile = dict(row)
        # Parse JSON fields
        for field in ["job_titles", "target_locations", "search_keywords"]:
            if profile.get(field):
                try:
                    profile[field] = json.loads(profile[field])
                except Exception:
                    profile[field] = []
            else:
                profile[field] = []
        
        if profile.get("custom_answers_json"):
            try:
                profile["custom_answers"] = json.loads(profile["custom_answers_json"])
            except Exception:
                profile["custom_answers"] = {}
        else:
            profile["custom_answers"] = {}
        return profile
    return None

def save_profile(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if a profile exists
    cursor.execute("SELECT id FROM profile_data LIMIT 1")
    row = cursor.fetchone()
    
    job_titles = json.dumps(data.get("job_titles", []))
    target_locations = json.dumps(data.get("target_locations", []))
    search_keywords = json.dumps(data.get("search_keywords", []))
    custom_answers_json = json.dumps(data.get("custom_answers", {}))
    
    fields = (
        data.get("full_name"),
        data.get("email"),
        data.get("phone"),
        data.get("location"),
        data.get("linkedin_url"),
        data.get("portfolio_url"),
        data.get("github_url"),
        data.get("base_resume_text"),
        data.get("base_resume_path"),
        job_titles,
        target_locations,
        search_keywords,
        custom_answers_json
    )
    
    if row:
        profile_id = row[0]
        cursor.execute("""
        UPDATE profile_data SET
            full_name = ?, email = ?, phone = ?, location = ?,
            linkedin_url = ?, portfolio_url = ?, github_url = ?,
            base_resume_text = ?, base_resume_path = ?,
            job_titles = ?, target_locations = ?, search_keywords = ?,
            custom_answers_json = ?
        WHERE id = ?
        """, fields + (profile_id,))
    else:
        cursor.execute("""
        INSERT INTO profile_data (
            full_name, email, phone, location,
            linkedin_url, portfolio_url, github_url,
            base_resume_text, base_resume_path,
            job_titles, target_locations, search_keywords,
            custom_answers_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, fields)
        
    conn.commit()
    conn.close()

# --- Applications Helpers ---

def log_application(job_id, title, company, location, platform, status, tailored_resume_path=None, cover_letter_path=None, error_message=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    applied_at = datetime.utcnow().isoformat()
    try:
        cursor.execute("""
        INSERT INTO applications (
            job_id, title, company, location, platform, status, applied_at, tailored_resume_path, cover_letter_path, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
            status = excluded.status,
            applied_at = excluded.applied_at,
            tailored_resume_path = COALESCE(excluded.tailored_resume_path, applications.tailored_resume_path),
            cover_letter_path = COALESCE(excluded.cover_letter_path, applications.cover_letter_path),
            error_message = excluded.error_message
        """, (job_id, title, company, location, platform, status, applied_at, tailored_resume_path, cover_letter_path, error_message))
        conn.commit()
    except Exception as e:
        print(f"Database error logging application: {e}")
    finally:
        conn.close()

def get_applications(limit=100, offset=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications ORDER BY applied_at DESC LIMIT ? OFFSET ?", (limit, offset))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# --- Self-Learning QA Helpers ---

def get_learned_answer(question_text, options=None):
    """
    Looks up a normalized question text to find if we've answered it successfully before.
    """
    normalized_q = question_text.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM learned_qa WHERE question_text = ?", (normalized_q,))
    row = cursor.fetchone()
    conn.close()
    if row:
        row_dict = dict(row)
        # Check if option set matches if specified
        if options and row_dict.get("question_options_json"):
            stored_opts = json.loads(row_dict["question_options_json"])
            # Order-independent option check
            if sorted([str(o).lower() for o in options]) != sorted([str(o).lower() for o in stored_opts]):
                return None
        return row_dict
    return None

def save_learned_answer(question_text, options, answer, is_success=1, error_feedback=None):
    """
    Saves or updates an answer to a question. If it resulted in an error (is_success=0),
    we flag it so the AI doesn't reuse it.
    """
    normalized_q = question_text.strip().lower()
    options_json = json.dumps(options) if options else None
    updated_at = datetime.utcnow().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO learned_qa (
            question_text, question_options_json, answer, is_success, error_feedback, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(question_text) DO UPDATE SET
            question_options_json = COALESCE(excluded.question_options_json, learned_qa.question_options_json),
            answer = excluded.answer,
            is_success = excluded.is_success,
            error_feedback = excluded.error_feedback,
            updated_at = excluded.updated_at
        """, (normalized_q, options_json, str(answer), int(is_success), error_feedback, updated_at))
        conn.commit()
    except Exception as e:
        print(f"Database error saving learned answer: {e}")
    finally:
        conn.close()

def get_all_learned_qa():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM learned_qa ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    qa_list = []
    for r in rows:
        d = dict(r)
        if d.get("question_options_json"):
            try:
                d["question_options"] = json.loads(d["question_options_json"])
            except Exception:
                d["question_options"] = []
        else:
            d["question_options"] = []
        qa_list.append(d)
    return qa_list

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
