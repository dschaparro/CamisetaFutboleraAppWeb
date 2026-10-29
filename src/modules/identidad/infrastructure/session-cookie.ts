export const SESSION_COOKIE = "cf_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  // Con ngrok (APP_URL https) la cookie debe ir Secure; si no, el navegador la ignora.
  const https =
    process.env.NODE_ENV === "production" ||
    (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
  return {
    httpOnly: true,
    secure: https,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
