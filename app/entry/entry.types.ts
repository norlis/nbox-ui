import type {EnvironmentRecords} from "~/core/types";

export type StorageBackend = 'dynamodb' | 'parameterstore' | 'parameterstore_secure' | string

export type EntryMetadata = {
    storageBackend?: StorageBackend
    updatedAt?: string
    updatedBy?: string
    version?: number
    fingerprint?: string
}

export type Entry = {
    key: string
    value: string
    secure: boolean
    metadata?: EntryMetadata
    actualValue?: string
}

/** Returns true if the entry's value requires a resolve call to be revealed. */
export function isRevealable(entry: Pick<Entry, 'secure' | 'metadata'>): boolean {
    const backend = entry.metadata?.storageBackend
    return entry.secure || backend === 'parameterstore' || backend === 'parameterstore_secure'
}

export type EntryRecord = Entry & {
    path: string
}

// Editing state is tracked via the `editingEntries` Set in `useEntry`, not on
// the entry itself. These aliases stay for backwards compat with consumers.
export type EntryEditable = EntryRecord
export type EntriesEditable = EntryRecord[]

export type Entries = Entry[]

export type EntryRecords = EntryRecord[]

export type Success = string[]
export type Errors = { [key: string]: string }

export type ClassifiedPrefixes = {
    sidebar: EnvironmentRecords
    topbar: EnvironmentRecords
}

export interface IEntryRepository {
    retrieve: (request: Request, prefix: string | null) => Promise<[EntryRecords, EnvironmentRecords]>
    retrieveEnvironments: (request: Request) => Promise<ClassifiedPrefixes>
    retrieveSecret: (keyPath: string, request: Request) => Promise<string>
    getEntry: (keyPath: string, request: Request) => Promise<Entry>
    lookupMany: (keys: string[], request: Request) => Promise<Record<string, Entry>>
    upsert: (payload: Entry[], request: Request) => Promise<[Success, Errors]>
}
