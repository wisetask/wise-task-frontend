export const GOOGLE_CLIENT_ID =
  "1004800199568-8lg34q8u9j80euf1trktripv04981p8e.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export const loadGoogleIdentity = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.google?.accounts?.id
          ? resolve()
          : reject(new Error("Google Identity Services не загрузился."));
      }, { once: true });

      existingScript.addEventListener("error", () => {
        reject(new Error("Не удалось загрузить Google Identity Services."));
      }, { once: true });

      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.google?.accounts?.id
        ? resolve()
        : reject(new Error("Google Identity Services не загрузился."));
    };

    script.onerror = () => {
      reject(new Error("Не удалось загрузить Google Identity Services."));
    };

    document.head.appendChild(script);
  });
};

export const initializeGoogleButton = async (
  element: HTMLElement
): Promise<void> => {
  await loadGoogleIdentity();

  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity Services не загрузился.");
  }

  element.innerHTML = "";

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,

    callback: (response) => {
      if (!response.credential) {
        console.error("[Google Auth] Google не вернул ID token.");
        return;
      }

      sessionStorage.setItem("google_id_token", response.credential);
      window.location.href = "/auth/google";
    },
  });

  window.google.accounts.id.renderButton(element, {
    theme: "outline",
    size: "large",
    width: 320,
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "left",
    locale: "ru",
  });
};