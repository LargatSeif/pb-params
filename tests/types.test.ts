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
    profile: string
    organization: string
    expand:{
      profile: {
        bio: string
        avatar?: string
        preferences: string
        expand:{
          preferences: {
            theme: 'light' | 'dark'
            notifications: boolean
          }
        }
      },
      organization: {
          id: string
          name: string
          slug: string
      }
      }
    }

describe('Type Tests', () => {
    test('pbParams should create typed builder', () => {
        const builder = pbParams<TestUser>()
        expectTypeOf(builder).toEqualTypeOf<import('../src/types').ParamsBuilder<TestUser>>()
    })

    test('field paths should be type-safe', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'name', 'email', 'expand.profile.bio'])
            .build()

        expectTypeOf(params.fields).not.toBeUndefined()
    })

    test('filter should accept valid field paths', () => {
        const params = pbParams<TestUser>()
            .filter(q => q
                .equal('name', 'John')
                .and()
                .equal('verified', true)
                .and()
                .greaterThan('age', 18)
            )
            .build()

        expectTypeOf(params.filter).not.toBeUndefined()
    })

    test('auto-expand should work from field paths', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'expand.profile.bio', 'expand.organization.name'])
            .build()

        expectTypeOf(params.expand).not.toBeUndefined();
    })

    test('sort should accept field paths with direction', () => {
        const params = pbParams<TestUser>()
            .sort(['-created', 'name'])
            .build()

        expectTypeOf(params.sort).not.toBeUndefined()
    })

    test('build should return QueryParams object', () => {
        const params = pbParams<TestUser>()
            .filter(q => q.equal('verified', true))
            .fields(['id', 'name', 'expand.profile.bio'])
            .sort(['-created'])
            .page(1, 20)
            .build()

        expectTypeOf(params).toEqualTypeOf<import('../src/types').QueryParams>()
        expectTypeOf(params.filter).not.toBeUndefined()
        expectTypeOf(params.fields).not.toBeUndefined()
        expectTypeOf(params.expand).not.toBeUndefined()
        expectTypeOf(params.sort).not.toBeUndefined()
        expectTypeOf(params.page).not.toBeUndefined()
        expectTypeOf(params.perPage).not.toBeUndefined()
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