import type {PrefixConfig} from "~/core/types";

export type PrefixSlot = 'sidebar' | 'topbar'

export function classifyPrefix(config: PrefixConfig): PrefixSlot {
    if (
        config.typeDefault === 'parameterstore_secure' &&
        config.typeSecure === 'parameterstore_secure' &&
        (config.typeAllowed?.length ?? 0) === 0
    ) return 'topbar'

    return 'sidebar'
}
