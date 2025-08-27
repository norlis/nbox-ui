import {type EntryActionResponse, EntryArraySchema} from "~/domain/validations";
import {Repository} from "~/adapters";
import {type ActionFunctionArgs, data} from "react-router";


function parseEntriesFromFormData(formData: FormData) {
    const entries: Record<string, any> = {};
    const regex = /entries\[(\d+)]\[(\w+)]/;

    for (const [name, value] of formData.entries()) {
        const match = name.match(regex);
        if (match) {
            const [, index, key] = match;
            if (!entries[index]) entries[index] = {};
            entries[index][key] = value;
        }
    }
    return Object.values(entries).map(entry => ({ secure: false, ...entry }));
}

export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const entriesData = parseEntriesFromFormData(formData);

    const result = EntryArraySchema.safeParse(entriesData);

    if (!result.success) {
        return data<EntryActionResponse>({
            status: 'validation_error',
            errors: result.error
        }, { status: 400 });
    }

    const { data: validatedEntries } = result;
    const entriesForLogging = validatedEntries.map(entry => {
        if (entry.secure) {
            return { ...entry, value: '********' };
        }
        return entry;
    });

    console.log("Validated data ready for upsert:", entriesForLogging);

    const [savedIds, repoErrors] = await Repository.entry.upsert(validatedEntries, request);
    const hasErrors = repoErrors && Object.keys(repoErrors).length > 0;
    const hasSuccess = savedIds && savedIds.length > 0;

    let message = "";
    if (hasSuccess) message += `Saved ${savedIds.length} entries. `;
    if (hasErrors) message += `Failed ${Object.keys(repoErrors).length} entries.`;

    if (hasErrors) {
        return data<EntryActionResponse>({
            status: 'partial_error',
            message: message.trim(),
            savedIds: savedIds || [],
            errors: repoErrors
        }, { status: 207 });
    }

    return data<EntryActionResponse>({
        status: 'success',
        message: message.trim(),
        savedIds: savedIds,
        errors: null
    });
}