import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ScrollToTop from "./components/ScrollToTop";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);