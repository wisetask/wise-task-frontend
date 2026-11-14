# WiseTask frontend v2

Новая версия фронтенда WiseTask. Пишется с нуля в ветке `v2`, старый код в `main` не трогаем, пока v2 не догонит его по функциям.

## Запуск

```bash
cp .env.example .env
npm install
npm run dev
```

Откроется `http://localhost:5173/sandbox` — песочница с моделью графа.

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер Vite |
| `npm run build` | проверка типов и сборка в `dist/` |
| `npm run typecheck` | только проверка типов |
| `npm test` | тесты Vitest |

## Стек

Vue 3 + TypeScript, Vite, Pinia, Vue Router, Vitest. Apollo, линтеры и CI добавляются отдельными задачами из бэклога (T03, T04, T07).

## Архитектура

Проект построен по [Feature-Sliced Design](https://feature-sliced.design/ru/). Слой импортирует только из слоёв ниже:

```
src/
  app/        точка входа, роутер, глобальные стили
  pages/      страницы, по папке на страницу
  widgets/    крупные блоки интерфейса (graph-canvas, шапка)
  features/   действия пользователя (инструменты графа, undo/redo, вход)
  entities/   сущности предметной области (graph, user, task)
  shared/     общий код без бизнес-логики (config, lib, ui, api)
```

Каждый модуль наружу отдаёт только то, что есть в его `index.ts`. Импорт из чужих внутренних папок (`@/entities/graph/model/...`) запрещён, только `@/entities/graph`.

## Адреса API

Только в `.env` (образец — `.env.example`), в коде их читает `src/shared/config/env.ts`.

## Правила работы

- Ветки фич — `feat/<что-делаем>` от `v2`, PR обратно в `v2`.
- Коммиты по Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`.
- Только `<script setup lang="ts">`, без Options API.
