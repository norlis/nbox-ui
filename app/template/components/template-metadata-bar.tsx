import {Clock, GitCommit, User} from "lucide-react"
import type {TemplateMetadata} from "~/template/template.types"

interface Props {
    metadata?: TemplateMetadata | null
}

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
}

function formatDate(value: string): string {
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return d.toLocaleString('en-US', DATE_FORMAT)
}

export function TemplateMetadataBar({metadata}: Props) {
    if (!metadata) return null
    const hasAny = metadata.updatedBy || metadata.updatedAt || metadata.version
    if (!hasAny) return null
    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-md border border-slate-700 mb-2">
            {metadata.updatedBy && (
                <span className="flex items-center" title="Updated by">
                    <User className="h-3 w-3 mr-1 text-slate-500"/>
                    <span className="font-medium text-slate-300">{metadata.updatedBy}</span>
                </span>
            )}
            {metadata.updatedAt && (
                <span className="flex items-center" title="Updated at">
                    <Clock className="h-3 w-3 mr-1 text-slate-500"/>
                    <span>{formatDate(metadata.updatedAt)}</span>
                </span>
            )}
            {metadata.version && (
                <span className="flex items-center" title="Version">
                    <GitCommit className="h-3 w-3 mr-1 text-slate-500"/>
                    <span className="font-mono">{metadata.version}</span>
                </span>
            )}
        </div>
    )
}