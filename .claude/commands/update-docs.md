Check all context files in `.claude/contexts/` for outdated information and suggest updates based on recent code changes.

## Usage

```
/update-docs                  # Check all context files
/update-docs cart             # Check cart module context
/update-docs architecture     # Check architecture contexts
/update-docs --help           # Show help
```

## What This Does

Invokes the @documentation-updater agent to:
1. Analyze recent code changes (last 10 commits)
2. Identify affected context files
3. Compare current documentation with actual code
4. Propose specific updates
5. Apply approved updates

## When to Use

- After merging a feature branch
- When adding new modules or endpoints
- After refactoring that changes patterns
- Before creating PR (ensure docs are current)
- When onboarding new team members (verify docs are accurate)

## Examples

**Check all contexts after feature work:**
```
/update-docs
```

**Check specific module after changes:**
```
/update-docs cart
```

**Check architecture docs after refactoring:**
```
/update-docs architecture
```

## Related Commands

- Use @documentation-updater directly for more control
- Use @code-reviewer which will remind about doc updates
- Check `.claude/contexts/README.md` for context file index
