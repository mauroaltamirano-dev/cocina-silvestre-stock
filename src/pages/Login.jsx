import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { LucideLock, LucideUser, LucideLoader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // Estados para el formulario
  const [email, setEmail] = useState("admin@admin.com"); // Pre-relleno para ir rápido
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(email, password);

      if (error) throw error;

      // Si todo sale bien, redirigimos al Dashboard
      navigate("/");
    } catch (error) {
      console.error("Error login:", error.message);
      setErrorMsg("Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center">
          <h2 className="text-2xl font-bold text-white">POS System</h2>
          <p className="text-slate-400 text-sm mt-1">Ingreso de Personal</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <LucideUser className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                placeholder="admin@admin.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <div className="relative">
              <LucideLock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LucideLoader2 className="animate-spin h-5 w-5" />
                Entrando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500">Solo personal autorizado</p>
        </div>
      </div>
    </div>
  );
}
