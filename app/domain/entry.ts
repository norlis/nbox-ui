export type Entry = {
    key: string
    value: string
    secure: boolean
    actualValue?: string
}

export type EntryRecord = Entry & {
    path: string
}


export type EntryEditable = EntryRecord & {
    isEditing: boolean
}

export type EntriesEditable = EntryEditable[]

export type Entries = Entry[]


export type EntryRecords = EntryRecord[]

