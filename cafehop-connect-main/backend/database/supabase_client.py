# backend/database/supabase_client.py
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Use ONLY for server-side admin tasks (never send this key to frontend)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Public client (still needs user token to pass RLS for protected tables)
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def supabase_for_user(access_token: str) -> Client:
    """
    Create a Supabase client that runs PostgREST queries as the logged-in user,
    so RLS policies apply and INSERT works if policy allows.
    """
    client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)  
    return client