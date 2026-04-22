import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import GameHub from '@/pages/GameHub';
import GameArena from '@/pages/GameArena';
import SkillTreePage from '@/pages/SkillTreePage';
import Profile from '@/pages/Profile';
import Navbar from '@/components/Navbar';
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export default function App() {
  const { playerName } = useGameStore();

  useEffect(() => {
    if (!playerName) {
      useGameStore.getState().setPlayerName('数学探险家');
    }
  }, [playerName]);

  return (
    <div className="min-h-screen bg-[var(--black-1)] text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<GameHub />} />
        <Route path="/game/:gameId" element={<GameArena />} />
        <Route path="/skilltree" element={<SkillTreePage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}
