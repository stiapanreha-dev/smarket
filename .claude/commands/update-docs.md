Проанализируй последние изменения кода и обнови документацию в `.claude/contexts/`.

## Инструкции

1. Проверь последние коммиты:
   ```bash
   git log --oneline -10
   git diff --name-only HEAD~10 HEAD
   ```

2. Сопоставь измененные файлы с контекстами:
   - `src/modules/{name}/` → `.claude/contexts/modules/{name}.md`
   - `src/database/entities/` → `.claude/contexts/architecture/database.md`
   - `src/modules/orders/*fsm*` → `.claude/contexts/architecture/fsm.md`
   - `src/modules/cart/` → `.claude/contexts/modules/cart.md`
   - `client/src/store/` → `.claude/contexts/frontend/zustand-patterns.md`
   - `client/src/styles/` → `.claude/contexts/frontend/styling-layout.md`
   - `docker-compose.yml` → `.claude/contexts/reference/infrastructure.md`
   - `package.json` scripts → `.claude/contexts/development/commands.md`

3. Прочитай затронутые контекстные файлы

4. Предложи конкретные обновления в формате:
   ```
   ## Файл: .claude/contexts/modules/{name}.md

   ### Секция для обновления: {section}

   **Текущий текст:**
   ...

   **Предлагаемый текст:**
   ...
   ```

5. Примени одобренные изменения

## Приоритеты

**HIGH (обновить немедленно):**
- TypeORM entity loading patterns
- Zustand selector patterns
- Cart guest session management
- FSM state transitions
- Production migration procedures

**MEDIUM:**
- Новые эндпоинты API
- Изменения в компонентах

**LOW:**
- Рефакторинг без изменения интерфейсов
- Исправления опечаток

## Использование

```
/update-docs                  # Проверить все контексты
/update-docs cart             # Проверить контекст cart модуля
/update-docs architecture     # Проверить архитектурные контексты
```

## Когда использовать

- После мержа feature branch
- При добавлении новых модулей или эндпоинтов
- После рефакторинга паттернов
- Перед созданием PR (убедиться что docs актуальны)
