import {ITemplateRepository, PropsTemplate, PropsTemplateChange} from "~/domain/operations";
import {EnvironmentRecords} from "~/domain/event";
import {Post, Retrieve} from "~/services/rest";
import {Box} from "~/domain/box";

export function TemplateRepository(): ITemplateRepository {
    const upsert = async (props: PropsTemplateChange, request: Request): Promise<[string[], Error|null]> => {
        const {
            template, stage, service, templateName = "task_definition.json"
        } = props


        const data = {
            payload: {
                service: service,
                stage: {
                    [stage]: {
                        "template": {
                            "name": templateName || "task_definition.json",
                            "value": btoa(template),
                        },
                    }
                }
            }
        }

        const [res, status] = await Post(request, "/api/box", data)

        if (status !== 200 && status !== 201) {
            return [[], new Error(res.detail)]
        }

        return [res, null]
    }

    const environments = async (request: Request): Promise<string[]> => {
        const environments: EnvironmentRecords = await Retrieve(request, `/api/static/environments`)
        return environments.filter(i => !i.includes("global")).map(i => i.slice(0, -1))
    }

    const vars = async (props: PropsTemplate, request: Request) : Promise<string[]> => {
        return await Retrieve(request, `/api/box/${props.service}/${props.stage}/${props.template}/vars`)
    }

    const retrieve = async (props: PropsTemplate, request: Request) : Promise<string> => {
        return await Retrieve(request, `/api/box/${props.service}/${props.stage}/${props.template}`, "text")
    }

    const build = async (props: PropsTemplate, request: Request) : Promise<string> => {
        return await Retrieve(request, `/api/box/${props.service}/${props.stage}/${props.template}/build`, "text")
    }

    const templates = async ( request: Request) : Promise<Box[]> => {
        return await Retrieve(request, `/api/box`)
    }



    return {
        upsert,
        environments,
        vars,
        retrieve,
        build,
        templates
    }

}