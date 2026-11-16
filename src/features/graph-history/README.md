# graph-history

Отмена и повтор действий в редакторе графа (undo/redo).

## Как подключить

Проще всего через `useGraphHistory` — он сам держит историю и говорит, можно ли сейчас отменить или повторить:

```ts
import { useGraphHistory } from "@/features/graph-history";

const graph = ref<Graph>(createEmptyGraph(false));
const history = useGraphHistory(graph);
const canUndo = history.canUndo;
const canRedo = history.canRedo;
```

`canUndo` и `canRedo` вынесены в отдельные переменные, чтобы в шаблоне можно было писать `:can-undo="canUndo"`: Vue сам разворачивает только переменные верхнего уровня, а `history.canUndo` в шаблоне останется объектом.

- `history.record(graph)` — сохранить снимок **до** изменения. Редактор сам вызывает это через событие `before-change`, вручную нужно только для изменений вне редактора (например, «Очистить»).
- `history.undo()` / `history.redo()` — отменить или повторить: граф в `graph` подменяется сам.
- `history.canUndo` / `history.canRedo` — можно ли сейчас отменить или повторить (для кнопок).
- `history.clear()` — забыть историю, например при открытии другой задачи.

## Как устроено

`GraphHistory` (`model/history.ts`) хранит до 100 снимков графа: прошлые и отменённые. Новая запись сбрасывает отменённые, как в любом редакторе. Граф не меняется на месте, поэтому снимок — это просто ссылка на прошлый граф, копировать ничего не нужно.

`useGraphHistory` (`model/useGraphHistory.ts`) — обёртка для Vue: после каждого действия обновляет `canUndo` и `canRedo`, чтобы кнопки сами становились активными и серыми.
