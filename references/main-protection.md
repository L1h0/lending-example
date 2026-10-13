# Защита main

`.github/main-ruleset.json` — готовая конфигурация для импорта в GitHub. Наличие файла в репозитории само по себе не включает защиту.

Проверка 13 октября 2026 года: `main` не защищён, список rulesets пуст. Подключение GitHub возвращает `403 Resource not accessible by integration` при чтении branch protection и не предоставляет операции изменения административных настроек.

## Включение владельцем

1. Открыть https://github.com/L1h0/lending-example/settings/rules.
2. Выбрать **New ruleset → Import a ruleset** и загрузить `.github/main-ruleset.json`.
3. Проверить ветку `main`, статус **Active**, обязательную проверку **verify** от GitHub Actions и нажать **Create**.

Правила требуют pull request и успешную проверку актуального кода, запрещают force push и удаление `main`. Разрешено слияние с сохранением отдельных коммитов. Исключений обхода нет.

Обязательное одобрение второго участника не включено: владелец сможет объединять собственные PR после успешных проверок. Когда появится второй разработчик, можно установить одно обязательное одобрение.

После создания открыть https://github.com/L1h0/lending-example/rules и убедиться, что правила активны для `main`.

Документация GitHub:

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository#importing-a-ruleset
- https://docs.github.com/en/rest/repos/rules#create-a-repository-ruleset
