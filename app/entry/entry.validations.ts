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

// Derived from the actual return type of `safeParse(...).error.flatten()` so it
// stays in sync across zod versions (zod 4 changed `fieldErrors` to a mapped
// type over array keys, which trips literal `Record<string, string[]>` shapes).
type EntryArraySafeParseError = Extract<
    ReturnType<typeof EntryArraySchema.safeParse>,
    {success: false}
>;
type EntryArrayFlattened = ReturnType<EntryArraySafeParseError['error']['flatten']>;

export type FieldErrors = EntryArrayFlattened['fieldErrors'];

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
    errors: EntryArrayFlattened;
    message?: string;
};
