import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages & Components
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RecipesPage from "./pages/RecipesPage"; // <--- Importamos la nueva página
import Navbar from "./components/Navbar"; // <--- Importamos el Navbar

// Componente para proteger rutas privadas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // Si no está logueado, lo mandamos al login
    return <Navigate to="/login" replace />;
  }

  // Si está logueado, mostramos el Navbar y el contenido (children)
  return (
    <>
      <Navbar /> {/* El menú aparecerá en todas las páginas protegidas */}
      {children}
    </>
  );
};

export default function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta Pública */}
            <Route path="/login" element={<Login />} />

            {/* --- RUTAS PRIVADAS (Con Navbar incluido) --- */}

            {/* 1. Dashboard (Stock y Pedidos) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* 2. Recetas (Menú y Producción) */}
            <Route
              path="/recetas"
              element={
                <ProtectedRoute>
                  <RecipesPage />
                </ProtectedRoute>
              }
            />

            {/* Redirección por defecto si la ruta no existe */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>

      {/* Cambié la posición a bottom-center para que no tape el Navbar en el móvil */}
      <Toaster position="bottom-center" reverseOrder={false} />
    </>
  );
}
