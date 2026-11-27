import { comboText, type Hotkey, type HotkeyAction } from "./hotkeys";

export interface HelpRow {
  title: string;
  keys: string[];
}

export interface HelpSection {
  title: string;
  rows: HelpRow[];
}

interface HelpRowSource {
  title: string;
  actions: HotkeyAction[];
}

interface HelpSectionSource {
  title: string;
  rows: HelpRowSource[];
}

const HELP_SOURCES: HelpSectionSource[] = [
  {
    title: "Инструменты",
    rows: [
      { title: "Выбор и перемещение", actions: ["tool-select"] },
      { title: "Рука — двигать холст", actions: ["tool-pan"] },
      { title: "Вершина", actions: ["tool-vertex"] },
      { title: "Ребро", actions: ["tool-edge"] },
      { title: "Удаление", actions: ["tool-delete"] },
    ],
  },
  {
    title: "Правка",
    rows: [
      { title: "Отменить", actions: ["undo"] },
      { title: "Повторить", actions: ["redo"] },
      { title: "Выделить всё", actions: ["select-all"] },
      { title: "Снять выделение", actions: ["cancel"] },
      { title: "Копировать", actions: ["copy"] },
      { title: "Вырезать", actions: ["cut"] },
      { title: "Вставить", actions: ["paste"] },
      { title: "Дублировать", actions: ["duplicate"] },
      { title: "Удалить выделенное", actions: ["delete"] },
      { title: "Переименовать вершину или ребро", actions: ["rename"] },
      {
        title: "Сдвинуть выделенные вершины",
        actions: ["move-up", "move-down", "move-left", "move-right"],
      },
      {
        title: "Сдвинуть на 10",
        actions: ["move-up-far", "move-down-far", "move-left-far", "move-right-far"],
      },
    ],
  },
  {
    title: "Вид",
    rows: [
      { title: "Приблизить", actions: ["zoom-in"] },
      { title: "Отдалить", actions: ["zoom-out"] },
      { title: "Масштаб 100%", actions: ["zoom-reset"] },
      { title: "Показать весь граф", actions: ["zoom-fit"] },
      { title: "Показать выделенное", actions: ["zoom-selection"] },
      { title: "Горячие клавиши", actions: ["help"] },
    ],
  },
];

export const MOUSE_HELP: HelpSection = {
  title: "Мышь и тачпад",
  rows: [
    { title: "Добавить к выделению или убрать из него", keys: ["Ctrl+клик", "Shift+клик"] },
    { title: "Выделить рамкой (инструмент «Выбор»)", keys: ["Тянуть по пустому месту"] },
    { title: "Провести ребро (инструмент «Ребро»)", keys: ["Тянуть от вершины к вершине"] },
    { title: "Переименовать", keys: ["Двойной клик"] },
    { title: "Двигать холст", keys: ["Пробел+тянуть", "Средняя кнопка", "Два пальца"] },
    { title: "Масштаб", keys: ["Колёсико", "Щипок"] },
    { title: "Меню", keys: ["Правая кнопка"] },
  ],
};

function isLayoutTwin(hotkey: Hotkey, hotkeys: Hotkey[]): boolean {
  if (!hotkey.shift || hotkey.ctrl) {
    return false;
  }
  for (const other of hotkeys) {
    if (
      other.action === hotkey.action &&
      other.code === hotkey.code &&
      !other.shift &&
      !other.ctrl
    ) {
      return true;
    }
  }
  return false;
}

export function actionKeys(action: HotkeyAction, hotkeys: Hotkey[]): string[] {
  const keys: string[] = [];
  for (const hotkey of hotkeys) {
    if (hotkey.action !== action || isLayoutTwin(hotkey, hotkeys)) {
      continue;
    }
    const text = comboText(hotkey);
    if (!keys.includes(text)) {
      keys.push(text);
    }
  }
  return keys;
}

export function hotkeyHelp(hotkeys: Hotkey[]): HelpSection[] {
  const sections: HelpSection[] = [];
  for (const source of HELP_SOURCES) {
    const rows: HelpRow[] = [];
    for (const rowSource of source.rows) {
      let keys: string[] = [];
      for (const action of rowSource.actions) {
        keys = keys.concat(actionKeys(action, hotkeys));
      }
      if (keys.length > 0) {
        rows.push({ title: rowSource.title, keys: keys });
      }
    }
    if (rows.length > 0) {
      sections.push({ title: source.title, rows: rows });
    }
  }
  sections.push(MOUSE_HELP);
  return sections;
}

export function filterHelp(sections: HelpSection[], query: string): HelpSection[] {
  const text = query.trim().toLowerCase();
  if (text === "") {
    return sections;
  }
  const result: HelpSection[] = [];
  for (const section of sections) {
    const rows: HelpRow[] = [];
    for (const row of section.rows) {
      const keysText = row.keys.join(" ").toLowerCase();
      if (row.title.toLowerCase().includes(text) || keysText.includes(text)) {
        rows.push(row);
      }
    }
    if (rows.length > 0) {
      result.push({ title: section.title, rows: rows });
    }
  }
  return result;
}
