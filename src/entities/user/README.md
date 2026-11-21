# user

Текущий пользователь: кто вошёл и какая у него роль.

```ts
import { useUserStore } from "@/entities/user";

const userStore = useUserStore();
```

- `userStore.user` - `{ id, email, role, firstName, lastName, patronymic }` или `null`, если никто не вошёл.
- `userStore.isLoggedIn` - вошёл ли пользователь.
- `userStore.isLoading` - идёт загрузка профиля. Пока она идёт, роль неизвестна: например, guard должен дождаться её конца.
- `userStore.logIn(token)` - сохранить токен и загрузить профиль. Вызывается после входа или регистрации.
- `userStore.logOut()` - стереть токен и пользователя, очистить кэш Apollo. Куда перейти после выхода, решает вызывающий.

## Как устроено

Роли в токене нет, в нём только `sub` (id), `email`, `iat`, `exp`. Поэтому профиль с ролью загружается запросом `getMyProfile` (`api/myProfile.ts`): после входа и при старте приложения, если токен сохранён (`loadProfile()` вызывается в `app/main.ts`).

`parseToken(token)` (`lib/parseToken.ts`) достаёт из токена `id`, `email` и `exp` или возвращает `null`, если токен битый. По `exp` хранилище не отправляет на бэк заведомо просроченный токен.
