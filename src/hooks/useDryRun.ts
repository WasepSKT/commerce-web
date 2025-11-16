import { useMemo } from 'react';

export function useDryRun(dryRunFlag: string | null) {
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const dryRun = useMemo(() => {
    // Explicit enable via query parameter
    if (dryRunFlag === '1' || dryRunFlag === 'true') return true;
    
    // Explicit disable via query parameter
    if (dryRunFlag === '0' || dryRunFlag === 'false') return false;
    
    // Default: disabled (allow real payments)
    return false;
  }, [dryRunFlag]);
  
  return dryRun;
}


