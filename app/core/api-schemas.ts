import {z} from "zod"

// ─── Storage Backend ─────────────────────────────────────────────────────────

export const StorageBackendSchema = z.enum(['dynamodb', 'parameterstore', 'parameterstore_secure'])

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
