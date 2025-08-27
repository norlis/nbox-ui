import {z} from "zod";

export const EntrySchema = z.object({
    key: z.string().min(1, "Key cannot be empty."),
    value: z.string().min(1, "Value cannot be empty."),
    secure: z.preprocess((value) => value === "true" || value === "on", z.boolean()),
});

export const EntryArraySchema = z.array(EntrySchema);

export type FieldErrors = z.ZodFlattenedError<typeof EntryArraySchema>['fieldErrors'];

export type FormattedErrors = {
    [index: number]: {
        key?: string;
        value?: string;
        secure?: string;
    }
};

export type EntryActionResponse =
    | {
    status: 'success' | 'partial_error';
    message: string;
    savedIds: string[];
    errors: { [key: string]: string } | null;
}
    | {
    status: 'validation_error';
    // errors: z.inferFlattenedErrors<typeof EntryArraySchema>;
    errors: {
        formErrors: string[],
        fieldErrors: FieldErrors
    };
    message?: string;
};