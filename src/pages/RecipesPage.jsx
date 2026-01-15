import { useEffect, useState } from "react";
import { useStockStore } from "../store/useStockStore";
import {
  LucidePlus,
  LucideSearch,
  LucideChefHat,
  LucideTrash2,
  LucidePencil,
} from "lucide-react";
import ProductModal from "../components/ProductModal";
import RecipeModal from "../components/RecipeModal";

export default function RecipesPage() {
  const { productos, cargarProductos, borrarProducto } = useStockStore();

  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [recetaActiva, setRecetaActiva] = useState(null); // Para editar ingredientes o cocinar
  const [productoAEditar, setProductoAEditar] = useState(null); // Para cambiar nombre/precio
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtramos solo lo que sea categoría 'receta'
  const recetas = productos.filter(
    (p) =>
      p.categoria === "receta" &&
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirReceta = (prod) => setRecetaActiva(prod);
  const editarProducto = (prod) => {
    setProductoAEditar(prod);
    setMostrarModalAlta(true);
  };
  const handlePlatoCreado = (nuevoPlato) => {
    // Abrimos inmediatamente el modal de receta para ese plato
    setRecetaActiva(nuevoPlato);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* BUSCADOR Y BOTÓN CREAR */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-xl px-3 shadow-sm">
            <LucideSearch className="text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar plato..."
              className="w-full p-3 outline-none text-slate-700 bg-transparent"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              setProductoAEditar(null);
              setMostrarModalAlta(true);
            }}
            className="bg-slate-900 text-white px-4 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-md transition-all active:scale-95"
          >
            <LucidePlus size={20} />{" "}
            <span className="hidden sm:inline">Nuevo Plato</span>
          </button>
        </div>

        {/* GRILLA DE RECETAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {recetas.length === 0 ? (
            <div className="col-span-full text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              No tienes recetas creadas. ¡Crea tu menú!
            </div>
          ) : (
            recetas.map((prod) => (
              <div
                key={prod.id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">
                      {prod.nombre}
                    </h3>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                      Plato / Menú
                    </span>
                  </div>
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <LucideChefHat size={24} />
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => abrirReceta(prod)}
                    className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                  >
                    Ver Receta / Cocinar
                  </button>
                  <button
                    onClick={() => editarProducto(prod)}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LucidePencil size={18} />
                  </button>
                  <button
                    onClick={() => borrarProducto(prod.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LucideTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODALES */}
      {mostrarModalAlta && (
        <ProductModal
          onClose={() => setMostrarModalAlta(false)}
          productoAEditar={productoAEditar}
          // Forzamos que si crea desde aquí, sea categoría receta por defecto
          defaultCategory="receta"
        />
      )}

      {recetaActiva && (
        <RecipeModal
          producto={recetaActiva}
          onClose={() => setRecetaActiva(null)}
        />
      )}

      {mostrarModalAlta && (
        <ProductModal
          onClose={() => setMostrarModalAlta(false)}
          productoAEditar={productoAEditar}
          defaultCategory="receta"
          onCreated={handlePlatoCreado} // <--- ¡LA CLAVE!
        />
      )}
    </div>
  );
}
