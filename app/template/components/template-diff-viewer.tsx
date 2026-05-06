import {DiffEditor} from "@monaco-editor/react"
import {useEffect, useState} from "react"
import {extensionToLanguage} from "~/template/editor-lang"

interface Props {
    original: string
    modified: string
    filename: string
    readOnly?: boolean
    sideBySide?: boolean
}

export function TemplateDiffViewer({original, modified, filename, readOnly = true, sideBySide = true}: Props) {
    const [isClient, setIsClient] = useState(false)
    const language = extensionToLanguage(filename)

    useEffect(() => {
        setIsClient(typeof window !== 'undefined')
    }, [])

    if (!isClient) return null

    return (
        <div className="border border-gray-900 bg-neutral-900 w-full h-full flex flex-col">
            <div className="flex-grow border rounded-md overflow-hidden border-gray-700">
                <DiffEditor
                    height="100%"
                    width="100%"
                    language={language}
                    theme="vs-dark"
                    original={original}
                    modified={modified}
                    options={{
                        minimap: {enabled: false},
                        fontSize: 14,
                        wordWrap: 'off',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        readOnly,
                        renderSideBySide: sideBySide,
                        ignoreTrimWhitespace: false,
                        scrollbar: {
                            horizontal: 'auto',
                            vertical: 'auto',
                            useShadows: false,
                        },
                    }}
                />
            </div>
        </div>
    )
}