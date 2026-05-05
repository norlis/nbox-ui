import React, {useCallback, useEffect, useRef, useState} from "react"
import {Button} from "../../components/ui/button"
import {Label} from "../../components/ui/label"
import {Editor, type OnMount} from "@monaco-editor/react"
import {useFetcher} from "react-router"
import type {EntryActionResponse} from "~/entry/entry.validations"
import {toast} from "sonner"

interface ImportEnvFormProps {
    currentPath: string
    onClose: () => void
}

const SECURE_NAMES = /SECRET|TOKEN|KEY|PASS|PWD|CREDENTIAL|PRIVATE/i

type ParsedLine =
    | { status: 'ok'; key: string; value: string; secure: boolean }
    | { status: 'skip' }
    | { status: 'invalid'; raw: string }

function parseLine(line: string, autoDetect: boolean): ParsedLine {
    const secureByComment = /\s*#\s*(secure|secret)\s*$/i.test(line)
    const cleaned = line
        .replace(/\s*#\s*(secure|secret)\s*$/i, '')
        .replace(/#.*$/, '')
        .trim()

    if (!cleaned) return {status: 'skip'}

    const eqIdx = cleaned.indexOf('=')
    if (eqIdx === -1) return {status: 'invalid', raw: line}

    const key = cleaned.slice(0, eqIdx).trim()
    const value = cleaned.slice(eqIdx + 1).trim()

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return {status: 'invalid', raw: line}

    const secure = secureByComment || (autoDetect && SECURE_NAMES.test(key))
    return {status: 'ok', key, value, secure}
}

const EXAMPLE = `DATABASE_URL=postgres://localhost:5432/mydb
API_KEY=abc123             # secure
SECRET_TOKEN=supersecret
FEATURE_FLAG=true`

export function ImportEnvForm({onClose, currentPath}: ImportEnvFormProps) {
    const fetcher = useFetcher<EntryActionResponse>()
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
    const [code, setCode] = useState(EXAMPLE)
    const [autoDetect, setAutoDetect] = useState(true)
    const [parsed, setParsed] = useState<ParsedLine[]>([])

    const isSubmitting = fetcher.state !== 'idle'

    const reparse = useCallback((text: string, detect: boolean) => {
        const lines = text.split('\n')
        setParsed(lines.map(l => parseLine(l, detect)))
    }, [])

    useEffect(() => {
        reparse(code, autoDetect)
    }, [code, autoDetect, reparse])

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            const {status, message} = fetcher.data
            if (status === 'success') {
                toast.success(message || "Entries imported successfully!")
                onClose()
            } else {
                toast.error(message || "An error occurred during import.")
            }
        }
    }, [fetcher.data, fetcher.state, onClose])

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor
    }

    const validEntries = parsed.filter((p): p is Extract<ParsedLine, {status: 'ok'}> => p.status === 'ok')
    const invalidCount = parsed.filter(p => p.status === 'invalid').length
    const secureCount = validEntries.filter(e => e.secure).length

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validEntries.length === 0 || isSubmitting) return

        const formData = new FormData()
        validEntries.forEach((entry, index) => {
            formData.append(`entries[${index}][key]`, `${currentPath}${entry.key}`)
            formData.append(`entries[${index}][value]`, entry.value)
            formData.append(`entries[${index}][secure]`, String(entry.secure))
        })

        fetcher.submit(formData, {method: "POST", action: "/api/entry"})
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-[70vh] space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <Label>Editor</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="auto-detect"
                            checked={autoDetect}
                            onChange={e => setAutoDetect(e.target.checked)}
                            className="accent-yellow-400"
                        />
                        <label htmlFor="auto-detect" className="text-xs text-slate-400 cursor-pointer">
                            Auto-detect secure by name
                        </label>
                    </div>
                </div>

                <div className="border rounded-md overflow-hidden border-gray-700">
                    <Editor
                        height="36vh"
                        language="plaintext"
                        theme="vs-dark"
                        value={code}
                        onChange={v => setCode(v ?? '')}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: {enabled: false},
                            fontSize: 13,
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>

                <p className="text-xs text-slate-500 mt-1">
                    Tip: add{" "}
                    <code className="text-yellow-400/80"># secure</code> at the end of a line to force secret.
                </p>
            </div>

            <div className="flex-1 overflow-auto">
                <p className="text-xs text-slate-400 mb-2">
                    <span className="text-slate-200 font-medium">{validEntries.length}</span> variables
                    {" • "}
                    <span className="text-yellow-400 font-medium">{secureCount}</span> 🔒 secure
                    {invalidCount > 0 && (
                        <> {" • "}<span className="text-red-400 font-medium">{invalidCount}</span> invalid</>
                    )}
                </p>
                <div className="space-y-1 max-h-[12vh] overflow-auto pr-1">
                    {parsed.map((p, i) => {
                        if (p.status === 'skip') return null
                        if (p.status === 'invalid') return (
                            <div key={i} className="text-xs text-red-400 font-mono truncate">
                                ✗ línea {i + 1}: formato inválido
                            </div>
                        )
                        return (
                            <div key={i} className="text-xs font-mono text-slate-300 flex items-center gap-1 truncate">
                                <span className="text-slate-500">{currentPath}</span>
                                <span className="text-slate-200">{p.key}</span>
                                <span className="text-slate-500">=</span>
                                <span className="text-slate-400 truncate">{p.value || <em className="text-slate-600">empty</em>}</span>
                                {p.secure && <span className="text-yellow-400 ml-auto shrink-0">🔒</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <Button type="button" variant="outline" onClick={onClose}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                    Cancel
                </Button>
                <Button type="submit" disabled={validEntries.length === 0 || isSubmitting}
                        className="bg-yellow-600 hover:bg-yellow-700 text-slate-900">
                    Import {validEntries.length > 0 && `(${validEntries.length})`}
                </Button>
            </div>
        </form>
    )
}
