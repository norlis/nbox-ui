import {useState} from "react"
import {Eye, EyeOff, Maximize2} from "lucide-react"
import {Button} from "~/components/ui/button"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "~/components/ui/dialog"
import {ScrollArea} from "~/components/ui/scroll-area";

interface ValueDisplayProps {
    value: string
    isSecure: boolean
    isRevealed: boolean
    maxLength?: number
    onToggleVisibility: () => void
}

export function ValueDisplay({ value, isSecure, isRevealed, maxLength = 60, onToggleVisibility }: ValueDisplayProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const shouldTruncate = value.length > maxLength
    const displayValue = shouldTruncate ? `${value.substring(0, maxLength)}...` : value

    return (
        <div className="flex items-center space-x-2">
            <span className="text-slate-300 font-mono text-sm break-all flex-1">{displayValue}</span>

            <div className="flex items-center space-x-1 flex-shrink-0">
                {shouldTruncate && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white transition-colors"
                                title="Show full value"
                            >
                                <Maximize2 className="h-3 w-3" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-slate-200">Full Value</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4   ">
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
                                    <div className="text-slate-300 font-mono text-sm break-all leading-relaxed">
                                        <ScrollArea className="h-[calc(70vh-5rem)] py-2">
                                            {value}
                                        </ScrollArea>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400">Length: {value.length} characters</div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {isSecure && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleVisibility}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white transition-colors"
                        title={isRevealed ? "Hide secret" : "Reveal secret"}
                    >
                        {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                )}
            </div>
        </div>
    )
}
