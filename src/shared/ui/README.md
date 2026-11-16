# shared/ui

Общие компоненты интерфейса. Импортируются из одного места:

```ts
import { UiButton, UiCheckbox, UiTextField } from "@/shared/ui";
```

- `UiButton` — кнопка. `variant`: `primary`, `secondary` (по умолчанию), `ghost`, `danger`; `size`: `md` или `sm`; `type`: `button` или `submit`; `loading` показывает крутилку и блокирует кнопку.
- `UiTextField` — поле ввода с подписью: `v-model`, `label`, `type` (`text`, `email`, `password`), `inputmode` — какую клавиатуру показать на телефоне (`decimal` для чисел), `hint` — подсказка под полем, `error` — текст ошибки (поле подсвечивается красным).
- `UiCheckbox` — галочка с подписью: `v-model`, `label`.

Цвета, отступы, скругления и размеры шрифта берутся из CSS-переменных в `src/app/styles.css`. Своих цветов в компонентах не пишем.

Все состояния можно посмотреть на странице `/ui-kit`.
