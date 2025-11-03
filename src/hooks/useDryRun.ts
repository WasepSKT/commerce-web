import { useMemo } from 'react';

export function useDryRun(dryRunFlag: string | null) {
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const dryRun = useMemo(() => {
    if (dryRunFlag === '1' || dryRunFlag === 'true') return true;
    if (dryRunFlag === '0' || dryRunFlag === 'false') return false;
    return isLocalhost; // default to true on localhost for safe testing
  }, [dryRunFlag, isLocalhost]);
  return dryRun;
}


