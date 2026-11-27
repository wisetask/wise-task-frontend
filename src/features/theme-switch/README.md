# theme-switch

Переключатель дневной и ночной темы: кнопка `ThemeToggle` в шапке.

```vue
<ThemeToggle />
```

- Тема — атрибут `data-theme="day"` или `data-theme="night"` на `<html>`. Цвета обеих тем — переменные в `app/styles.css`: ночная тема просто переопределяет их в `:root[data-theme="night"]`, поэтому компонентам ничего про тему знать не нужно.
- Выбор сохраняется в `localStorage` под ключом `wisetask.theme`. Если ничего не сохранено, берётся тема системы (`prefers-color-scheme`).
- Чтобы при загрузке страница не мигала светлой темой, атрибут ставит маленький скрипт прямо в `index.html`, до загрузки приложения. Логика в нём та же, что в `initialTheme`.
- Иконки тоже графы: солнце — звезда (вершина с шестью рёбрами), луна — полумесяц с созвездием из двух вершин. При смене темы одна иконка поворачивается и исчезает, другая появляется.

## Файлы

- `model/theme.ts` — `parseTheme`, `initialTheme(stored, prefersDark)`, `nextTheme`, `toggleTitle`, работа с `localStorage` (`readStoredTheme`, `storeTheme`) и страницей (`currentTheme`, `applyTheme`);
- `ui/ThemeToggle.vue` — кнопка.
