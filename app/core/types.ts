export type Command<T> = {
    payload: T
}

export type EnvironmentRecords = string[]

export type PrefixConfig = {
    prefix: string
    tags?: Record<string, string>
    typeDefault?: string
    typeSecure?: string
    typeAllowed?: string[]
}
