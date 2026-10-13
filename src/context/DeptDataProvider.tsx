import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useDeptToken, useDeptData } from '@/hooks/useDeptToken';

interface DeptDataContextType {
  token: string | null;
  department: string | null;
  isAdmin: boolean;
  status: 'idle' | 'resolving' | 'valid' | 'invalid' | 'error';
  data: any;
  loading: boolean;
  error: string | null;
}

const DeptDataContext = createContext<DeptDataContextType | null>(null);

export function useDeptDataContext() {
  const ctx = useContext(DeptDataContext);
  if (!ctx) throw new Error('useDeptDataContext must be used within DeptDataProvider');
  return ctx;
}

interface DeptDataProviderProps {
  token: string | null | undefined;
  children: ReactNode;
}

/**
 * Provider that wraps the department report page.
 * Handles token resolution and data fetching automatically.
 * Children are only rendered when token is valid and data is loaded.
 */
export function DeptDataProvider({ token, children }: DeptDataProviderProps) {
  const tokenState = useDeptToken(token);
  const { data, loading, error } = useDeptData(
    tokenState.status === 'valid' ? tokenState.data?.token : null
  );

  const value: DeptDataContextType = {
    token: tokenState.data?.token || null,
    department: tokenState.data?.department || null,
    isAdmin: tokenState.data?.isAdmin || false,
    status: tokenState.status,
    data,
    loading: tokenState.status === 'resolving' || loading,
    error: tokenState.error || error,
  };

  return (
    <DeptDataContext.Provider value={value}>
      {children}
    </DeptDataContext.Provider>
  );
}
