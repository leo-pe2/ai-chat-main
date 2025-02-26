import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import NewsPage from './pages/NewsPage';
import NotesPage from './pages/NotesPage';

const App: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/chat/:chatId" element={<LandingPage />} />
    <Route path="/news" element={<NewsPage />} />
    <Route path="/notes" element={<NotesPage />} />
  </Routes>
);

export default App;
