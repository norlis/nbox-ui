import {type LoaderFunctionArgs} from "react-router";
import {Repository} from "~/adapters";

export async function loader({request, params}: LoaderFunctionArgs) {
    const {service, stage, template} = params
    if (typeof template !== "string") throw new Error('template is empty')
    if (typeof stage !== "string") throw new Error('stage is empty')
    if (typeof service !== "string") throw new Error('service is empty')
    const data =  await Repository.template.build({service, stage, template}, request)
    return new Response(data, {
        headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename="${template}"`,
        },
    });
}