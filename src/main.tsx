import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
// @ts-ignore: CSS import without type declarations
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
