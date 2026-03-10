# backend/database/supabase_client.py
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

# Public client for all services (respects RLS policies)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def supabase_for_user(access_token: str) -> Client:
    """
    Create a Supabase client that runs PostgREST queries as the logged-in user,
    so RLS policies apply and INSERT works if policy allows.
    """
    client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)
    return client