# features

Действия пользователя, которые что-то меняют: `graph-tools`, `graph-history`, `graph-normalize`, `auth-by-email`.

Можно импортировать из `entities` и `shared`.

## GraphHistory

Импортируйте `GraphHistory` из `@/features/graph-history` и создайте один экземпляр на редактор. Перед изменением вызовите `history.record(graph)` с текущим графом. При перетаскивании вершины сохраняйте снимок один раз перед первым сдвигом.

Для отмены и повтора присвойте графу результат `history.undo(graph)` или `history.redo(graph)`. Доступность кнопок проверяйте через `canUndo()` и `canRedo()`. Новая запись сбрасывает redo. При открытии другой задачи вызовите `history.clear()`.
