import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { BeamCalculator } from './pages/BeamCalculator';
import { MaterialEstimator } from './pages/MaterialEstimator';
import { UnitConverter } from './pages/UnitConverter';
import { Settings } from './pages/Settings';
import { ComingSoon } from './pages/ComingSoon';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="beam" element={<BeamCalculator />} />
            <Route path="materials" element={<MaterialEstimator />} />
            <Route path="units" element={<UnitConverter />} />
            <Route path="settings" element={<Settings />} />
            <Route path="coming/:module" element={<ComingSoon />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
