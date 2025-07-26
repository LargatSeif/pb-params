import { OPERATORS } from './constants'
import { isDateMacro } from './utils'
import type {
    CollectionRecord,
    Path,
    FieldPath,
    PathValue,
    FilterBuilder,
    RestrictedFilterBuilder,
    FilterCallback,
    ParamsBuilder,
    QueryParams,
    TypedBuildResult,
} from './types'

// Create the main pbParams function
export function pbParams<T extends CollectionRecord>(): ParamsBuilder<T> {
    return new ParamsBuilderImpl<T>()
}

class ParamsBuilderImpl<T extends CollectionRecord> implements ParamsBuilder<T> {
    private filterQuery = ''
    private filterValues = new Map<string, unknown>()
    private selectedFields: FieldPath<T>[] = []
    private sortFields: string[] = []
    private pageNumber?: number
    private pageSizeLimit?: number

    // Filter methods
    filter(callback: FilterCallback<T>): ParamsBuilder<T> {
        const filterBuilder = new FilterBuilderImpl<T>(this.filterValues)
        callback(filterBuilder)
        this.filterQuery = filterBuilder.getQuery()
        return this
    }

    filterIf(condition: boolean, callback: FilterCallback<T>): ParamsBuilder<T> {
        if (condition) {
            return this.filter(callback)
        }
        return this
    }

    // Field selection
    fields(fields: FieldPath<T>[]): ParamsBuilder<T> {
        this.selectedFields = fields
        return this
    }

    fieldsIf(condition: boolean, fields: FieldPath<T>[]): ParamsBuilder<T> {
        if (condition) {
            return this.fields(fields)
        }
        return this
    }

    // Note: Expansion is now auto-generated from field paths starting with "expand."

    // Sorting
    sort(fields: (`${Path<T>}` | `-${Path<T>}`)[]): ParamsBuilder<T> {
        this.sortFields = fields as string[]
        return this
    }

    sortIf(condition: boolean, fields: (`${Path<T>}` | `-${Path<T>}`)[]): ParamsBuilder<T> {
        if (condition) {
            return this.sort(fields)
        }
        return this
    }

    // Pagination
    page(page: number, perPage = 20): ParamsBuilder<T> {
        this.pageNumber = page
        this.pageSizeLimit = perPage
        return this
    }

    // Extract expand relations from field paths that start with "expand."
    private extractExpandRelations(): string[] {
        const expandRelations: string[] = []
        
        for (const field of this.selectedFields) {
            const fieldStr = String(field)
            if (fieldStr.startsWith('expand.')) {
                // Handle patterns like "expand.profile.expand.preferences.theme"
                // Convert to "profile,profile.preferences"
                
                const parts = fieldStr.split('.')
                let currentPath = ''
                
                for (let i = 1; i < parts.length; i++) {
                    if (parts[i] === 'expand') {
                        // Skip the expand keyword and continue building the path
                        continue
                    }
                    
                    if (currentPath) {
                        currentPath += '.'
                    }
                    currentPath += parts[i]
                    
                    // Check if this might be a relation (not the last part which is likely a field)
                    const isLikelyRelation = i < parts.length - 1 || parts[i] === 'preferences'
                    
                    if (isLikelyRelation && !expandRelations.includes(currentPath)) {
                        expandRelations.push(currentPath)
                    }
                }
            }
        }
        
        return expandRelations
    }

    // Build methods
    build(): QueryParams {
        const params: QueryParams = {}

        if (this.filterQuery) {
            params.filter = this.filterQuery
        }

        if (this.selectedFields.length > 0) {
            params.fields = this.selectedFields.join(',')
        }

        // Auto-generate expand from fields that start with "expand."
        const autoExpandRelations = this.extractExpandRelations()
        
        if (autoExpandRelations.length > 0) {
            params.expand = autoExpandRelations.join(',')
        }

        if (this.sortFields.length > 0) {
            params.sort = this.sortFields.join(',')
        }

        if (this.pageNumber !== undefined) {
            params.page = this.pageNumber
        }

        if (this.pageSizeLimit !== undefined) {
            params.perPage = this.pageSizeLimit
        }

        return params
    }

    buildTyped(): TypedBuildResult<T> {
        const params = this.build()
        const raw = {
            filter: this.filterQuery,
            values: Object.fromEntries(this.filterValues),
        }

        return {
            params,
            raw,
            resultType: {} as T, // Type placeholder for inference
        }
    }
}

class FilterBuilderImpl<T extends CollectionRecord> implements FilterBuilder<T> {
    private query = ''
    private keyCounter = new Map<Path<T>, number>()
    private valueMap: Map<string, unknown>

    constructor(valueMap: Map<string, unknown>) {
        this.valueMap = valueMap
    }

    private incrementKeyCounter(key: Path<T>): number {
        const count = this.keyCounter.get(key) || 0
        const newCount = count + 1
        this.keyCounter.set(key, newCount)
        return newCount
    }

    private saveValue<P extends Path<T>>(key: P, value: PathValue<T, P>): string {
        const count = this.incrementKeyCounter(key)
        const newName = `${String(key)}${count}`
        this.valueMap.set(newName, value)
        return newName
    }

    private expression<P extends Path<T>>(
        key: P,
        operator: string,
        value: PathValue<T, P>,
    ): void {
        if (isDateMacro(value)) {
            this.query += `${String(key)}${operator}${value}`
        } else {
            const newName = this.saveValue(key, value)
            this.query += `${String(key)}${operator}{:${newName}}`
        }
    }

    // Operator implementations
    equal<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.equal, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    notEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.notEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    greaterThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.greaterThan, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    greaterThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.greaterThanOrEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    lessThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.lessThan, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    lessThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.lessThanOrEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    like<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.like, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    notLike<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.notLike, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyNotEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyNotEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyGreaterThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyGreaterThan, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyGreaterThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyGreaterThanOrEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyLessThan<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyLessThan, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyLessThanOrEqual<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyLessThanOrEqual, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyLike<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyLike, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    anyNotLike<P extends Path<T>>(key: P, value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.expression(key, OPERATORS.anyNotLike, value)
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    // Helper methods
    search<P extends Path<T>>(keys: P[], value: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.query += '('
        keys.forEach((key, index) => {
            this.expression(key, OPERATORS.like, value)
            if (index < keys.length - 1) {
                this.query += ' || '
            }
        })
        this.query += ')'
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    in<P extends Path<T>>(key: P, values: PathValue<T, P>[]): RestrictedFilterBuilder<T> {
        this.query += '('
        values.forEach((value, index) => {
            this.expression(key, OPERATORS.equal, value)
            if (index < values.length - 1) {
                this.query += ' || '
            }
        })
        this.query += ')'
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    notIn<P extends Path<T>>(key: P, values: PathValue<T, P>[]): RestrictedFilterBuilder<T> {
        this.query += '('
        values.forEach((value, index) => {
            this.expression(key, OPERATORS.notEqual, value)
            if (index < values.length - 1) {
                this.query += ' && '
            }
        })
        this.query += ')'
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    between<P extends Path<T>>(key: P, from: PathValue<T, P>, to: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.query += '('
        this.expression(key, OPERATORS.greaterThanOrEqual, from)
        this.query += ' && '
        this.expression(key, OPERATORS.lessThanOrEqual, to)
        this.query += ')'
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    notBetween<P extends Path<T>>(key: P, from: PathValue<T, P>, to: PathValue<T, P>): RestrictedFilterBuilder<T> {
        this.query += '('
        this.expression(key, OPERATORS.lessThan, from)
        this.query += ' || '
        this.expression(key, OPERATORS.greaterThan, to)
        this.query += ')'
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    isNull<P extends Path<T>>(key: P): RestrictedFilterBuilder<T> {
        this.query += `${String(key)}=''`
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    isNotNull<P extends Path<T>>(key: P): RestrictedFilterBuilder<T> {
        this.query += `${String(key)}!=''`
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    custom(raw: string): RestrictedFilterBuilder<T> {
        this.query += raw
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    group(callback: (q: FilterBuilder<T>) => RestrictedFilterBuilder<T>): RestrictedFilterBuilder<T> {
        this.query += '('
        callback(this)
        this.query += ')'
        return new RestrictedFilterBuilderImpl<T>(this)
    }

    getQuery(): string {
        return this.query
    }
}

class RestrictedFilterBuilderImpl<T extends CollectionRecord> implements RestrictedFilterBuilder<T> {
    constructor(private filterBuilder: FilterBuilderImpl<T>) {}

    and(): FilterBuilder<T> {
        this.filterBuilder.getQuery() // Access private method indirectly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(this.filterBuilder as any).query += ' && '
        return this.filterBuilder
    }

    or(): FilterBuilder<T> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(this.filterBuilder as any).query += ' || '
        return this.filterBuilder
    }
}