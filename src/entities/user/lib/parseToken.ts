export interface TokenData {
  id: string;
  email: string;
  exp: number;
}

export function parseToken(token: string): TokenData | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) {
    return null;
  }

  try {
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const data = JSON.parse(atob(base64));

    if (
      typeof data.sub !== "string" ||
      typeof data.email !== "string" ||
      typeof data.exp !== "number"
    ) {
      return null;
    }

    return { id: data.sub, email: data.email, exp: data.exp };
  } catch {
    return null;
  }
}
