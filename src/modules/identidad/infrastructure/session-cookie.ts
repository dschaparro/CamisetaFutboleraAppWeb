export const SESSION_COOKIE = "cf_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
