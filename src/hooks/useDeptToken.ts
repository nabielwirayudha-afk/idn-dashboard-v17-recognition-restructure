import { useState, useEffect, useCallback } from 'react';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCOYUjCtwp6WEoE3OVCC6Wq5lPAgx7d7wpPJw77mkPdNO06JJd5le71dOm24cQjVo1/exec';

export interface TokenResolution {
  token: string;
  department: string;
  isAdmin: boolean;
  createdAt?: string;
}

export interface TokenState {
  status: 'idle' | 'resolving' | 'valid' | 'invalid' | 'error';
  data: TokenResolution | null;
  error: string | null;
}

/**
 * Hook to resolve a department access token via backend.
 * Validates token server-side and returns department info.
 * 
 * Usage:
 *   const { status, data, error } = useDeptToken('abc123...');
 *   if (status === 'valid') console.log(data.department);
 */
export function useDeptToken(token: string | null | undefined): TokenState {
  const [state, setState] = useState<TokenState>({
    status: 'idle',
    data: null,
    error: null,
  });

  const resolve = useCallback(async () => {
    if (!token || token.trim() === '') {
      setState({ status: 'invalid', data: null, error: 'No access token provided.' });
      return;
    }

    setState({ status: 'resolving', data: null, error: null });

    try {
      const fetchUrl = new URL(APPS_SCRIPT_URL);
      fetchUrl.searchParams.set('action', 'resolveToken');
      fetchUrl.searchParams.set('t', token.trim());

      const response = await fetch(fetchUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        setState({
          status: 'invalid',
          data: null,
          error: result.message || 'Invalid access token.',
        });
        return;
      }

      setState({
        status: 'valid',
        data: {
          token: result.token,
          department: result.department,
          isAdmin: result.isAdmin,
          createdAt: result.createdAt,
        },
        error: null,
      });
    } catch (err) {
      setState({
        status: 'error',
        data: null,
        error: err instanceof Error ? err.message : 'Failed to validate token.',
      });
    }
  }, [token]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  return state;
}

/**
 * Hook to fetch department-filtered data using a token.
 * Data is already filtered server-side — client receives only allowed records.
 */
export function useDeptData(token: string | null | undefined) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || token.trim() === '') {
      setError('No access token provided.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchUrl = new URL(APPS_SCRIPT_URL);
      fetchUrl.searchParams.set('action', 'getData');
      fetchUrl.searchParams.set('t', token.trim());

      const response = await fetch(fetchUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.message || 'Failed to load data.');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
