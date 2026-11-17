import { computed, ref } from "vue";
import type { Graph } from "@/entities/graph";
import {
  buildMenuItems,
  hasColorChoice,
  menuHeight,
  menuPosition,
  targetColor,
  type MenuTarget,
} from "./contextMenu";
import type { Point } from "./geometry";
import type { GraphSelection } from "./selection";

interface OpenMenu {
  target: MenuTarget;
  left: number;
  top: number;
}

export function useCanvasMenu(getGraph: () => Graph, getSelection: () => GraphSelection | null) {
  const menu = ref<OpenMenu | null>(null);

  const items = computed(() => {
    if (menu.value === null) {
      return [];
    }
    return buildMenuItems(getGraph(), menu.value.target);
  });

  const showColors = computed(() => menu.value !== null && hasColorChoice(menu.value.target));

  const currentColor = computed(() => {
    if (menu.value === null) {
      return null;
    }
    return targetColor(getGraph(), menu.value.target, getSelection());
  });

  function open(target: MenuTarget, point: Point, boxWidth: number, boxHeight: number) {
    const count = buildMenuItems(getGraph(), target).length;
    const height = menuHeight(count, hasColorChoice(target));
    const position = menuPosition(point.x, point.y, height, boxWidth, boxHeight);
    menu.value = { target: target, left: position.left, top: position.top };
  }

  function close() {
    menu.value = null;
  }

  function takeTarget(): MenuTarget | null {
    if (menu.value === null) {
      return null;
    }
    const target = menu.value.target;
    close();
    return target;
  }

  return {
    menu: menu,
    items: items,
    showColors: showColors,
    currentColor: currentColor,
    open: open,
    close: close,
    takeTarget: takeTarget,
  };
}
