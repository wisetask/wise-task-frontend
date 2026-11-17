import { onBeforeUnmount, onMounted, ref } from "vue";
import { DEFAULT_HOTKEYS, findHotkey, type HotkeyAction } from "./hotkeys";
import { isTyping } from "./pointer";

interface EditorKeysOptions {
  isEnabled: () => boolean;
  onAction: (action: HotkeyAction) => void;
}

export function useEditorKeys(options: EditorKeysOptions) {
  const isSpaceHeld = ref(false);

  function onKeyDown(event: KeyboardEvent) {
    if (!options.isEnabled() || isTyping(event)) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      isSpaceHeld.value = true;
      return;
    }
    const action = findHotkey(event, DEFAULT_HOTKEYS);
    if (action === null) {
      return;
    }
    event.preventDefault();
    options.onAction(action);
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.code === "Space") {
      isSpaceHeld.value = false;
    }
  }

  function onBlur() {
    isSpaceHeld.value = false;
  }

  onMounted(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  });

  return {
    isSpaceHeld: isSpaceHeld,
  };
}
