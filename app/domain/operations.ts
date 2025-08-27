import {EntryRecords} from "~/domain/entry";
import {EnvironmentRecords} from "~/domain/event";
import {Box} from "~/domain/box";

export type Success = string[]
export type Errors =  {[key: string]: string}

export type PropsTemplate = {
    template: string
    stage: string
    service: string

}

export type PropsTemplateChange = PropsTemplate & {
    templateName: string|null
}

export interface IEntryRepository {
    retrieve: (request: Request, prefix: string|null) => Promise<[EntryRecords, EnvironmentRecords]>
    retrieveEnvironments: (request: Request) => Promise<EnvironmentRecords>
    retrieveSecret:  (keyPath: string, request: Request) =>  Promise<string>
    upsert: (payload: object[], request: Request) => Promise<[Success, Errors]>
}

export interface ITemplateRepository {
    upsert: (props: PropsTemplateChange, request: Request) => Promise<[string[], Error|null]>
    environments: (request: Request) => Promise<EnvironmentRecords>
    vars: (props: PropsTemplate, request: Request) => Promise<string[]>
    retrieve: (props: PropsTemplate, request: Request) => Promise<string>
    build: (props: PropsTemplate, request: Request) => Promise<string>
    templates: (request: Request) => Promise<Box[]>
}

export type ValidResult = {
    key: string;
    action: string;
}