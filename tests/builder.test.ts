import { describe, expect, test } from 'vitest'
import { pbParams } from '../src/builder'

// Mock collection record for testing
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

describe('pbParams', () => {
    test('should create a params builder', () => {
        const builder = pbParams<TestUser>()
        expect(builder).toBeDefined()
    })

    test('should build empty params', () => {
        const params = pbParams<TestUser>().build()
        expect(params).toEqual({})
    })

    test('should build filter params', () => {
        const params = pbParams<TestUser>()
            .filter(q => q.equal('name', 'John'))
            .build()

        expect(params.filter).toBeDefined()
    })

    test('should build field selection params', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'name', 'email'])
            .build()

        expect(params.fields).toBe('id,name,email')
    })

    test('should auto-generate expand from field paths', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'expand.profile.bio', 'expand.organization.name'])
            .build()

        expect(params.fields).toBe('id,expand.profile.bio,expand.organization.name')
        expect(params.expand).toBe('profile,organization')
    })

    test('should auto-generate nested expand relations', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'expand.profile.expand.preferences.theme'])
            .build()

        expect(params.fields).toBe('id,expand.profile.expand.preferences.theme')
        expect(params.expand).toBe('profile,profile.preferences')
    })

    test('should build sort params', () => {
        const params = pbParams<TestUser>()
            .sort(['-created', 'name'])
            .build()

        expect(params.sort).toBe('-created,name')
    })

    test('should build pagination params', () => {
        const params = pbParams<TestUser>()
            .page(2, 50)
            .build()

        expect(params.page).toBe(2)
        expect(params.perPage).toBe(50)
    })

    test('should build combined params', () => {
        const params = pbParams<TestUser>()
            .filter(q => q.equal('verified', true))
            .fields(['id', 'name', 'email', 'expand.profile.bio'])
            .sort(['-created','-expand.organization.name'])
            .page(1, 20)
            .build()

        expect(params.filter).toBeDefined()
        expect(params.fields).toBe('id,name,email,expand.profile.bio')
        expect(params.expand).toBe('profile')
        expect(params.sort).toBe('-created,-expand.organization.name')
        expect(params.page).toBe(1)
        expect(params.perPage).toBe(20)
    })

    test('should support conditional building', () => {
        const includeEmail = true
        const sortByDate = false

        const params = pbParams<TestUser>()
            .fieldsIf(includeEmail, ['id', 'name', 'email'])
            .sortIf(sortByDate, ['-created'])
            .build()

        expect(params.fields).toBe('id,name,email')
        expect(params.sort).toBeUndefined()
    })
})