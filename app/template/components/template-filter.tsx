import {Input} from "~/components/ui/input"
import {Search} from "lucide-react"

interface TemplateFilterProps {
    searchTerm: string
    onSearchChange: (value: string) => void
}

export function TemplateFilter({ searchTerm, onSearchChange }: TemplateFilterProps) {
    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
                placeholder="Search services or stages..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400"
            />
        </div>
    )
}
