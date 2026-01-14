import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase"; // Solo para logout
import { useStockStore } from "../store/useStockStore";

// Iconos
import {
  LucidePlus,
  LucideMinus,
  LucideTrash2,
  LucideLogOut,
  LucideAlertTriangle,
  LucideAlertCircle,
  LucideChefHat,
  LucideWheat,
  LucideClipboardCopy,
  ScrollText,
  LucideHistory,
  LucideSortAsc,
  LucideClock,
  LucideAlertCircle as LucidePrioridad,
  LucidePencil,
} from "lucide-react";

// Componentes
import HistorialItem from "../components/HistorialItem";
import ProductModal from "../components/ProductModal";
import BottomControls from "../components/BottomControls";

// Helper Fecha
const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fechaISO));
};

export default function Dashboard() {
  // Store Global
  const {
    productos,
    historial,
    loading,
    cargarProductos,
    cargarHistorial,
    borrarProducto,
    actualizarStockCantidad,
    borrarPedido,
    procesarPedido,
  } = useStockStore();

  // UI States
  const [filtroCategoria, setFiltroCategoria] = useState("materia_prima");
  const [vistaPedido, setVistaPedido] = useState("nuevo");
  const [orden, setOrden] = useState("creacion");

  // Modal State
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);

  // Botonera State
  const [cantidadPaso, setCantidadPaso] = useState(1);
  const [modoManual, setModoManual] = useState(false);
  const [valorManual, setValorManual] = useState(0);

  // Pedido Local
  const [cantidadesPedido, setCantidadesPedido] = useState({});

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (filtroCategoria === "pedido" && vistaPedido === "historial") {
      cargarHistorial();
    }
  }, [filtroCategoria, vistaPedido]);

  // --- HANDLERS ---
  const abrirModalCrear = () => {
    setProductoAEditar(null);
    setMostrarModal(true);
  };

  const abrirModalEditar = (prod) => {
    setProductoAEditar(prod);
    setMostrarModal(true);
  };

  const handleUpdateStock = async (producto, operacion) => {
    let paso = modoManual ? parseFloat(valorManual) : cantidadPaso;
    if (isNaN(paso) || paso <= 0) {
      toast.error("Cantidad inválida");
      return;
    }

    const cambio = operacion === "sumar" ? paso : -paso;
    let nueva = parseFloat((producto.cantidad + cambio).toFixed(3));

    if (nueva < 0) {
      nueva = 0;
      if (operacion === "restar" && producto.cantidad > 0)
        toast("Stock vaciado", { icon: "🗑️" });
    }

    await actualizarStockCantidad(producto.id, nueva);
  };

  const handleGuardarPedido = async () => {
    const itemsAEnviar = productosProcesados.filter((p) => {
      const val = cantidadesPedido[p.id];
      return val && val.trim() !== "" && parseFloat(val) > 0;
    });

    if (itemsAEnviar.length === 0)
      return toast.error("Ingresa cantidades válidas");

    // Delegamos la lógica compleja al Store
    const exito = await procesarPedido(itemsAEnviar, cantidadesPedido);
    if (exito) {
      setCantidadesPedido({});
    }
  };

  // --- FILTROS Y ORDENAMIENTO ---
  const productosFiltrados = productos.filter((p) => {
    if (filtroCategoria === "pedido") {
      return p.cantidad <= p.stock_min * 1.5 && p.categoria !== "produccion";
    }
    return p.categoria === filtroCategoria;
  });

  const productosProcesados = [...productosFiltrados].sort((a, b) => {
    if (orden === "creacion") return 0;
    if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
    if (orden === "prioridad") {
      const ratioA = a.cantidad / (a.stock_min || 1);
      const ratioB = b.cantidad / (b.stock_min || 1);
      return ratioA - ratioB;
    }
    return 0;
  });

  const getEstadoStock = (prod) => {
    if (prod.cantidad <= prod.stock_min) return "critico";
    if (prod.cantidad <= prod.stock_min * 1.5) return "advertencia";
    return "ok";
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-48">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Cocina Silvestre</h1>
            <p className="text-xs text-slate-400">Sistema de Stock</p>
          </div>
          <div className="flex gap-3">
            {filtroCategoria !== "pedido" && (
              <button
                onClick={abrirModalCrear}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95"
              >
                <LucidePlus size={20} />
              </button>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-slate-400 hover:text-white"
            >
              <LucideLogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-3xl mx-auto">
        {/* PESTAÑAS */}
        <div className="flex gap-2 mb-4 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          {["materia_prima", "produccion", "pedido"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                filtroCategoria === cat
                  ? cat === "pedido"
                    ? "bg-amber-100 text-amber-900 border-amber-200"
                    : "bg-slate-100 text-slate-900 border-slate-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {cat === "materia_prima" && <LucideWheat size={16} />}
              {cat === "produccion" && <LucideChefHat size={16} />}
              {cat === "pedido" && <ScrollText size={16} />}
              <span className="capitalize">{cat.replace("_", " ")}s</span>
            </button>
          ))}
        </div>

        {/* BARRA DE FILTROS */}
        {filtroCategoria !== "pedido" && (
          <div className="flex justify-between items-center mb-4 px-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {productosProcesados.length} Productos
            </p>
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm overflow-x-auto">
              <button
                onClick={() => setOrden("creacion")}
                className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1 whitespace-nowrap ${
                  orden === "creacion"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400"
                }`}
              >
                <LucideClock size={12} /> Fecha
              </button>
              <button
                onClick={() => setOrden("prioridad")}
                className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1 whitespace-nowrap ${
                  orden === "prioridad"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400"
                }`}
              >
                <LucidePrioridad size={12} /> Prioridad
              </button>
              <button
                onClick={() => setOrden("nombre")}
                className={`px-3 py-1 text-xs rounded-md font-medium flex items-center gap-1 whitespace-nowrap ${
                  orden === "nombre"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-400"
                }`}
              >
                <LucideSortAsc size={12} /> Nombre
              </button>
            </div>
          </div>
        )}

        {/* SUBMENU PEDIDOS */}
        {filtroCategoria === "pedido" && (
          <div className="flex justify-center mb-6">
            <div className="bg-slate-200 p-1 rounded-lg flex gap-1">
              <button
                onClick={() => setVistaPedido("nuevo")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  vistaPedido === "nuevo"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                Nuevo Pedido
              </button>
              <button
                onClick={() => setVistaPedido("historial")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                  vistaPedido === "historial"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                <LucideHistory size={14} /> Historial
              </button>
            </div>
          </div>
        )}

        {/* LISTAS */}
        {filtroCategoria === "pedido" && vistaPedido === "historial" ? (
          <div className="space-y-4">
            {historial.length ? (
              historial.map((p) => (
                <HistorialItem
                  key={p.id}
                  pedido={p}
                  onEliminar={borrarPedido}
                />
              ))
            ) : (
              <p className="text-center text-slate-400 py-10">Sin historial.</p>
            )}
          </div>
        ) : (
          <>
            {filtroCategoria === "pedido" && productosProcesados.length > 0 && (
              <button
                onClick={handleGuardarPedido}
                className="w-full mb-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <LucideClipboardCopy size={20} /> Guardar y Copiar
              </button>
            )}

            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-slate-400 py-10 animate-pulse">
                  Cargando...
                </p>
              ) : productosProcesados.length === 0 ? (
                <p className="text-center py-10 text-slate-400 border border-dashed rounded-xl">
                  Vacío.
                </p>
              ) : (
                productosProcesados.map((prod) => {
                  const estado = getEstadoStock(prod);
                  const esModoPedido = filtroCategoria === "pedido";
                  let cardStyle = "bg-white border-slate-200",
                    textStyle = "text-slate-800";
                  if (estado === "critico") {
                    cardStyle = "bg-red-50 border-red-200 ring-1 ring-red-100";
                    textStyle = "text-red-900";
                  } else if (estado === "advertencia") {
                    cardStyle = "bg-amber-50 border-amber-200";
                    textStyle = "text-amber-900";
                  }

                  return (
                    <div
                      key={prod.id}
                      className={`p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between transition-all gap-4 ${cardStyle}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-lg ${textStyle}`}>
                            {prod.nombre}
                          </h3>
                          {estado === "critico" && !esModoPedido && (
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LucideAlertTriangle size={10} /> CRÍTICO
                            </span>
                          )}
                          {estado === "advertencia" && !esModoPedido && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <LucideAlertCircle size={10} /> BAJO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="bg-white/50 px-2 py-0.5 rounded border border-black/5">
                            {prod.unidad === "kg" ? "kg" : "un"}
                          </span>
                          {prod.fecha_produccion && (
                            <span>
                              Elab: {formatearFecha(prod.fecha_produccion)}
                            </span>
                          )}
                          {esModoPedido && (
                            <span className={`${textStyle} font-bold ml-1`}>
                              (Stock: {prod.cantidad})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        {esModoPedido ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm font-medium text-slate-600">
                              Pedir:
                            </span>
                            <input
                              type="number"
                              step="any"
                              placeholder="0"
                              className="border border-slate-300 rounded-lg px-3 py-2 w-20 text-center font-bold outline-none focus:ring-2 focus:ring-slate-900"
                              value={cantidadesPedido[prod.id] || ""}
                              onChange={(e) =>
                                setCantidadesPedido((prev) => ({
                                  ...prev,
                                  [prod.id]: e.target.value,
                                }))
                              }
                            />
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              {prod.unidad === "kg" ? "Kg" : "Un"}
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUpdateStock(prod, "restar")}
                              className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm active:scale-95 hover:bg-red-50 hover:text-red-600"
                            >
                              <LucideMinus size={20} />
                            </button>
                            <div className="text-center min-w-[4rem]">
                              <span
                                className={`text-2xl font-bold tabular-nums block ${textStyle}`}
                              >
                                {prod.cantidad}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                MIN: {prod.stock_min}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUpdateStock(prod, "sumar")}
                              className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-900 rounded-xl text-white shadow-sm active:scale-95 hover:bg-slate-800"
                            >
                              <LucidePlus size={20} />
                            </button>

                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => abrirModalEditar(prod)}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                              >
                                <LucidePencil size={16} />
                              </button>
                              <button
                                onClick={() => borrarProducto(prod.id)}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                              >
                                <LucideTrash2 size={16} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <ProductModal
          onClose={() => setMostrarModal(false)}
          productoAEditar={productoAEditar}
        />
      )}

      {/* BOTONERA */}
      {filtroCategoria !== "pedido" && (
        <BottomControls
          cantidadPaso={cantidadPaso}
          setCantidadPaso={setCantidadPaso}
          modoManual={modoManual}
          setModoManual={setModoManual}
          valorManual={valorManual}
          setValorManual={setValorManual}
        />
      )}
    </div>
  );
}
