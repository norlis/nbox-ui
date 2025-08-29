import {z} from "zod";

export const EntrySchema = z.object({
    key: z.string().min(1, "Key cannot be empty."),
    value: z.string(),
    secure: z.preprocess((value) => value === "true" || value === "on", z.boolean()),
})
    .refine(
        (data) => {
            if (data.secure) {
                return data.value.length > 0;
            }
            return true;
        },
        {
            message: "Value cannot be empty when 'secure' is checked.",
            path: ["value"],
        }
    );

export const EntryArraySchema = z.array(EntrySchema).refine(
    (entries) => {
        const keys = new Set();
        for (const entry of entries) {
            if (keys.has(entry.key)) {
                return false;
            }
            keys.add(entry.key);
        }
        return true;
    },
    {
        message: "Keys must be unique. Duplicates are not allowed.",
    }
);

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