import { describe, test, expect } from 'vitest'
import { pbParams } from '../src/builder'

// Mock collection record for testing
interface TestUser {
    id: string
    name: string
    email: string
    age: number
    created: Date
    verified: boolean
    preferences: {
        theme: 'light' | 'dark'
        notifications: boolean
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
        expect(typeof params.filter).toBe('string')
    })

    test('should build field selection params', () => {
        const params = pbParams<TestUser>()
            .fields(['id', 'name', 'email'])
            .build()

        expect(params.fields).toBe('id,name,email')
    })

    test('should build expand params', () => {
        const params = pbParams<TestUser>()
            .expand(['preferences'])
            .build()

        expect(params.expand).toBe('preferences')
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
            .fields(['id', 'name', 'email'])
            .expand(['preferences'])
            .sort(['-created'])
            .page(1, 20)
            .build()

        expect(params.filter).toBeDefined()
        expect(params.fields).toBe('id,name,email')
        expect(params.expand).toBe('preferences')
        expect(params.sort).toBe('-created')
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