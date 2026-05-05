import type {Box, BoxSpec, ITemplateRepository, PropsTemplate, PropsTemplateChange, ResolvedSchema, TemplateUpsertResponse} from "~/template/template.types";
import type {PrefixConfig} from "~/core/types";
import {ApiError, Post, Retrieve} from "~/core/http";

export function TemplateRepository(): ITemplateRepository {
    const upsert = async (props: PropsTemplateChange, request: Request): Promise<TemplateUpsertResponse> => {
        const {template, stage, service, templateName} = props
        const name = templateName
        try {
            const [res] = await Post(request, `/api/box/${service}/${stage}/${name}`, {
                content: btoa(template)
            })
            return res
        } catch (e) {
            if (e instanceof ApiError && e.problemDetail) {
                return e.problemDetail as unknown as TemplateUpsertResponse
            }
            throw e
        }
    }

    const environments = async (request: Request): Promise<string[]> => {
        const configs: PrefixConfig[] = await Retrieve(request, `/api/prefix`)
        return configs.map(c => c.prefix).filter(i => !i.includes("global")).map(i => i.slice(0, -1))
    }

    const vars = async (props: PropsTemplate, request: Request): Promise<string[]> => {
        return await Retrieve(request, `/api/box/${props.service}/${props.stage}/${props.template}/vars`)
    }

    const retrieve = async (props: PropsTemplate, request: Request): Promise<string> => {
        return await Retrieve(request, `/api/box/${props.service}/${props.stage}/${props.template}`, "text")
    }

    const build = async (props: PropsTemplate, request: Request): Promise<string> => {
        return await Retrieve(request, `/api/box/${props.service}/${props.stage}/${props.template}/build`, "text")
    }

    const templates = async (request: Request): Promise<Box[]> => {
        return await Retrieve(request, `/api/box`)
    }

    const stages = async (request: Request): Promise<string[]> => {
        return await Retrieve(request, `/api/static/stages`) ?? []
    }

    const specs = async (request: Request): Promise<BoxSpec[]> => {
        return await Retrieve(request, `/api/boxspec/specs`) ?? []
    }

    const allowedExtensions = async (request: Request): Promise<string[]> => {
        return await Retrieve(request, `/api/box/schemas`) ?? []
    }

    const resolveSchema = async (pattern: string, request: Request): Promise<ResolvedSchema> => {
        return await Retrieve(request, `/api/boxspec/resolve?pattern=${encodeURIComponent(pattern)}`)
    }

    return {
        upsert,
        environments,
        stages,
        vars,
        retrieve,
        build,
        templates,
        specs,
        allowedExtensions,
        resolveSchema,
    }
}
