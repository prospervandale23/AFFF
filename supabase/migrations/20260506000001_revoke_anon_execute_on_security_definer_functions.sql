-- Revoke anon EXECUTE on all SECURITY DEFINER functions that require authentication.
-- The most critical case is delete_user_account() which was callable without a session.

REVOKE EXECUTE ON FUNCTION public.block_user(uuid)                                                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_user_account()                                                     FROM anon;
REVOKE EXECUTE ON FUNCTION public.find_nearby_anglers(numeric, numeric, numeric, text, integer)             FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_blocked_user_ids()                                                    FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_uid()                                                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_nearby_profiles(double precision, double precision, double precision, text, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid)                                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                                                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_real_user()                                                            FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()                                                         FROM anon;
REVOKE EXECUTE ON FUNCTION public.send_message(uuid, text)                                                  FROM anon;
REVOKE EXECUTE ON FUNCTION public.unblock_user(uuid)                                                        FROM anon;
REVOKE EXECUTE ON FUNCTION public.users_are_blocked(uuid, uuid)                                             FROM anon;

-- PostGIS internals exposed in the public schema
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text)                FROM anon;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon;
