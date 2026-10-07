/**
 * useSearch Hook
 *
 * Easy integration of universal search system in React components
 * Handles query processing and result management
 */

import { useState, useCallback } from 'react';
import { processSearch, quickSearch } from '../services/searchController';

/**
 * Hook for universal search functionality
 *
 * @returns {object} Hook state and methods
 *   - isLoading: boolean - whether search is in progress
 *   - results: array - search results
 *   - error: string - error message if any
 *   - query: object - last executed query
 *   - search: function - execute a search
 *   - quickSearch: function - search with known module and filters
 *   - clearResults: function - clear the results
 *   - count: number - number of results
 */
export const useSearch = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState(null);
    const [message, setMessage] = useState(null);

    /**
     * Execute natural language search
     */
    const search = useCallback(async (searchQuery) => {
        if (!searchQuery || typeof searchQuery !== 'string') {
            setError('Search query must be a non-empty string');
            return null;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);
        setMessage(null);

        try {
            console.log('[useSearch] Executing search:', searchQuery);
            const response = await processSearch(searchQuery);

            if (response.success) {
                console.log('[useSearch] Success:', response);
                setResults(response.data || []);
                setQuery(response.query);
                setMessage(response.message);
                return response;
            } else {
                console.error('[useSearch] Failed:', response);
                setError(response.error || response.message);
                setQuery(response.query);
                setResults([]);
                return response;
            }
        } catch (err) {
            const errorMsg = err.message || 'Unknown error occurred';
            console.error('[useSearch] Error:', errorMsg);
            setError(errorMsg);
            setResults([]);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Execute quick search with known module and filters
     */
    const executeQuickSearch = useCallback(async (module, filters = {}) => {
        if (!module || typeof module !== 'string') {
            setError('Module must be a non-empty string');
            return null;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            console.log('[useSearch] Quick search:', module, filters);
            const response = await quickSearch(module, filters);

            if (response.success) {
                console.log('[useSearch] Quick search success:', response);
                setResults(response.data || []);
                setQuery({ module, filters });
                setMessage(`Found ${response.count} result(s)`);
                return response;
            } else {
                console.error('[useSearch] Quick search failed:', response);
                setError(response.error);
                setResults([]);
                return response;
            }
        } catch (err) {
            const errorMsg = err.message || 'Unknown error occurred';
            console.error('[useSearch] Error:', errorMsg);
            setError(errorMsg);
            setResults([]);
            return { success: false, error: errorMsg };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearResults = useCallback(() => {
        setResults([]);
        setError(null);
        setQuery(null);
        setMessage(null);
    }, []);

    return {
        isLoading,
        results,
        error,
        query,
        message,
        search,
        quickSearch: executeQuickSearch,
        clearResults,
        count: results.length,
        success: results.length > 0 && !error
    };
};

export default useSearch;
