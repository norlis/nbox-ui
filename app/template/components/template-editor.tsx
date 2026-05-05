import {Editor, type OnMount} from "@monaco-editor/react";
import {useCallback, useEffect, useRef, useState} from "react";
import {extensionToLanguage} from "~/template/editor-lang";

interface TemplateEditorProps {
    value: string
    filename: string
    readOnly?: boolean
    onChange?: (value: string) => void
}

export function TemplateEditor({value, filename, readOnly = false, onChange}: TemplateEditorProps) {
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
    const [isClient, setIsClient] = useState(false)
    const [mounted, setMounted] = useState(false)

    const language = extensionToLanguage(filename)

    useEffect(() => {
        setIsClient(typeof window !== 'undefined')
    }, [])

    const applySchema = useCallback((monaco: Parameters<OnMount>[1], schema: Record<string, unknown>) => {
        const modelUri = monaco.Uri.parse('inmemory://model/1')
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            enableSchemaRequest: false,
            schemas: [
                {
                    uri: `schema://${filename}`,
                    fileMatch: [modelUri.toString()],
                    schema,
                }
            ]
        })
    }, [filename])

    // Fetch and apply JSON Schema after mount and when filename changes
    useEffect(() => {
        if (!mounted || language !== 'json' || !monacoRef.current || !filename) return

        const monaco = monacoRef.current
        const controller = new AbortController()

        fetch(`/api/boxspec-schema?pattern=${encodeURIComponent(filename)}`, {signal: controller.signal})
            .then(res => res.json())
            .then(data => {
                if (!data.schema || Object.keys(data.schema).length === 0) return
                applySchema(monaco, data.schema)
            })
            .catch(() => { /* ignore abort/network errors */ })

        return () => controller.abort()
    }, [filename, language, mounted, applySchema])

    const handleMount: OnMount = (_, monaco) => {
        monacoRef.current = monaco
        setMounted(true)
    }

    const handleChange = (value: string | undefined) => {
        onChange?.(value || '')
    }

    if (!isClient) return null

    return (
        <div className="border border-gray-900 bg-neutral-900 w-full h-[75vh] flex flex-col">
            <div className="flex-grow border rounded-md overflow-hidden border-gray-700">
                <Editor
                    height="100%"
                    width="100%"
                    language={language}
                    theme="vs-dark"
                    value={value}
                    onChange={handleChange}
                    onMount={handleMount}
                    options={{
                        minimap: {enabled: false},
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        readOnly,
                        cursorStyle: 'block',
                    }}
                />
            </div>
        </div>
    )
}