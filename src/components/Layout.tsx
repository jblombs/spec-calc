import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'active' : undefined;
}

export function Layout() {
  const { settings, setTheme, activeProject } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        {!isHome && (
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/')}
            aria-label="Back to dashboard"
          >
            ← Back
          </button>
        )}
        <NavLink to="/" className="brand">
          <span className="brand-mark">SC</span>
          <span>SpecCalc</span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/beam" className={navClass}>
            Beam
          </NavLink>
          <NavLink to="/materials" className={navClass}>
            Materials
          </NavLink>
          <NavLink to="/units" className={navClass}>
            Units
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            Settings
          </NavLink>
        </nav>
        <div className="topbar-actions">
          {activeProject && (
            <span className="chip" title="Active project">
              {activeProject.name}
            </span>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setTheme(settings.theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
