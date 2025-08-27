import {useCallback, useState} from "react";
import {toast} from "sonner";

async function retrieveSecret(path: string): Promise<string> {
    const response = await fetch(`/api/get-secret?keyPath=${encodeURIComponent(path)}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch secret. Status: ${response.status}`);
    }
    return await response.json();
}

export function useRetrieveSecret() {
    const [cache, setCache] = useState<Map<string, string>>(new Map());

    const getSecret = useCallback(async (path: string) => {
        if (cache.has(path)) {
            return cache.get(path);
        }
        try {
            const secretValue = await retrieveSecret(path);
            setCache(prevCache => new Map(prevCache).set(path, secretValue));
            return secretValue;
        } catch (error) {
            toast.error("Error loading secret");
            console.error(`Failed to fetch secret for ${path}:`, error);
            return "";
        }
    }, [cache]);

    const invalidateSecret = useCallback((path: string) => {
        setCache(prevCache => {
            const newCache = new Map(prevCache);
            if (newCache.has(path)) {
                newCache.delete(path);
                return newCache;
            }
            return prevCache;
        });
    }, [])

    const invalidateAll = useCallback(() => {
        setCache(new Map())
    }, [])

    return {getSecret, invalidateSecret, invalidateAll}
}