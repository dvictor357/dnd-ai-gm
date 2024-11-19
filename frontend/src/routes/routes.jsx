import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ChatPage from '../pages/ChatPage';
import CharacterPage from '../pages/CharacterPage';
import StatsPage from '../pages/StatsPage';

export const routes = (
  <Route path="/" element={<MainLayout />}>
    <Route index element={<ChatPage />} />
    <Route path="character" element={<CharacterPage />} />
    <Route path="stats" element={<StatsPage />} />
  </Route>
);
