import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  LucidePlus,
  LucideMinus,
  LucideTrash2,
  LucideLogOut,
  LucideAlertTriangle,
  LucideChefHat,
  LucideWheat,
  LucideScale,
  LucideSettings2,
  LucideCalculator,
} from "lucide-react";

export default function Dashboard() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("materia_prima");

  // --- NUEVO ESTADO PARA LA BOTONERA ---
  // Valor por defecto: 1 (1 unidad o 1 kilo)
  const [cantidadPaso, setCantidadPaso] = useState(1);
  const [modoManual, setModoManual] = useState(false);
  const [valorManual, setValorManual] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      categoria: "materia_prima",
      unidad: "unidad",
      stock_inicial: 0,
      stock_min: 5,
    },
  });

  const categoriaSeleccionada = watch("categoria");

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setProductos(data);
    } catch (error) {
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (data) => {
    const promesaGuardado = new Promise(async (resolve, reject) => {
      try {
        const nuevoProducto = {
          nombre: data.nombre,
          cantidad: parseFloat(data.stock_inicial),
          stock_min: parseFloat(data.stock_min),
          categoria: data.categoria,
          unidad: data.unidad,
          fecha_produccion: data.fecha_produccion || null,
        };

        const { error } = await supabase
          .from("productos")
          .insert([nuevoProducto]);
        if (error) throw error;

        reset();
        cargarProductos();
        resolve();
      } catch (e) {
        reject(e);
      }
    });

    toast.promise(promesaGuardado, {
      loading: "Guardando...",
      success: "¡Producto agregado!",
      error: "Error al guardar",
    });
  };

  // --- LÓGICA DE ACTUALIZACIÓN CON BOTONERA ---
  async function actualizarStock(producto, operacion) {
    // 1. Determinar cuánto vamos a mover según la botonera
    let paso = modoManual ? parseFloat(valorManual) : cantidadPaso;

    if (isNaN(paso) || paso <= 0) {
      toast.error("Ingresa una cantidad válida");
      return;
    }

    // 2. Determinar signo (+ o -)
    const cambio = operacion === "sumar" ? paso : -paso;

    // 3. Calcular nuevo total con redondeo para evitar errores de JS (0.1 + 0.2 = 0.30004)
    let nuevaCantidad = parseFloat((producto.cantidad + cambio).toFixed(3));

    // 4. LÓGICA DEL CERO: Si baja de 0, se queda en 0.
    if (nuevaCantidad < 0) {
      nuevaCantidad = 0;
      // Opcional: Avisar visualmente que se vació
      if (operacion === "restar" && producto.cantidad > 0) {
        toast("Stock vaciado a 0", { icon: "🗑️" });
      }
    }

    // Optimistic UI
    setProductos((prev) =>
      prev.map((p) =>
        p.id === producto.id ? { ...p, cantidad: nuevaCantidad } : p
      )
    );

    // Silent Update en Supabase
    const { error } = await supabase
      .from("productos")
      .update({ cantidad: nuevaCantidad })
      .eq("id", producto.id);

    if (error) {
      toast.error("Error de conexión");
      cargarProductos();
    }
  }

  async function borrarProducto(id) {
    if (!confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) toast.error("Error eliminando");
    else {
      toast.success("Eliminado");
      cargarProductos();
    }
  }

  const productosFiltrados = productos.filter(
    (p) => p.categoria === filtroCategoria
  );

  // Botones de la botonera inferior
  const presets = [
    { label: "1", val: 1, desc: "Unidad / Kg" },
    { label: "0.1", val: 0.1, desc: "100g" },
    { label: "0.5", val: 0.5, desc: "Media" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-40">
      {" "}
      {/* pb-40 para dejar espacio a la botonera flotante */}
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Cocina Silvestre</h1>
            <p className="text-xs text-slate-400">Sistema de Stock</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <LucideLogOut size={20} />
          </button>
        </div>
      </header>
      <div className="p-4 max-w-3xl mx-auto">
        {/* PESTAÑAS */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setFiltroCategoria("materia_prima")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              filtroCategoria === "materia_prima"
                ? "bg-slate-100 text-slate-900 border border-slate-200"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <LucideWheat size={16} /> Materias Primas
          </button>
          <button
            onClick={() => setFiltroCategoria("produccion")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              filtroCategoria === "produccion"
                ? "bg-slate-100 text-slate-900 border border-slate-200"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <LucideChefHat size={16} /> Producción
          </button>
        </div>

        {/* LISTA DE PRODUCTOS */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-slate-400 py-10 animate-pulse">
              Cargando...
            </p>
          ) : productosFiltrados.length === 0 ? (
            <p className="text-center py-10 text-slate-400 border border-dashed rounded-xl">
              No hay items aquí.
            </p>
          ) : (
            productosFiltrados.map((prod) => {
              const esCritico = prod.cantidad <= prod.stock_min;

              return (
                <div
                  key={prod.id}
                  className={`p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between transition-all gap-4 ${
                    esCritico
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Info Izquierda */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-bold text-lg ${
                          esCritico ? "text-red-800" : "text-slate-800"
                        }`}
                      >
                        {prod.nombre}
                      </h3>
                      {esCritico && (
                        <LucideAlertTriangle
                          size={16}
                          className="text-red-600"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {prod.unidad === "kg" ? "Por Peso (kg)" : "Por Unidad"}
                      </span>
                      {prod.fecha_produccion && (
                        <span>
                          Elab:{" "}
                          {new Date(prod.fecha_produccion).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Controles Derecha */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {/* Botón Restar */}
                    <button
                      onClick={() => actualizarStock(prod, "restar")}
                      className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-slate-600 shadow-sm active:scale-95 active:bg-red-50 active:border-red-200 active:text-red-600 transition-all"
                    >
                      <LucideMinus size={24} />
                    </button>

                    {/* Display Cantidad */}
                    <div className="text-center min-w-[5rem]">
                      <span
                        className={`text-2xl font-bold tabular-nums block ${
                          esCritico ? "text-red-600" : "text-slate-900"
                        }`}
                      >
                        {prod.cantidad}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {prod.unidad === "kg" ? "KG" : "UN"}
                      </span>
                    </div>

                    {/* Botón Sumar */}
                    <button
                      onClick={() => actualizarStock(prod, "sumar")}
                      className="w-12 h-12 flex items-center justify-center bg-slate-900 border-2 border-slate-900 rounded-xl text-white shadow-sm active:scale-95 active:bg-slate-800 transition-all"
                    >
                      <LucidePlus size={24} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulario de Alta (Colapsable o al final) */}
        <div className="mt-10 border-t border-slate-200 pt-6">
          <h3 className="text-slate-500 font-bold mb-4 text-sm uppercase">
            Agregar Nuevo Ítem
          </h3>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-4 rounded-xl border border-slate-200 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <input
                {...register("nombre", { required: true })}
                placeholder="Nombre"
                className="col-span-2 border p-2 rounded-lg"
              />
              <select
                {...register("categoria")}
                className="border p-2 rounded-lg bg-white"
              >
                <option value="materia_prima">Materia Prima</option>
                <option value="produccion">Producción</option>
              </select>
              <select
                {...register("unidad")}
                className="border p-2 rounded-lg bg-white"
              >
                <option value="unidad">Unidad</option>
                <option value="kg">Kilo</option>
              </select>
              <input
                type="number"
                step="any"
                {...register("stock_inicial")}
                placeholder="Stock Inicial"
                className="border p-2 rounded-lg"
              />
              <input
                type="number"
                step="any"
                {...register("stock_min")}
                placeholder="Mínimo"
                className="border p-2 rounded-lg"
              />
              {categoriaSeleccionada === "produccion" && (
                <input
                  type="date"
                  {...register("fecha_produccion")}
                  className="col-span-2 border p-2 rounded-lg"
                />
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-lg transition-colors"
            >
              Guardar Ítem
            </button>
          </form>
        </div>
      </div>
      {/* --- BOTONERA FLOTANTE INFERIOR --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex items-center gap-1">
            <LucideSettings2 size={12} /> Configuración de Ajuste
          </p>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Presets (1, 0.1, 0.5) */}
            {presets.map((preset) => (
              <button
                key={preset.val}
                onClick={() => {
                  setCantidadPaso(preset.val);
                  setModoManual(false);
                }}
                className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg flex flex-col items-center justify-center transition-all border ${
                  !modoManual && cantidadPaso === preset.val
                    ? "bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-1"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg font-bold">{preset.label}</span>
                <span
                  className={`text-[10px] ${
                    !modoManual && cantidadPaso === preset.val
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {preset.desc}
                </span>
              </button>
            ))}

            {/* Opción Manual / Calculadora */}
            <div
              className={`flex-1 min-w-[120px] rounded-lg p-1 border flex items-center gap-2 transition-all ${
                modoManual
                  ? "bg-amber-50 border-amber-300 ring-1 ring-amber-200"
                  : "bg-white border-slate-200"
              }`}
            >
              <button
                onClick={() => setModoManual(true)}
                className={`p-2 rounded-md ${
                  modoManual ? "text-amber-600" : "text-slate-400"
                }`}
              >
                <LucideCalculator size={20} />
              </button>
              <div className="flex flex-col w-full">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Manual
                </span>
                <input
                  type="number"
                  step="any"
                  value={valorManual}
                  onClick={() => setModoManual(true)}
                  onChange={(e) => {
                    setValorManual(e.target.value);
                    setModoManual(true);
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent outline-none text-lg font-bold text-slate-800 placeholder-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
