import { describe, expect, it } from 'vitest'
import { pbParams, type RecordAuthResponse } from '../src'

// Sample types for testing
interface User {
    id: string
    email: string
    name: string
    avatar: string
    role: 'admin' | 'user'
    expand: {
      profile: {
          bio: string
          expand: {
            preferences: {
                theme: 'light' | 'dark'
                notifications: boolean
            }
          } 
      }
    }
    created: string
    updated: string
}

interface UserAuthResponse extends RecordAuthResponse<User> {
    record: User,
    token: string,
    meta: {
        accessToken: string,
        refreshToken: string,
        provider: string
    }
}

describe('RecordAuthResponse Type Support', () => {
    // const mockAuthResponse: UserAuthResponse = {
    //     record: {
    //         id: 'user123',
    //         email: 'user@example.com',
    //         name: 'John Doe',
    //         avatar: 'avatar.jpg',
    //         role: 'user',
    //         expand:{
    //           profile: {
    //             bio: 'A sample user bio',
    //             expand: {
    //               preferences: {
    //                   theme: 'dark',
    //                   notifications: true
    //               }
    //             }
    //           }
    //         },
    //         created: '2023-01-01T00:00:00Z',
    //         updated: '2023-06-01T00:00:00Z'
    //     },
    //     token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    //     meta: {
    //         accessToken: 'oauth2_access_token',
    //         refreshToken: 'oauth2_refresh_token',
    //         provider: 'google'
    //     }
    // }

    describe('Type Safety with Auth Response Types', () => {
        it('should work with explicit User type', () => {
            const builder = pbParams<User>()
            
            expect(builder).toBeDefined()
            expect(typeof builder.filter).toBe('function')
            expect(typeof builder.fields).toBe('function')
            expect(typeof builder.sort).toBe('function')
            expect(typeof builder.page).toBe('function')
            expect(typeof builder.build).toBe('function')
            expect(typeof builder.buildTyped).toBe('function')
        })

        it('should work with RecordAuthResponse record type', () => {
            // Type is inferred from the authResponse.record type
            const builder = pbParams<UserAuthResponse['record']>()
            
            expect(builder).toBeDefined()
            expect(typeof builder.filter).toBe('function')
        })

        it('should work with direct record extraction type', () => {
            // Extract the record type from auth response
           
            const builder = pbParams<User>()
            
            expect(builder).toBeDefined()
            expect(typeof builder.filter).toBe('function')
        })
    })

    describe('Type Safety with Auth Response', () => {
        it('should work with auth response type without flag (keeps record prefix)', () => {
            const builder = pbParams<UserAuthResponse>()
            
            const params = builder
                .filter(q => q.equal('record.email', 'user@example.com'))
                .fields(['token', 'record.id', 'record.email', 'record.name', 'record.role'])
                .sort(['record.created', '-record.updated'])
                .page(1, 10)
                .build()

            expect(params).toEqual({
                filter: 'record.email={:record.email1}',
                fields: 'token,record.id,record.email,record.name,record.role',
                sort: 'record.created,-record.updated',
                page: 1,
                perPage: 10
            })
        })

        it('should transform fields when useRecord flag is true', () => {
            const builder = pbParams<UserAuthResponse>(true)
            
            const params = builder
                .fields(['token', 'record.id', 'record.email', 'record.name', 'record.role'])
                .build()

            expect(params).toEqual({
                fields: 'token,id,email,name,role'
            })
        })

        it('should handle nested expand paths and extract expand relations', () => {
            const builder = pbParams<UserAuthResponse>(true)
            
            const params = builder
                .fields(['token', 'record.expand.profile.bio', 'record.expand.profile.expand.preferences.theme'])
                .build()

            expect(params).toEqual({
                fields: 'token,expand.profile.bio,expand.profile.expand.preferences.theme',
                expand: 'profile,profile.preferences'
            })
        })

        it('should allow selecting token and meta fields with type safety', () => {
            const builder = pbParams<UserAuthResponse>(true)
            
            const params = builder
                .fields(['token', 'meta.accessToken', 'meta.provider', 'record.id', 'record.email'])
                .build()

            expect(params).toEqual({
                fields: 'token,meta.accessToken,meta.provider,id,email'
            })
        })

        it('should work with expand fields', () => {
            const builder = pbParams<User>()
            
            const params = builder
                .fields(['id', 'email', 'expand.profile.bio'])
                .build()

            expect(params).toEqual({
                fields: 'id,email,expand.profile.bio',
                expand: 'profile'
            })
        })
    })

    describe('Backward Compatibility', () => {
        it('should not break existing functionality when using auth response', () => {
            const builder = pbParams<User>()
            
            // All existing methods should still work - test each filter separately
            const params1 = builder
                .filter(q => q
                    .equal('role', 'user')
                    .and()
                    .like('email', '%@example.com')
                )
                .build()

            expect(params1.filter).toBe('role={:role1} && email~{:email1}')

            // Test filterIf with a new builder
            const builder2 = pbParams<User>()
            const params2 = builder2
                .filterIf(true, q => q.notEqual('name', ''))
                .build()

            expect(params2.filter).toBe('name!={:name1}')

            // Test complete functionality
            const builder3 = pbParams<User>()
            const params3 = builder3
                .fields(['id', 'email', 'name'])
                .fieldsIf(false, ['avatar']) // Should be ignored
                .sort(['-created'])
                .sortIf(true, ['updated']) // This will replace the previous sort
                .page(2, 20)
                .build()

            expect(params3).toEqual({
                fields: 'id,email,name',
                sort: 'updated', // sortIf replaces the previous sort
                page: 2,
                perPage: 20
            })
        })

        it('should maintain the same API surface', () => {
            const regularBuilder = pbParams<User>()
            const authBuilder = pbParams()
            
            // Both should have the same methods
            const regularMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(regularBuilder))
            const authMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(authBuilder))
            
            expect(regularMethods).toEqual(authMethods)
        })
    })

    describe('TypedBuildResult with Auth Response', () => {
        it('should return typed build result with auth response', () => {
            const builder = pbParams<User>()
            
            const result = builder
                .filter(q => q.equal('role', 'user'))
                .buildTyped()

            expect(result).toHaveProperty('params')
            expect(result).toHaveProperty('raw')
            expect(result).toHaveProperty('resultType')
            expect(result.params).toEqual({
                filter: 'role={:role1}'
            })
            expect(result.raw).toEqual({
                filter: 'role={:role1}',
                values: { role1: 'user' }
            })
        })
    })

    describe('Complex Filtering with Auth Response', () => {
        it('should handle complex filter operations', () => {
            const builder = pbParams<User>()
            
            const params = builder
                .filter(q => q
                    .group(subQ => subQ
                        .equal('role', 'admin')
                        .or()
                        .equal('role', 'user')
                    )
                    .and()
                    .like('email', '%@company.com')
                    .and()
                    .isNotNull('avatar')
                )
                .build()

            expect(params.filter).toBe('(role={:role1} || role={:role2}) && email~{:email1} && avatar!=\'\'')
        })

        it('should handle date macros in filters', () => {
            const builder = pbParams<User>()
            
            const params = builder
                .filter(q => q
                    .greaterThan('created', '@monthStart')
                    .and()
                    .lessThan('updated', '@now')
                )
                .build()

            expect(params.filter).toBe('created>@monthStart && updated<@now')
        })
    })
})