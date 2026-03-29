import os
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client

# Load .env from backend folder
load_dotenv()

# Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("GEMINI_API_KEY exists:", bool(GEMINI_API_KEY))
print("GEMINI_API_KEY prefix:", GEMINI_API_KEY[:12] if GEMINI_API_KEY else "NONE")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY")

# Supabase public client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
if not SUPABASE_URL:
    raise RuntimeError("Missing SUPABASE_URL")
if not SUPABASE_ANON_KEY:
    raise RuntimeError("Missing SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.5-flash")
