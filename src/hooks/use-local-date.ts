import { useEffect, useState } from 'react';
import { localDate } from '@/lib/progress';
/** Refresh daily UI after midnight or returning to an idle tab. */
export function useLocalDate() {
  const [today, setToday] = useState(localDate);
  useEffect(() => {
    const update = () => setToday(localDate());
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  return today;
}
