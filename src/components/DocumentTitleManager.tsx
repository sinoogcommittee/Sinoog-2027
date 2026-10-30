import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getTitleForPath } from '../lib/documentTitle';

export function DocumentTitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getTitleForPath(pathname);
  }, [pathname]);

  return null;
}
