# Common Pitfalls

Frequent mistakes and gotchas to avoid.

## 1. Entity Not Found Errors

**Symptom:**
```
EntityMetadataNotFoundError: No metadata for "MyEntity" was found
```

**Cause:**
- Entity not exported from `src/database/entities/index.ts`
- Entity not registered in module with `TypeOrmModule.forFeature()`

**Solution:**
```typescript
// 1. Export from index.ts
export * from './my-entity.entity';

// 2. Register in module
@Module({
  imports: [TypeOrmModule.forFeature([MyEntity])],
})
```

## 2. Migration Issues

**Symptom:**
- "No changes detected" when generating migration
- Migration generated but empty

**Cause:**
- Entity not exported from `index.ts`
- TypeORM can't detect entity changes

**Solution:**
1. Ensure entity exported from `index.ts`
2. Generate migration again
3. Verify entity has proper decorators

## 3. Docker Port Conflicts

**Symptom:**
```
Error: bind: address already in use
```

**Cause:**
- PostgreSQL/Redis already running on host
- Port 5432/6379/8080 already taken

**Solution:**
Change ports in `docker-compose.yml` and `.env`:
```yaml
ports:
  - '5433:5432'  # Use different host port
```

## 4. Test Database Not Created

**Symptom:**
```
database "snailmarket_test" does not exist
```

**Solution:**
```bash
createdb snailmarket_test
NODE_ENV=test npm run migration:run
```

## 5. Webpack vs ts-node Entity Loading

**Symptom:**
- Entities work in migrations but not at runtime
- Or vice versa

**Cause:**
Different entity loading methods:
- `app.module.ts` uses explicit imports (Webpack)
- `data-source.ts` uses glob patterns (ts-node)

**Solution:**
- Use explicit imports in `app.module.ts`
- Use glob patterns in `data-source.ts`
- See `architecture/database.md` for details

## 6. Zustand Infinite Loops

**Symptom:**
- Component re-renders infinitely
- Browser freezes

**Cause:**
Selector returns new object every render:
```typescript
// ❌ WRONG
const data = useStore((state) => ({ a: state.a, b: state.b }));
```

**Solution:**
Use atomic selectors:
```typescript
// ✅ CORRECT
const a = useStore((state) => state.a);
const b = useStore((state) => state.b);
```

See `frontend/zustand-patterns.md` for details.

## 7. Fixed Navbar Overlapping Content

**Symptom:**
- Content hidden behind navbar
- Page starts too high

**Cause:**
Navbar is `position: fixed`, overlays content.

**Solution:**
Add `padding-top: 80px` to page container:
```css
.my-page {
  padding-top: 80px;
}
```

See `frontend/styling-layout.md` for details.

## 8. Guest Cart Not Persisting

**Symptom:**
- Cart empty after page reload for guest users

**Cause:**
- Missing `x-session-id` header
- Session ID not stored in localStorage

**Solution:**
Check axios interceptor adds `x-session-id` header.

See `modules/cart.md` for details.

## 9. Production Migrations Failing

**Symptom:**
- Automatic migrations don't work in production

**Cause:**
Source files not available in production container (only `dist/main.js`).

**Solution:**
Run migrations manually via SQL.

See `production/migrations.md` for process.

## 10. FSM Invalid State Transition

**Symptom:**
```
BadRequestException: Invalid state transition
```

**Cause:**
Attempted transition not allowed by FSM.

**Solution:**
- Check FSM flow diagrams
- Use `OrderFSMService.canTransition()` first
- Follow valid state transitions

See `architecture/fsm.md` for state flows.

## Quick Checklist

When adding new entity:
- [ ] Create entity file with proper decorators
- [ ] Export from `src/database/entities/index.ts`
- [ ] Generate migration: `npm run migration:generate`
- [ ] Run migration: `npm run migration:run`
- [ ] Register in module: `TypeOrmModule.forFeature([Entity])`
- [ ] Import module in `app.module.ts`

When deploying to production:
- [ ] Tests pass locally
- [ ] Migrations reviewed
- [ ] Manual migration SQL prepared
- [ ] Environment variables updated
- [ ] Frontend built
- [ ] Backend builds successfully

When creating Zustand selector:
- [ ] Returns single primitive value
- [ ] NOT creating new object
- [ ] Using atomic selector pattern

## Related

- See `architecture/database.md` for entity loading
- See `frontend/zustand-patterns.md` for state management
- See `production/migrations.md` for production migrations
- See `development/database-ops.md` for migration commands
