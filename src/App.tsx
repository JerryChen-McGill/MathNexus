import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useEffect, useLayoutEffect } from 'react';
import Home from '@/pages/Home';
import Program from '@/pages/Program';
import Rewards from '@/pages/Rewards';
import GameArena from '@/pages/GameArena';
import Profile from '@/pages/Profile';
import Navbar from '@/components/Navbar';
import { useGameStore } from '@/store/gameStore';
import { levelConfigs } from '@/data/games';
function LegacyGame() {
  const { gameId = '' } = useParams();
  const level = useGameStore(s => s.gameProgress[gameId]?.highestLevel ?? 1);
  return <Navigate to={levelConfigs[gameId] ? `/program/${gameId}/play/${level}` : '/games'} replace/>;
}
export default function App() {
  const theme = useGameStore(s => s.settings.theme);
  const recent = useGameStore(s => s.recentProgram);
  const location = useLocation();
  const bare = location.pathname === '/' || /\/play\//.test(location.pathname);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <div className={bare ? 'bare-app' : 'app-shell'}>
    {!bare && <Navbar/>}
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/program/:gameId" element={<Program/>}/>
      <Route path="/program/:gameId/play/:level" element={<GameArena/>}/>
      <Route path="/games" element={<Navigate to={`/program/${recent}`} replace/>}/>
      <Route path="/game/:gameId" element={<LegacyGame/>}/>
      <Route path="/rewards" element={<Rewards/>}/>
      <Route path="/skilltree" element={<Navigate to="/rewards" replace/>}/>
      <Route path="/profile" element={<Profile/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  </div>;
}
