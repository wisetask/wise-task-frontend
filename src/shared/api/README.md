# shared/api

### Как сделать запрос.

Для начала нужно сделать импорт.

```ts
import { useQuery } from "@vue/apollo-composable";
import { graphql } from "@/shared/api";
```

Типы запросов лежат в `generated/`. После того как добавили или изменили запрос, перезапустите `npm run codegen`.
`graphql` -- функция для написания запросов.
`useQuery` -- функция для выполнения запроса.
Пример:
Запрос на кол-во плагинов.

```ts
const PluginsCountQuery = graphql(`
  query PluginsCount {
    getAllPlugins(request: { pagination: { page: 0, pageSize: 1 } }) {
      pagination {
        totalCount
      }
    }
  }
`);
const { result, error } = useQuery(PluginsCountQuery);
```

### Токен

- Весь доступ к токенам и работе с ними теперь в файле 'wise-task-frontend\src\shared\api\token.ts'

- `function getToken(): string | null` -- функция чтения токена
- `function setToken(token: string): void` -- функция записи токена
- `function removeToken(): void` -- функция удаления токена

Токен сам прикладывается к запросам. Логика в файле 'wise-task-frontend\src\shared\api\client.ts'

### Код возврата 401

При коде возврата 401 или ошибке `UNAUTHORIZED` токен стирается, вызывается обработчик, заданный через `setUnauthorizedHandler`. Решение принимает чистая функция `shouldEndSession` в `session.ts`. Запрос с `context: { keepSession: true }` не завершает сессию на `UNAUTHORIZED` в ответе — так делает смена пароля, потому что неверный текущий пароль бэк отдаёт как `UNAUTHORIZED`. HTTP 401 завершает сессию всегда.

Чтобы обновить схему, когда бэкенд поменяется, скачайте её заново из репозитория бэка и перезапустите codegen. Команды выполняются из корня проекта:

```bash
mkdir -p schema
for name in common graph plugin profile schema statistic task; do
  curl -sSL -o schema/$name.graphqls https://raw.githubusercontent.com/wisetask/wise-task-gateway/main/src/main/resources/graphql/$name.graphqls
done
npm run codegen
```

После форматирования файла с запросом (`npm run format`) codegen тоже нужно перезапустить: он находит запрос по точному тексту.
