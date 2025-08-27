import {useCallback, useEffect, useReducer} from "react"
import type {EntriesEditable, EntryEditable} from "~/domain/entry";
import {useRetrieveSecret} from "~/hooks/use-retrieve-secret";
import {useFetcher} from "react-router";

const LOADING_SECRET_MESSAGE = "Loading secret..."
const LOADING_SAVING_MESSAGE = "Saving changes..."

interface Props {
    initialEntries: EntriesEditable;
    fetcher: ReturnType<typeof useFetcher>;
}

interface EntryState {
    entries: EntriesEditable;
    editingEntries: Set<string>;
    changes: Map<string, { newName: string; newValue: string; newSecure: boolean; }>
    revealedSecrets: Map<string, string>;
    isLoading: boolean;
    isLoadingMessage: string;
}

type Action =
    | { type: 'SET_ENTRIES'; payload: EntriesEditable }

    | { type: 'UPDATE_ENTRY_CHANGE'; payload: { entryId: string; newName: string; newValue: string; newSecure: boolean; } }
    | { type: 'FINISH_SINGLE_EDIT'; payload: string }

    | { type: 'START_LOADING'; payload: string }
    | { type: 'FINISH_LOADING' }
    | { type: 'REVEAL_SECRET'; payload: { id: string; value: string } }
    | { type: 'HIDE_SECRET'; payload: string }
    | { type: 'START_EDIT_ENTRY'; payload: string }
    | { type: 'CANCEL_EDIT_ENTRY'; payload: string }
    | { type: 'START_GLOBAL_EDIT' }
    | { type: 'FINISH_GLOBAL_EDIT' }
    | { type: 'CLEAR_REVEALED_SECRETS' };


function entryReducer(state: EntryState, action: Action): EntryState {
    switch (action.type) {
        case 'SET_ENTRIES':
            return { ...state, entries: action.payload, editingEntries: new Set(), changes: new Map() };

        case 'UPDATE_ENTRY_CHANGE': {
            const newChanges = new Map(state.changes);
            newChanges.set(action.payload.entryId, {
                newName: action.payload.newName,
                newValue: action.payload.newValue,
                newSecure: action.payload.newSecure
            });
            return { ...state, changes: newChanges };
        }

        case 'FINISH_SINGLE_EDIT': {
            const newEditing = new Set(state.editingEntries);
            newEditing.delete(action.payload);
            const newChanges = new Map(state.changes);
            newChanges.delete(action.payload);
            return { ...state, editingEntries: newEditing, changes: newChanges };
        }

        case 'CANCEL_EDIT_ENTRY': {
            const entryId = action.payload;
            const newEditing = new Set(state.editingEntries);
            newEditing.delete(entryId);
            const newChanges = new Map(state.changes);
            newChanges.delete(entryId);
            return { ...state, editingEntries: newEditing, changes: newChanges };
        }
        case 'START_LOADING':
            return { ...state, isLoading: true, isLoadingMessage: action.payload };
        case 'FINISH_LOADING':
            return { ...state, isLoading: false };
        case 'REVEAL_SECRET': {
            const newRevealed = new Map(state.revealedSecrets);
            newRevealed.set(action.payload.id, action.payload.value);
            return { ...state, revealedSecrets: newRevealed };
        }
        case 'HIDE_SECRET': {
            const newRevealed = new Map(state.revealedSecrets);
            newRevealed.delete(action.payload);
            return { ...state, revealedSecrets: newRevealed };
        }
        case 'START_EDIT_ENTRY': {
            const newEditing = new Set(state.editingEntries);
            newEditing.add(action.payload);
            return { ...state, editingEntries: newEditing };
        }

        case 'START_GLOBAL_EDIT':
            return {
                ...state,
                editingEntries: new Set(state.entries.map(e => `${e.path}/${e.key}`))
            };
        case 'FINISH_GLOBAL_EDIT':
            return { ...state,  editingEntries: new Set(), changes: new Map() };

        case 'CLEAR_REVEALED_SECRETS':
            return { ...state, revealedSecrets: new Map() };
        default:
            return state;
    }
}

export function useEntry({initialEntries, fetcher}: Props) {
    const initialState: EntryState = {
        entries: initialEntries,
        editingEntries: new Set(),
        changes: new Map(),
        revealedSecrets: new Map(),
        isLoading: false,
        isLoadingMessage: '',
    };

    const [state, dispatch] = useReducer(entryReducer, initialState);
    const { getSecret } = useRetrieveSecret();

    useEffect(() => {
        dispatch({ type: 'SET_ENTRIES', payload: initialEntries });
    }, [initialEntries]);

    const toggleSecretVisibility = useCallback(async (id: string) => {
        if (state.revealedSecrets.has(id)) {
            dispatch({ type: 'HIDE_SECRET', payload: id });
            return;
        }

        dispatch({ type: 'START_LOADING', payload: LOADING_SECRET_MESSAGE });
        try {
            const secretValue = await getSecret(id);
            if (secretValue) {
                dispatch({ type: 'REVEAL_SECRET', payload: { id, value: secretValue } });
            }
        } catch (error) {
            console.error("Failed to retrieve secret:", error);
        } finally {
            dispatch({ type: 'FINISH_LOADING' });
        }
    }, [getSecret, state.revealedSecrets]);

    const startEditingEntry = useCallback((entry: EntryEditable) => {
        dispatch({ type: 'START_EDIT_ENTRY', payload: `${entry.path}/${entry.key}` });
    }, []);

    const startGlobalEdit = useCallback(() => {
        dispatch({ type: 'START_GLOBAL_EDIT' });
    }, []);


    const cancelAllEdits = useCallback(() => {
        dispatch({ type: 'FINISH_GLOBAL_EDIT' });
    }, []);

    const cancelEdit = useCallback((path: string) => {
        dispatch({ type: 'CANCEL_EDIT_ENTRY', payload: path });
    }, []);


    const updateEntryChange = useCallback((entryId: string, newName: string, newValue: string, newSecure: boolean) => {
        dispatch({ type: 'UPDATE_ENTRY_CHANGE', payload: { entryId, newName, newValue, newSecure } });
    }, []);

    const saveAllChanges = useCallback(() => {
        if (state.changes.size === 0) {
            console.log("No changes to save.");
            dispatch({ type: 'FINISH_GLOBAL_EDIT' });
            return;
        }

        const formData = new FormData();
        let index = 0;

        state.entries.forEach(originalEntry => {
            const entryId = `${originalEntry.path}/${originalEntry.key}`;
            const pendingChange = state.changes.get(entryId);

            if (pendingChange) {
                const updatedEntry = {
                    ...originalEntry,
                    key: pendingChange.newName,
                    value: pendingChange.newValue,
                    secure: pendingChange.newSecure,
                };

                formData.append(`entries[${index}][key]`, `${updatedEntry.path}/${updatedEntry.key}`);
                formData.append(`entries[${index}][value]`, updatedEntry.value);
                formData.append(`entries[${index}][secure]`, String(updatedEntry.secure));
                index++;
            }
        });

        console.log("Submitting FormData to /api/entry:", formData);
        fetcher.submit(formData, {
            method: "POST",
            action: "/api/entry"
        });

        dispatch({ type: 'FINISH_GLOBAL_EDIT' });
        dispatch({ type: 'CLEAR_REVEALED_SECRETS' });

    }, [state.entries, state.changes, fetcher]);

    const saveEntry = useCallback(async (entry: EntryEditable) => {
        const entryId = `${entry.path}/${entry.key}`;
        const pendingChange = state.changes.get(entryId);
        const hasRealChanges = pendingChange && (pendingChange.newName !== entry.key || pendingChange.newValue !== entry.value || pendingChange.newSecure !== entry.secure );

        if (!hasRealChanges) {
            dispatch({ type: 'FINISH_SINGLE_EDIT', payload: entryId });
            return;
        }

        const formData = new FormData();
        const updatedEntry = {
            ...entry,
            key: pendingChange.newName,
            value: pendingChange.newValue,
            secure: pendingChange.newSecure,
        };

        formData.append(`entries[0][key]`, `${updatedEntry.path}/${updatedEntry.key}`);
        formData.append(`entries[0][value]`, updatedEntry.value);
        formData.append(`entries[0][secure]`, String(updatedEntry.secure));

        fetcher.submit(formData, {
            method: "POST",
            action: "/api/entry"
        });

        dispatch({ type: 'FINISH_SINGLE_EDIT', payload: entryId });
        dispatch({ type: 'CLEAR_REVEALED_SECRETS' });
    }, [state.changes, fetcher]);

    return {
        ...state,
        toggleSecretVisibility,
        cancelEdit,
        startGlobalEdit,
        startEditingEntry,
        saveAllChanges,
        cancelAllEdits,
        saveEntry,
        updateEntryChange
    };
}