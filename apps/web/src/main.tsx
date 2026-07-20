import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/reset.css';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';
import { LoginPage } from './pages/LoginPage';
import { CampanhasPage } from './pages/CampanhasPage';
import { CampanhaPage } from './pages/CampanhaPage';
import { CenaEditorPage } from './pages/CenaEditorPage';
import { GamePage } from './pages/GamePage';
import { RequireAuth } from './app/RequireAuth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><CampanhasPage /></RequireAuth>} />
        <Route path="/campanha/:id" element={<RequireAuth><CampanhaPage /></RequireAuth>} />
        <Route path="/campanha/:id/cena/:sceneId" element={<RequireAuth><CenaEditorPage /></RequireAuth>} />
        <Route path="/jogo/:sessionId" element={<RequireAuth><GamePage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
