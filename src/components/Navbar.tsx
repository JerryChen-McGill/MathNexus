import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Trophy, Settings, Sun, Moon } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const { totalScore, settings, updateSettings } = useGameStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/games', label: '游戏大厅', icon: Gamepad2 },
    { path: '/profile', label: '成就', icon: Trophy },
  ];

  const isLightTheme = settings.theme === 'light';
  const handleToggleTheme = () => {
    updateSettings({ theme: isLightTheme ? 'dark' : 'light' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 liquid-glass">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <span className="font-mono-data text-white text-sm font-bold">M</span>
            </div>
            <span className="font-semibold text-white tracking-tight hidden sm:block">
              MathNexus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-[var(--accent)]/20 text-[var(--accent-glow)]'
                      : 'text-[var(--black-6)] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Score + Settings */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg text-[var(--black-6)] hover:text-white hover:bg-white/5 transition-all duration-200"
              aria-label={isLightTheme ? '切换深色主题' : '切换浅色主题'}
              title={isLightTheme ? '切换深色主题' : '切换浅色主题'}
            >
              {isLightTheme ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--black-2)] border border-[var(--black-3)]">
              <Trophy size={14} className="text-[var(--gold)]" />
              <span className="font-mono-data text-sm text-[var(--gold)]">
                {totalScore.toLocaleString()}
              </span>
            </div>

            <Link
              to="/profile"
              className="p-2 rounded-lg text-[var(--black-6)] hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Settings size={18} />
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--black-6)] hover:text-white hover:bg-white/5"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block h-0.5 bg-current transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-[var(--black-3)] mt-2 pt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--accent)]/20 text-[var(--accent-glow)]'
                      : 'text-[var(--black-6)] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
