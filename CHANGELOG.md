# Changelog

## 0.3.0

### Minor Changes

- Add useRecord flag for RecordAuthResponse support

  - Added optional `useRecord` boolean parameter to `pbParams()` function
  - When `useRecord` is true, strips "record." prefix from field names in build output
  - Supports type-safe access to token, meta, and record fields from auth responses
  - Auto-expand works with both "expand._" and "record.expand._" patterns
  - Maintains full backward compatibility

## 0.2.3

### Patch Changes

- Fix package entry points for proper module resolution

  Updated package.json to correctly map CJS and ESM builds:

  - main: points to dist/index.cjs (CommonJS)
  - module: points to dist/index.js (ESM)
  - Added proper exports field with types/import/require conditions
  - Fixed "Failed to resolve entry for package" error

## 0.2.2

### Patch Changes

- Fix build consistency between CommonJS and ESM outputs

  Both CJS and ESM builds now correctly implement auto-expand functionality (extracting expand relations from field paths starting with "expand.") instead of having inconsistent implementations where ESM had outdated manual expand methods.

## 0.2.1

### Patch Changes

- 15dc7c0: Add credits to README

## 0.2.0

### Minor Changes

- Auto-expand functionality and API improvements

  - **BREAKING**: Removed `expand()` and `expandIf()` methods - expand is now auto-generated from field paths
  - Added auto-expand functionality that automatically generates expand parameters from field paths starting with "expand."
  - New `FieldPath<T>` type for cleaner field suggestions without excessive modifiers
  - Simplified API eliminates redundancy between field selection and expansion
  - Removed pocketbase peer dependency - now zero dependencies
  - Improved TypeScript autocompletion experience
  - Updated documentation with new API examples and migration guide

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-26

### Added

- Auto-expand functionality that automatically generates expand parameters from field paths
- New `FieldPath<T>` type for cleaner field suggestions without modifiers
- Support for nested expand relations via `expand.relation.expand.nested` syntax

### Changed

- **BREAKING**: Removed `expand()` and `expandIf()` methods - expand is now auto-generated from field paths
- Field autocomplete suggestions are now cleaner and more practical
- Simplified API eliminates redundancy between field selection and expansion

### Improved

- Type safety improvements with dedicated field path types
- Better developer experience with more intuitive autocomplete
- Reduced boilerplate code for common use cases

### Migration Guide

Before (v0.1.0):

```typescript
pbParams<User>()
  .fields(["id", "expand.profile.bio", "expand.organization.name"])
  .expand(["profile", "organization"]) // Redundant!
  .build();
```

After (v0.1.1):

```typescript
pbParams<User>()
  .fields(["id", "expand.profile.bio", "expand.organization.name"])
  .build(); // Auto-generates: expand: "profile,organization"
```

## [0.1.0] - 2025-01-25

### Added

- Initial release of pb-params
- Type-safe PocketBase query parameter builder
- Support for filtering, field selection, expansion, sorting, and pagination
- Integration with pocketbase-typegen
- Fluent API with method chaining
- Conditional building with `*If()` methods
- Comprehensive TypeScript type system
