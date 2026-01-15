import { Link, useLocation } from "react-router-dom";
import {
  LucideLayoutDashboard,
  LucideUtensilsCrossed,
  LucideLogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cocina Silvestre</h1>
          <p className="text-xs text-slate-400">Sistema de Gestión</p>
        </div>

        <div className="flex gap-4 items-center">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive("/")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LucideLayoutDashboard size={18} />
            <span className="hidden sm:inline text-sm font-medium">Stock</span>
          </Link>

          <Link
            to="/recetas"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive("/recetas")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LucideUtensilsCrossed size={18} />
            <span className="hidden sm:inline text-sm font-medium">
              Recetas
            </span>
          </Link>

          <div className="h-6 w-px bg-slate-700 mx-2"></div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="text-slate-400 hover:text-red-400 transition-colors"
            title="Cerrar Sesión"
          >
            <LucideLogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
