import type {Errors, IEntryRepository, Success} from "~/domain/operations";
import type {EntryRecords} from "~/domain/entry";
import type {EnvironmentRecords} from "~/domain/event";
import {Post, Retrieve} from "~/services/rest";


export function EntryRepository(): IEntryRepository {

    const retrieveEnvironments = async (request: Request): Promise<EnvironmentRecords> => {
        return  await Retrieve(request, `/api/static/environments`)
    }

    const retrieve = async (request: Request, prefix: string|null): Promise<[EntryRecords, EnvironmentRecords]> => {

        let prefixes: EnvironmentRecords
        let entries: EntryRecords = []

        if (prefix == "" || prefix == null) {
            prefixes = await Retrieve(request, `/api/static/environments`)

            return [entries, prefixes]
        }

        entries = await Retrieve(request, `/api/entry/prefix?v=${prefix}`)
        prefixes = entries?.filter(e => e.key.endsWith("/"))?.map(e => `${e.path}/${e.key}`);
        if (!prefixes.length) {
            prefixes = [prefix]
        }
        return [entries, prefixes]
    }

    const upsert = async (payload: object[], request: Request): Promise<[Success, Errors]> => {
        const success: Success = []
        const errors: Errors = {}

        const [res, status] = await Post(request, "/api/entry", payload)
        if (status !== 200 && status !== 201) {
            return [[], { message: res.detail || 'An unknown error occurred' }];
        }

        if (Array.isArray(res)) {
            for (const result of res) {
                if (result.error === null) {
                    success.push( result.key);
                } else {
                    errors[result.key] = result.error;
                }
            }
        }
        return [success, errors]
    }

    const retrieveSecret = async (keyPath: string, request: Request): Promise<string> => {
        console.log(`Retrieve secret for key: ${keyPath}`);
        const res = await Retrieve(request, `/api/entry/secret-value?v=${encodeURIComponent(keyPath)}`);
        return res.value
    }

    return {
        retrieve,
        upsert,
        retrieveSecret,
        retrieveEnvironments,
    }
}