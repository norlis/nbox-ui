import {useCallback, useRef} from "react";
import {toast} from "sonner";

async function retrieveSecret(path: string): Promise<string> {
    const response = await fetch(`/api/get-secret?keyPath=${encodeURIComponent(path)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch secret. Status: ${response.status}`);
    }
    return await response.json();
}

export function useRetrieveSecret() {
    const cacheRef = useRef<Map<string, string>>(new Map());
    const inFlightRef = useRef<Set<string>>(new Set());

    const getSecret = useCallback(async (path: string): Promise<string | undefined> => {
        if (cacheRef.current.has(path)) {
            return cacheRef.current.get(path);
        }
        if (inFlightRef.current.has(path)) {
            return undefined;
        }
        inFlightRef.current.add(path);
        try {
            const secretValue = await retrieveSecret(path);
            cacheRef.current.set(path, secretValue);
            return secretValue;
        } catch (error) {
            toast.error("Error loading secret");
            console.error(`Failed to fetch secret for ${path}:`, error);
            return undefined;
        } finally {
            inFlightRef.current.delete(path);
        }
    }, []);

    const invalidateSecret = useCallback((path: string) => {
        cacheRef.current.delete(path);
    }, []);

    const invalidateAll = useCallback(() => {
        cacheRef.current.clear();
    }, []);

    return {getSecret, invalidateSecret, invalidateAll}
}
