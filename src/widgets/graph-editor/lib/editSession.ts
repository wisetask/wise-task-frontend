export interface EditSession {
  edit: (key: string) => void;
  finish: () => void;
}

export function createEditSession(onStart: () => void): EditSession {
  let currentKey = "";

  function edit(key: string) {
    if (key !== currentKey) {
      onStart();
      currentKey = key;
    }
  }

  function finish() {
    currentKey = "";
  }

  return { edit: edit, finish: finish };
}
