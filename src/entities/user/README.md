# user

Текущий пользователь: кто вошёл и какая у него роль.

```ts
import { useUserStore } from "@/entities/user";

const userStore = useUserStore();
```

- `userStore.user` - `{ id, email, role, firstName, lastName, patronymic }` или `null`, если никто не вошёл.
- `userStore.isLoggedIn` - вошёл ли пользователь.
- `userStore.isLoading` - идёт загрузка профиля. Пока она идёт, роль неизвестна.
- `await userStore.whenReady()` - дождаться текущей загрузки профиля. Так делает guard в `app/router.ts`.
- `userStore.logIn(token)` - сохранить токен и загрузить профиль. Вызывается после входа или регистрации.
- `userStore.logOut()` - стереть токен и пользователя, очистить кэш Apollo. Куда перейти после выхода, решает вызывающий.

## Как устроено

Роли в токене нет, в нём только `sub` (id), `email`, `iat`, `exp`. Поэтому профиль с ролью загружается запросом `getMyProfile` (`api/myProfile.ts`): после входа и при старте приложения, если токен сохранён (`loadProfile()` вызывается в `app/main.ts`).

## Доступ к страницам

`checkAccess(user, rule)` (`lib/checkAccess.ts`) решает, можно ли пользователю на страницу. `rule` - пометки маршрута: `{ requiresAuth: true }` (нужен вход) или `{ roles: ["AUTHOR", "ADMIN"] }` (только эти роли, вход тоже нужен). Возвращает `"allow"`, `"sign-in"` или `"forbidden"`. Пометки стоят в `meta` маршрутов в `app/router.ts`, там же guard, который по ответу ведёт на `/sign-in?redirect=...` или на `/forbidden`.

## Токен

`parseToken(token)` (`lib/parseToken.ts`) достаёт из токена `id`, `email` и `exp` или возвращает `null`, если токен битый. По `exp` хранилище не отправляет на бэк заведомо просроченный токен.
