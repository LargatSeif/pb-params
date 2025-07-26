# Changelog

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
