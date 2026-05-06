import type {EnvironmentRecords} from "~/core/types";

export type TemplateMetadata = {
    hash?: string
    updatedAt?: string
    updatedBy?: string
    version?: string
}

export type Box = {
    service: string
    stage: {
        [environment: string]: Stage
    }
}

export type Stage = {
    template: {
        name: string
        value: string
    }
    metadata?: TemplateMetadata
}

export type PropsTemplate = {
    template: string
    stage: string
    service: string
}

export type PropsTemplateChange = PropsTemplate & {
    templateName: string | null
}

export type TemplateUpsertMeta = {
    id: string
    name: string
    version: string
    matchPatterns: string[]
}

export type TemplateUpsertResult = {
    valid: boolean
    kind: 'success' | 'schema_error' | string
    errors?: Array<{ path: string; message: string }>
    meta?: TemplateUpsertMeta
}

export type TemplateUpsertResponse = Record<string, TemplateUpsertResult>

export type BoxSpec = {
    id: string
    name: string
    version: string
    matchPatterns: string[]
}

export type ResolvedSchema = {
    schema: Record<string, unknown>
}

export interface ITemplateRepository {
    upsert: (props: PropsTemplateChange, request: Request) => Promise<TemplateUpsertResponse>
    environments: (request: Request) => Promise<EnvironmentRecords>
    stages: (request: Request) => Promise<string[]>
    vars: (props: PropsTemplate, request: Request) => Promise<string[]>
    retrieve: (props: PropsTemplate, request: Request) => Promise<string>
    retrieveStage: (service: string, stage: string, request: Request) => Promise<Stage>
    build: (props: PropsTemplate, request: Request) => Promise<string>
    templates: (request: Request) => Promise<Box[]>
    specs: (request: Request) => Promise<BoxSpec[]>
    allowedExtensions: (request: Request) => Promise<string[]>
    resolveSchema: (pattern: string, request: Request) => Promise<ResolvedSchema>
}
