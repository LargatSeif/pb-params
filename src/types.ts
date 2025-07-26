import type { DATETIME_MACROS } from './constants'

// Basic types
export type DatetimeMacro = (typeof DATETIME_MACROS)[number]

// Collection-aware types that work with pocketbase-typegen output
export type CollectionName = string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollectionRecord = Record<string, any>

// Enhanced path type that works with collection records
type DepthCounter = [1, 2, 3, 4, 5, 6, never]

// Field path type without modifiers for field selection
export type FieldPath<T> = BaseFieldPath<T> | ExpandFieldPath<T>

type BaseFieldPath<T> = {
    [K in keyof T]: K extends string 
      ? T[K] extends object 
        ? K | `${K}.${BaseFieldPath<T[K]>}`
        : K
      : never
}[keyof T]

type ExpandFieldPath<T> = T extends { expand: infer E }
  ? {
      [K in keyof E]: K extends string
        ? E[K] extends object
          ? `expand.${K}` | `expand.${K}.${BaseFieldPath<E[K]>}` | ExpandNestedField<E[K], `expand.${K}`>
          : `expand.${K}`
        : never
    }[keyof E]
  : never

type ExpandNestedField<T, Prefix extends string> = T extends { expand: infer E }
  ? {
      [K in keyof E]: K extends string
        ? E[K] extends object
          ? `${Prefix}.expand.${K}` | `${Prefix}.expand.${K}.${BaseFieldPath<E[K]>}`
          : `${Prefix}.expand.${K}`
        : never
    }[keyof E]
  : never

export type Path<
    T,
    MaxDepth extends number = 6,
    K extends keyof T = keyof T,
    D extends number = 0,
> = D extends MaxDepth
    ? never
    : K extends string // This filters out symbol keys
      ? KeyPaths<T, K, MaxDepth, D> // Now K is guaranteed to be string key
      : never

type KeyPaths<
    T,
    K extends string & keyof T,
    MaxDepth extends number,
    D extends number,
> = T[K] extends string
    ? `${K}` | `${K}:lower`
    : T[K] extends readonly object[]
      ?
            | `${K}`
            | `${K}:each`
            | `${K}:length`
            | `${K}.${Path<T[K][number], MaxDepth, keyof T[K][number], DepthCounter[D]>}`
      : T[K] extends readonly unknown[]
        ? `${K}` | `${K}:each` | `${K}:length`
        : T[K] extends Date
          ? `${K}`
          : T[K] extends object
            ?
                  | `${K}`
                  | `${K}.${Path<T[K], MaxDepth, keyof T[K], DepthCounter[D]>}`
                  | `${string}_via_${K}`
                  | `${string}_via_${K}.${string}`
            : `${K}`

// Path value type for type-safe value assignments
type PathValueHelper<
    T,
    P extends string,
    MaxDepth extends number,
    D extends number,
> = P extends `${string}_via_${string}`
    ? unknown
    : P extends `${infer Key}.${infer Rest}`
      ? Key extends keyof T
          ? T[Key] extends readonly (infer E)[]
              ? PathValue<E, Rest, MaxDepth, DepthCounter[D]> 
              : PathValue<T[Key], Rest, MaxDepth, DepthCounter[D]> 
          : never
      : P extends `${infer Key}:${infer Modifier}`
        ? Key extends keyof T
            ? HandleModifier<T[Key], Modifier>
            : never
        : P extends keyof T
          ? T[P] extends object[]
              ? string
              : T[P] extends unknown[]
                ? T[P][number]
                : T[P] extends Date
                  ? T[P] | DatetimeMacro
                  : T[P] extends object
                    ? string
                    : T[P]
          : never

export type PathValue<
    T,
    P extends string,
    MaxDepth extends number = 6,
    D extends number = 0,
> = D extends MaxDepth ? never : PathValueHelper<T, P, MaxDepth, D>

export type HandleModifier<V, Modifier extends string> = Modifier extends 'each'
    ? V extends number[]
        ? number
        : string
    : Modifier extends 'length'
      ? number
      : Modifier extends 'lower'
        ? string
        : never

// Filter builder interface - similar to pb-query but enhanced
export interface FilterBuilder<T extends CollectionRecord> {
    equal<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    notEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    greaterThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    greaterThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    lessThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    lessThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    like<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    notLike<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyNotEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyGreaterThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyGreaterThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyLessThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyLessThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyLike<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>
    anyNotLike<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T>

    // Helper methods
    search<P extends Path<T>>(keys: P[], value: PathValue<T, P>): RestrictedFilterBuilder<T>
    in<P extends Path<T>>(key: P, values: PathValue<T, P>[]): RestrictedFilterBuilder<T>
    notIn<P extends Path<T>>(key: P, values: PathValue<T, P>[]): RestrictedFilterBuilder<T>
    between<P extends Path<T>>(key: P, from: PathValue<T, P>, to: PathValue<T, P>): RestrictedFilterBuilder<T>
    notBetween<P extends Path<T>>(key: P, from: PathValue<T, P>, to: PathValue<T, P>): RestrictedFilterBuilder<T>
    isNull<P extends Path<T>>(key: P): RestrictedFilterBuilder<T>
    isNotNull<P extends Path<T>>(key: P): RestrictedFilterBuilder<T>
    custom(raw: string): RestrictedFilterBuilder<T>
    group(callback: (q: FilterBuilder<T>) => RestrictedFilterBuilder<T>): RestrictedFilterBuilder<T>
}

export interface RestrictedFilterBuilder<T extends CollectionRecord> {
    and(): FilterBuilder<T>
    or(): FilterBuilder<T>
}

// Callback type for filter building
export type FilterCallback<T extends CollectionRecord> = (
    builder: FilterBuilder<T>
) => RestrictedFilterBuilder<T>

// Main parameters builder interface
export interface ParamsBuilder<T extends CollectionRecord> {
    // Filter methods
    filter(callback: FilterCallback<T>): ParamsBuilder<T>
    filterIf(condition: boolean, callback: FilterCallback<T>): ParamsBuilder<T>
    
    // Field selection
    fields(fields: FieldPath<T>[]): ParamsBuilder<T>
    fieldsIf(condition: boolean, fields: FieldPath<T>[]): ParamsBuilder<T>
    
    // Note: Expansion is now auto-generated from field paths starting with "expand."
    
    // Sorting
    sort(fields: (`${Path<T>}` | `-${Path<T>}`)[]): ParamsBuilder<T>
    sortIf(condition: boolean, fields: (`${Path<T>}` | `-${Path<T>}`)[]): ParamsBuilder<T>
    
    // Pagination
    page(page: number, perPage?: number): ParamsBuilder<T>
    
    // Build methods
    build(): QueryParams
    buildTyped(): TypedBuildResult<T>
}

// Query parameters object (compatible with PocketBase SDK)
export interface QueryParams {
    filter?: string
    fields?: string
    expand?: string
    sort?: string
    page?: number
    perPage?: number
}

// Build result types
export interface BuildResult {
    params: QueryParams
    raw: {
        filter: string
        values: Record<string, unknown>
    }
}

export interface TypedBuildResult<T> extends BuildResult {
    resultType: T // Type inference for result shape
}

// Raw query object for filter building
export interface RawQueryObject {
    raw: string
    values: Record<string, unknown>
}

// Filter function type (compatible with PocketBase)
export type FilterFunction = (
    raw: string,
    params?: Record<string, unknown>
) => string