import os
from dotenv import load_dotenv

# Load env variables from backend directory or parent
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TAILORED_RESUMES_DIR = os.path.join(BASE_DIR, "tailored_resumes")

# Ensure tailored resumes directory exists
os.makedirs(TAILORED_RESUMES_DIR, exist_ok=True)

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# LinkedIn Cookie
LINKEDIN_LI_AT = os.getenv("LINKEDIN_LI_AT", "")

# Chrome/Browser settings
CHROME_PROFILE_PATH = os.getenv("CHROME_PROFILE_PATH", os.path.join(BASE_DIR, "chrome_profile"))
HEADLESS_MODE = os.getenv("HEADLESS_MODE", "false").lower() == "true"

# Job Bot limits
DAILY_APPLICATION_CAP = int(os.getenv("DAILY_APPLICATION_CAP", "30"))
HUMAN_DELAY_MIN = float(os.getenv("HUMAN_DELAY_MIN", "1.5"))
HUMAN_DELAY_MAX = float(os.getenv("HUMAN_DELAY_MAX", "4.0"))
MAX_FORM_RETRIES = int(os.getenv("MAX_FORM_RETRIES", "3"))

print(f"Config loaded. Resumes dir: {TAILORED_RESUMES_DIR}")
