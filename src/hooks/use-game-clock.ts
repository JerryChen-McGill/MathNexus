import { createContext, useContext } from 'react';
import { GameClock } from '@/lib/gameClock';
export const GameClockContext = createContext<GameClock | null>(null);
export function useGameClock() {
  const clock = useContext(GameClockContext);
  if (!clock) throw new Error('Game requires a session clock');
  return clock;
}
