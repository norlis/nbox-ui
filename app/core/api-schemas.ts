import {z} from "zod"

// ─── Storage Backend ─────────────────────────────────────────────────────────

// Permissive: backend may add new variants (e.g. "vault") faster than the
// swagger enum. The UI's `StorageBackend` type already falls back to `string`.
export const StorageBackendSchema = z.string()

// ─── Entry ───────────────────────────────────────────────────────────────────

export const EntryMetadataSchema = z.object({
    storageBackend: StorageBackendSchema.optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
    version: z.number().optional(),
    fingerprint: z.string().optional(),
}).passthrough()

export const ApiEntrySchema = z.object({
    key: z.string(),
    value: z.string(),
    secure: z.boolean(),
    metadata: EntryMetadataSchema.optional(),
}).passthrough()

export const ApiEntryArraySchema = z.array(ApiEntrySchema)

// `POST /api/entry` returns a map { "<key>": <detail> }. With HTTP 200 the
// server processed each key; the per-key detail object may carry an `error`
// field when an individual write failed. Schema is permissive: detail shape
// is opaque to the UI and only the `error` field drives success/failure.
export const EntryUpsertResponseSchema = z.record(z.string(), z.unknown())

// `POST /api/entry/lookup` returns a map { "<key>": Entry }
export const EntryLookupResponseSchema = z.record(z.string(), ApiEntrySchema)

// ─── Template / Box ──────────────────────────────────────────────────────────

export const TemplateMetadataSchema = z.object({
    hash: z.string().optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
    version: z.string().optional(),
}).passthrough()

export const TemplateSchema = z.object({
    name: z.string(),
    value: z.string(),
}).passthrough()

export const StageSchema = z.object({
    template: TemplateSchema,
    metadata: TemplateMetadataSchema.optional(),
}).passthrough()

export const BoxSchema = z.object({
    service: z.string(),
    stage: z.record(z.string(), StageSchema),
}).passthrough()

export const BoxArraySchema = z.array(BoxSchema)

// ─── Prefix Config ───────────────────────────────────────────────────────────

export const PrefixConfigSchema = z.object({
    prefix: z.string(),
    tags: z.record(z.string(), z.string()).optional(),
    typeDefault: StorageBackendSchema.optional(),
    typeSecure: StorageBackendSchema.optional(),
    typeAllowed: z.array(StorageBackendSchema).optional(),
}).passthrough()

export const PrefixConfigArraySchema = z.array(PrefixConfigSchema)

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Validates API response against a Zod schema.
 * Returns parsed data on success, or falls back to raw data with a console warning.
 * Never throws — designed for graceful degradation in production.
 */
export function parseOrWarn<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
    const result = schema.safeParse(data)
    if (!result.success) {
        console.warn(`[api-schema] ${context}:`, result.error.flatten().fieldErrors)
        return data as T
    }
    return result.data
}
