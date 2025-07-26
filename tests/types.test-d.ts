import { describe, expectTypeOf, test } from 'vitest'
import { pbParams } from '../src'

// Mock collection record for type testing
interface TestUser {
    id: string
    name: string
    email: string
    age: number
    created: Date
    verified: boolean
    profile: {
        bio: string
        avatar?: string
        preferences: {
            theme: 'light' | 'dark'
            notifications: boolean
        }
    }
    organization: {
        id: string
        name: string
        slug: string
    }
}

describe('Type Tests', () => {
    test('pbParams should create typed builder', () => {
        const builder = pbParams<TestUser>()
        expectTypeOf(builder).toEqualTypeOf<import('../src/types').ParamsBuilder<TestUser>>()
    })

    test('field paths should be type-safe', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'name', 'email', 'profile.bio'])
            .build()

        expectTypeOf(params.fields).toEqualTypeOf<string | undefined>()
    })

    test('filter should accept valid field paths', () => {
        const params = pbParams<TestUser>()
            .filter(q => q
                .equal('name', 'John')
                .and()
                .equal('profile.preferences.theme', 'dark')
                .and()
                .greaterThan('age', 18)
            )
            .build()

        expectTypeOf(params.filter).toEqualTypeOf<string | undefined>()
    })

    test('expand should accept relation paths', () => {
        const params = pbParams<TestUser>()
            .expand(['profile', 'organization'])
            .build()

        expectTypeOf(params.expand).toEqualTypeOf<string | undefined>()
    })

    test('sort should accept field paths with direction', () => {
        const params = pbParams<TestUser>()
            .sort(['-created', 'name'])
            .build()

        expectTypeOf(params.sort).toEqualTypeOf<string | undefined>()
    })

    test('build should return QueryParams object', () => {
        const params = pbParams<TestUser>()
            .filter(q => q.equal('verified', true))
            .fields(['id', 'name'])
            .expand(['profile'])
            .sort(['-created'])
            .page(1, 20)
            .build()

        expectTypeOf(params).toEqualTypeOf<import('../src/types').QueryParams>()
        expectTypeOf(params.filter).toEqualTypeOf<string | undefined>()
        expectTypeOf(params.fields).toEqualTypeOf<string | undefined>()
        expectTypeOf(params.expand).toEqualTypeOf<string | undefined>()
        expectTypeOf(params.sort).toEqualTypeOf<string | undefined>()
        expectTypeOf(params.page).toEqualTypeOf<number | undefined>()
        expectTypeOf(params.perPage).toEqualTypeOf<number | undefined>()
    })

    test('buildTyped should return TypedBuildResult', () => {
        const result = pbParams<TestUser>()
            .fields(['id', 'name'])
            .buildTyped()

        expectTypeOf(result).toEqualTypeOf<import('../src/types').TypedBuildResult<TestUser>>()
        expectTypeOf(result.params).toEqualTypeOf<import('../src/types').QueryParams>()
        expectTypeOf(result.raw).toEqualTypeOf<{ filter: string; values: Record<string, unknown> }>()
        expectTypeOf(result.resultType).toEqualTypeOf<TestUser>()
    })
})