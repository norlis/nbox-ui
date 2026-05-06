import {useEffect, useState} from "react"
import type {Box} from "~/template/template.types"
import {Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue} from "~/components/ui/select"

interface Props {
    label: string
    boxes: Box[]
    service: string | null
    stage: string | null
    onChange: (next: {service: string, stage: string}) => void
}

export function TemplateSidePicker({label, boxes, service: initialService, stage: initialStage, onChange}: Props) {
    const [service, setService] = useState<string>(initialService ?? "")
    const [stage, setStage] = useState<string>(initialStage ?? "")

    // Keep the picker in sync when the URL (loader) changes from outside.
    useEffect(() => setService(initialService ?? ""), [initialService])
    useEffect(() => setStage(initialStage ?? ""), [initialStage])

    const services = boxes.map(b => b.service)
    const currentBox = service ? boxes.find(b => b.service === service) : null
    const stagesForService = currentBox ? Object.keys(currentBox.stage) : []

    const handleService = (svc: string) => {
        const next = boxes.find(b => b.service === svc)
        const stages = next ? Object.keys(next.stage) : []
        const autoStage = stages.length === 1 ? stages[0] : ""
        setService(svc)
        setStage(autoStage)
        if (autoStage) onChange({service: svc, stage: autoStage})
    }

    const handleStage = (stg: string) => {
        if (!service) return
        setStage(stg)
        onChange({service, stage: stg})
    }

    return (
        <div className="flex flex-col gap-2 p-3 border border-slate-700 rounded-md bg-slate-800/50">
            <div className="flex gap-2">
                <Select value={service} onValueChange={handleService}>
                    <SelectTrigger className="flex-1 bg-slate-900">
                        <SelectValue placeholder="service"/>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700/60 border-gray-700 rounded-md text-white">
                        <SelectGroup className="bg-gray-700/60">
                            <SelectLabel>Services</SelectLabel>
                            {services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Select value={stage} onValueChange={handleStage} disabled={!service}>
                    <SelectTrigger className="flex-1 bg-slate-900">
                        <SelectValue placeholder="stage"/>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700/60 border-gray-700 rounded-md text-white">
                        <SelectGroup className="bg-gray-700/60">
                            <SelectLabel>Stages</SelectLabel>
                            {stagesForService.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}