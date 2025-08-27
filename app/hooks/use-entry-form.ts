import type {Entries, Entry} from "~/domain/entry";
import {useState} from "react";

export function useEntryForm(initialEntries: Entries = []) {
    const [entries, setEntries] = useState<Entries>(initialEntries);

    const addEntry = () => {
        setEntries(prev => [...prev, { key: "", value: "", secure: false }]);
    };

    const removeEntry = (index: number) => {
        setEntries(prev => prev.filter((_, i) => i !== index));
    };

    const updateEntry = (index: number, field: keyof Entry, value: string | boolean) => {
        setEntries(prev => {
            const newEntries = [...prev];
            const entryToUpdate = { ...newEntries[index] };
            (entryToUpdate as any)[field] = value;
            newEntries[index] = entryToUpdate;
            return newEntries;
        });
    };

    return {entries, addEntry, updateEntry, removeEntry}
}