import type {ClassifiedPrefixes, Errors, IEntryRepository, Success} from "~/entry/entry.types";
import type {EntryRecords} from "~/entry/entry.types";
import type {EnvironmentRecords, PrefixConfig} from "~/core/types";
import {Post, Retrieve} from "~/core/http";
import {withApiErrorHandler} from "~/core/errors";
import {classifyPrefix} from "~/config/prefix-groups";
import {ApiEntryArraySchema, parseOrWarn, PrefixConfigArraySchema} from "~/core/api-schemas";


export function EntryRepository(): IEntryRepository {

    const retrieveEnvironments = async (request: Request): Promise<ClassifiedPrefixes> => {
        const raw = await Retrieve(request, `/api/prefix`) ?? []
        const configs: PrefixConfig[] = parseOrWarn(PrefixConfigArraySchema, raw, 'retrieveEnvironments')
        return {
            sidebar: configs.filter(c => classifyPrefix(c) === 'sidebar').map(c => c.prefix),
            topbar:  configs.filter(c => classifyPrefix(c) === 'topbar').map(c => c.prefix),
        }
    }

    const retrieve = async (request: Request, prefix: string | null): Promise<[EntryRecords, EnvironmentRecords]> => {

        let prefixes: EnvironmentRecords
        let entries: EntryRecords = []

        if (prefix == "" || prefix == null) {
            const rawConfigs = await Retrieve(request, `/api/prefix`) ?? []
            const configs: PrefixConfig[] = parseOrWarn(PrefixConfigArraySchema, rawConfigs, 'retrieve/prefix')
            prefixes = configs.map(c => c.prefix)

            return [entries, prefixes]
        }

        const rawData = await Retrieve(request, `/api/entry/prefix?v=${prefix}`) ?? []
        const base = prefix.replace(/\/$/, '')
        const raw = parseOrWarn(ApiEntryArraySchema, rawData, 'retrieve')
        entries = raw.map(e => ({
            ...e,
            path: base,
            key: e.key.startsWith(base + '/') ? e.key.slice(base.length + 1) : e.key,
            actualValue: undefined,
        }))
        prefixes = entries.filter(e => e.key.endsWith("/")).map(e => `${e.path}/${e.key}`)
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
            return [[], {message: res.detail || 'An unknown error occurred'}];
        }

        if (Array.isArray(res)) {
            for (const result of res) {
                if (result.error === null) {
                    success.push(result.key);
                } else {
                    errors[result.key] = result.error;
                }
            }
        }
        return [success, errors]
    }

    const retrieveSecret = async (keyPath: string, request: Request): Promise<string> => {
        const res = await Retrieve(request, `/api/entry/resolve?v=${encodeURIComponent(keyPath)}`);
        return res.value
    }

    return {
        retrieve: withApiErrorHandler(retrieve),
        upsert: withApiErrorHandler(upsert),
        retrieveSecret: withApiErrorHandler(retrieveSecret),
        retrieveEnvironments: withApiErrorHandler(retrieveEnvironments),
    }
}
