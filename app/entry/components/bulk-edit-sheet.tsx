import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "../../components/ui/sheet"
import {Button} from "../../components/ui/button"
import {Editor, type OnMount} from "@monaco-editor/react"
import {useFetcher} from "react-router"
import type {EntryActionResponse} from "~/entry/entry.validations"
import {toast} from "sonner"

interface BulkEditSheetProps {
    currentPath: string
    environments: string[]
    children: React.ReactNode
}

type ParsedEntry =
    | { status: 'ok'; key: string; value: string }
    | { status: 'skip' }
    | { status: 'invalid'; lineNum: number }

function parseLine(line: string): ParsedEntry {
    const cleaned = line.replace(/#.*$/, '').trim()
    if (!cleaned) return {status: 'skip'}

    const eqIdx = cleaned.indexOf('=')
    if (eqIdx === -1) return {status: 'invalid', lineNum: 0}

    const key = cleaned.slice(0, eqIdx).trim()
    const value = cleaned.slice(eqIdx + 1).trim()

    if (!key || !/^[A-Za-z_][A-Za-z0-9_/]*$/.test(key)) return {status: 'invalid', lineNum: 0}

    return {status: 'ok', key, value}
}

/** Remove trailing slash for display purposes only. */
function display(path: string) {
    return path.replace(/\/$/, '')
}

/** Ensure path always ends with a single slash. */
function withSlash(path: string) {
    return path.endsWith('/') ? path : `${path}/`
}

/**
 * Splits currentPath into baseEnv + subPath using the environments list.
 * Environments are normalized to trailing slash to avoid partial-word matches
 * that would produce a leading slash in subPath (the source of double-slash bugs).
 *
 * Example: currentPath="global/example/", environments=["global","dev","qa"]
 * → { baseEnv: "global/", subPath: "example/" }
 */
function resolveBase(currentPath: string, environments: string[]) {
    const normalized = environments.map(withSlash)
    // Longest match first to handle nested prefixes correctly
    const sorted = [...normalized].sort((a, b) => b.length - a.length)
    const match = sorted.find(env => currentPath.startsWith(env))
    if (match) {
        return {baseEnv: match, subPath: currentPath.slice(match.length)}
    }
    return {baseEnv: currentPath, subPath: ''}
}

export function BulkEditSheet({currentPath, environments, children}: BulkEditSheetProps) {
    const [open, setOpen] = useState(false)
    const [code, setCode] = useState("")
    const [parsed, setParsed] = useState<ParsedEntry[]>([])
    const [selectedEnvs, setSelectedEnvs] = useState<Set<string>>(new Set())
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
    const fetcher = useFetcher<EntryActionResponse>()

    const isSubmitting = fetcher.state !== 'idle'

    const {baseEnv, subPath} = useMemo(
        () => resolveBase(currentPath, environments),
        [currentPath, environments]
    )

    // All environments except the current base (normalized), shown as optional pills
    const otherEnvs = useMemo(
        () => environments.map(withSlash).filter(e => e !== baseEnv),
        [environments, baseEnv]
    )

    // The current path is always included; selected envs add extra targets using the same sub-path
    const activeEnvs = useMemo(() => {
        const extras = Array.from(selectedEnvs).map(env => `${env}${subPath}`)
        return [currentPath, ...extras]
    }, [currentPath, selectedEnvs, subPath])

    // Reset selection on open
    useEffect(() => {
        if (open) setSelectedEnvs(new Set())
    }, [open])

    const reparse = useCallback((text: string) => {
        const lines = text.split('\n')
        setParsed(lines.map((l, i) => {
            const r = parseLine(l)
            if (r.status === 'invalid') return {...r, lineNum: i + 1}
            return r
        }))
    }, [])

    useEffect(() => {
        reparse(code)
    }, [code, reparse])

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            const {status, message} = fetcher.data
            if (status === 'success') {
                toast.success(message || "Cambios aplicados!")
                setOpen(false)
                setCode("")
            } else {
                toast.error(message || "Error al aplicar cambios.")
            }
        }
    }, [fetcher.data, fetcher.state])

    const validEntries = parsed.filter((p): p is Extract<ParsedEntry, {status: 'ok'}> => p.status === 'ok')
    const invalidCount = parsed.filter(p => p.status === 'invalid').length
    const totalChanges = validEntries.length * activeEnvs.length

    const toggleEnv = (env: string) => {
        setSelectedEnvs(prev => {
            const next = new Set(prev)
            next.has(env) ? next.delete(env) : next.add(env)
            return next
        })
    }

    const handleApply = () => {
        if (totalChanges === 0 || isSubmitting) return

        const formData = new FormData()
        let idx = 0
        for (const envPath of activeEnvs) {
            for (const entry of validEntries) {
                formData.append(`entries[${idx}][key]`, `${envPath}${entry.key}`)
                formData.append(`entries[${idx}][value]`, entry.value)
                formData.append(`entries[${idx}][secure]`, "false")
                idx++
            }
        }

        fetcher.submit(formData, {method: "POST", action: "/api/entry"})
    }

    const handleOpenChange = (v: boolean) => {
        setOpen(v)
        if (!v) setCode("")
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent
                side="right"
                className="w-[540px] bg-slate-900 border-slate-700 text-slate-50 flex flex-col p-6"
            >
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-slate-50">Bulk edit</SheetTitle>
                    <p className="text-xs text-slate-400">
                        Always applies to the current path. Select other environments to replicate.
                    </p>
                </SheetHeader>

                <div className="flex-1 flex flex-col gap-5 overflow-hidden min-h-0">

                    {/* Current path — always active */}
                    <div>
                        <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Current path</p>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded text-xs font-mono border bg-yellow-500/20 border-yellow-500 text-yellow-300">
                                {display(currentPath)}
                            </span>
                            <span className="text-xs text-slate-500">always included</span>
                        </div>
                    </div>

                    {/* Other environments */}
                    {otherEnvs.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                                Also apply to
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {otherEnvs.map(env => {
                                    const active = selectedEnvs.has(env)
                                    const targetPath = `${env}${subPath}`
                                    return (
                                        <button
                                            key={env}
                                            type="button"
                                            onClick={() => toggleEnv(env)}
                                            title={display(targetPath)}
                                            className={`px-2 py-1 rounded text-xs font-mono border transition-colors ${
                                                active
                                                    ? 'bg-slate-700 border-slate-400 text-slate-100'
                                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                                            }`}
                                        >
                                            {display(env)}
                                            {subPath && (
                                                <span className="text-slate-500">/{display(subPath)}</span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Editor */}
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Variables</p>
                        <div className="border rounded-md overflow-hidden border-gray-700">
                            <Editor
                                height="28vh"
                                language="plaintext"
                                theme="vs-dark"
                                value={code}
                                onChange={v => setCode(v ?? '')}
                                onMount={(e: any) => { editorRef.current = e }}
                                options={{
                                    minimap: {enabled: false},
                                    fontSize: 13,
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                }}
                            />
                        </div>
                        {invalidCount > 0 && (
                            <p className="text-xs text-red-400">
                                {invalidCount} invalid line{invalidCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {validEntries.length > 0 && (
                        <div className="flex-1 min-h-0 flex flex-col">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                                Preview —{" "}
                                <span className="text-slate-200 normal-case">{totalChanges} changes</span>
                            </p>
                            <div className="flex-1 overflow-auto space-y-3 pr-1">
                                {activeEnvs.map(envPath => (
                                    <div key={envPath}>
                                        <p className="text-xs text-yellow-400/80 font-mono mb-1">
                                            {display(envPath)}/
                                        </p>
                                        <div className="space-y-0.5 pl-2 border-l border-slate-700">
                                            {validEntries.map((e, i) => (
                                                <div key={i} className="text-xs font-mono text-slate-300 flex gap-1 truncate">
                                                    <span className="text-slate-200">{e.key}</span>
                                                    <span className="text-slate-500">=</span>
                                                    <span className="text-slate-400 truncate">
                                                        {e.value || <em className="text-slate-600">empty</em>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-700 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={totalChanges === 0 || isSubmitting}
                        className="bg-yellow-600 hover:bg-yellow-700 text-slate-900"
                    >
                        Apply {totalChanges > 0 && `(${totalChanges})`}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
