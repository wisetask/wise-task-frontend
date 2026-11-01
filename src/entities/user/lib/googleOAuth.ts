export const GOOGLE_CLIENT_ID =
  "1004800199568-8lg34q8u9j80euf1trktripv04981p8e.apps.googleusercontent.com";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

export async function redirectToGoogleOAuth(): Promise<void> {
  const redirectUri = `${window.location.origin}/auth/google`;
  const state = crypto.randomUUID();
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64UrlEncode(randomBytes);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  sessionStorage.setItem("google_oauth_state", state);
  sessionStorage.setItem("google_oauth_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
