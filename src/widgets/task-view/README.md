# task-view

Задача на граф глазами студента: как её показать и как показать результат проверки. Используют страница решения задачи (`pages/task`) и просмотр решения (`pages/solution`).

## Что внутри

- `TaskCondition` (`ui/TaskCondition.vue`) — левая колонка с условием: категория, название, автор, описание, подсказки, «Граф задачи» только для просмотра (`GraphCanvas readonly`) и «Что проверяется». Пропсы: `view` (`TaskView`) и `hints` (строки).
- `CheckResultNotice` (`ui/CheckResultNotice.vue`) — плашка с результатом проверки: «Верно!» или список непройденных проверок. Пропсы: `result` (`CheckResult`), необязательные `successText` и `failureText`.
- `lib/taskView.ts` — задача с бэка → `TaskView`:
  - `toTaskView(task, loadedGraph)` — граф через `fromBackendGraph`, правила `rule` → правила редактора (`rulesFromBackend`, `isEdit` включает и добавление, и подписи), условия → список проверок (`checkText` даёт только название проверки, без значения). Граф без вершин считается отсутствующим (так в базе хранятся задачи на построение графа). Возвращает `null` для задач на код;
  - `answerStartsFromTask`, `startAnswer`, `canPickDirection` — с чего начинается ответ: с копии графа задачи, если он есть, иначе с пустого поля;
  - `taskHints` — подсказки студенту;
  - `graphToLoad(graph)` — id графа, если бэк прислал его только ссылкой (без вершин).
- `lib/checkResult.ts` — ответ проверки → `CheckResult`: `toCheckResult` берёт текст ошибки у автора задачи (`mistakeText` условия), иначе `pluginMessage`, иначе «Не выполнено: <плагин>»; для чисел и строк пишет, что получилось у студента; при `isHiddenMistake` оставляет только первую ошибку.
- `lib/loadGraph.ts` — `loadFullGraph(graph)`: если граф пришёл только ссылкой, догружает его запросом `getGraphById` (`api/getGraph.ts`), иначе возвращает как есть. `tryLoadFullGraph` делает то же, но вместо ошибки возвращает `null`: бывает, что ссылка ведёт на граф, которого в сервисе графов нет.

После изменения запроса в `api/getGraph.ts` нужно перезапустить `npm run codegen`.
