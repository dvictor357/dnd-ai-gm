import React from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import { routes } from './routes/routes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes}
      </Routes>
    </BrowserRouter>
  );
}

export default App;