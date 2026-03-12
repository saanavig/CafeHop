# backend/database/supabase_client.py

from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
import os

# service role key (bypasses RLS for trusted backend operations)
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Public client (respects RLS policies)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Admin client (bypasses RLS)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def supabase_for_user(access_token: str) -> Client:
    """
    Create a Supabase client that runs PostgREST queries as the logged-in user.
    RLS policies apply.
    """
    client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.postgrest.auth(access_token)
    return client