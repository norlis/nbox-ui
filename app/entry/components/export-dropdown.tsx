import {Download} from "lucide-react"
import {Button} from "~/components/ui/button"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "~/components/ui/dropdown-menu"

interface ExportDropdownProps {
    currentPath: string
}

const FORMATS = [
    {label: 'JSON', value: 'json'},
    {label: 'YAML', value: 'yaml'},
    {label: 'dotenv', value: 'dotenv'},
    {label: 'ECS Task Definition', value: 'ecs'},
] as const

export function ExportDropdown({currentPath}: Readonly<ExportDropdownProps>) {
    const handleExport = (format: string) => {
        window.location.href = `/api/entry-export?prefix=${encodeURIComponent(currentPath)}&format=${format}`
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Export entries"
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                >
                    <Download className="h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="bg-slate-900 border-slate-700 text-slate-200"
            >
                {FORMATS.map(f => (
                    <DropdownMenuItem
                        key={f.value}
                        onClick={() => handleExport(f.value)}
                        className="cursor-pointer hover:bg-slate-700 hover:text-yellow-300 font-mono text-sm"
                    >
                        {f.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
