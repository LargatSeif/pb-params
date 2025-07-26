# Release Procedure

This document outlines the complete procedure for releasing new versions of pb-params, from code changes to npm publication.

## Prerequisites

- Node.js 18+
- pnpm installed
- npm account with 2FA enabled
- Write access to the repository

## Step-by-Step Release Process

### 1. Development & Testing

```bash
# Make your code changes
# ...

# Run full test suite
pnpm check:all
```

This command runs:
- Tests with type checking
- Build process
- Linting
- TypeScript compilation

### 2. Create Changeset

```bash
# Create a changeset describing your changes
pnpm changeset
```

If the interactive prompt doesn't work, create manually:

```bash
# Create .changeset/your-change-name.md
---
"pb-params": patch  # or minor/major
---

Description of your changes

- Feature 1
- Feature 2
- Breaking change (if any)
```

**Version Types:**
- **patch**: Bug fixes, minor improvements
- **minor**: New features, breaking changes in pre-1.0
- **major**: Breaking changes in 1.0+

### 3. Update Documentation

Update relevant documentation:
- [ ] README.md (if API changed)
- [ ] Examples (if new features)
- [ ] Migration guides (if breaking changes)

### 4. Version & Release

```bash
# Generate version bump and update CHANGELOG
pnpm changeset version

# Commit the changes
git add .
git commit -m "Release vX.X.X - Brief description"

# Create git tag
git tag -a vX.X.X -m "vX.X.X - Brief description"

# Publish to npm (requires OTP)
pnpm changeset publish --otp=YOUR_6_DIGIT_CODE
```

### 5. Post-Release

```bash
# Push changes and tags to repository
git push origin main
git push origin --tags
```

## File Changes During Release

The changeset process automatically updates:

1. **package.json** - Version number
2. **CHANGELOG.md** - New release section with changes
3. **Removes changeset file** - The .changeset/*.md file is deleted

## Common Issues & Solutions

### "Cannot publish over previously published version"

This means the version already exists on npm. Either:
- The changeset version wasn't run
- You're trying to republish the same version

**Solution:** Create a new changeset and run `pnpm changeset version` again.

### OTP Issues

If your OTP expires or fails:
- Get a fresh code from your authenticator
- Run the publish command again with new OTP

### Interactive Prompts Not Working

If `pnpm changeset` fails to show interactive prompts:
- Create the changeset file manually in `.changeset/`
- Follow the YAML frontmatter format shown above

## Changesets Configuration

Located in `.changeset/config.json`:

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

## Quality Gates

Before any release, ensure:

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No linting errors (`pnpm lint:check`)
- [ ] TypeScript compiles (`pnpm typecheck`)
- [ ] Documentation is updated
- [ ] Breaking changes are documented

## Emergency Hotfix Procedure

For critical bugs that need immediate release:

1. Create hotfix branch from main
2. Make minimal fix
3. Create patch changeset
4. Follow normal release procedure
5. Merge back to main

## Release Artifacts

Each release generates:
- npm package with CJS, ESM, and TypeScript definitions
- Git tag
- Updated CHANGELOG.md
- GitHub release (if using GitHub Actions)

## Rollback Procedure

If a release has critical issues:

1. **npm deprecate**: `npm deprecate pb-params@X.X.X "Reason for deprecation"`
2. **Create hotfix**: Follow emergency procedure above
3. **Communicate**: Update users about the issue and fix

## Automation Opportunities

Consider setting up:
- GitHub Actions for automated releases
- Automated testing on multiple Node.js versions
- Automated security scanning
- Automated dependency updates