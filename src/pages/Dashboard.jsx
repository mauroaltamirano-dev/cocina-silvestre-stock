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
  LucideAlertCircle,
  LucideChefHat,
  LucideWheat,
  LucideSettings2,
  LucideCalculator,
  LucideClipboardCopy,
  ScrollText,
  LucideHistory,
  LucideCalendar,
  LucideChevronDown,
  LucideX,
  LucideSortAsc,
  LucideClock,
  LucideCopy,
} from "lucide-react";

// --- HELPERS ---
const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fechaISO));
};

// --- COMPONENTE HISTORIAL ITEM ---
// Ahora recibe "onEliminar" desde el padre para evitar errores de scope
const HistorialItem = ({ pedido, onEliminar }) => {
  const [abierto, setAbierto] = useState(false);

  const copiarEstePedido = (e) => {
    e.stopPropagation(); // Evita que se abra/cierre el acordeón al copiar
    let msg = `📋 *PEDIDO COCINA SILVESTRE* (${formatearFecha(
      pedido.created_at
    )})\n\n`;
    pedido.detalle_pedidos.forEach((d) => {
      msg += `- ${d.producto_nombre}: *${d.cantidad_solicitada}*\n`;
    });
    navigator.clipboard.writeText(msg);
    toast.success("Copiado al portapapeles");
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Evita abrir el acordeón
    onEliminar(pedido.id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-sm transition-all animate-in fade-in">
      <div
        onClick={() => setAbierto(!abierto)}
        className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {/* Botón Eliminar Pedido */}
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            title="Eliminar pedido completo"
          >
            <LucideTrash2 size={18} />
          </button>

          <div className="bg-slate-200 p-2 rounded-lg text-slate-600 flex-shrink-0">
            <LucideCalendar size={20} />
          </div>

          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate">
              Pedido del {formatearFecha(pedido.created_at)}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {pedido.detalle_pedidos.length} productos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={copiarEstePedido}
            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50"
            title="Copiar mensaje"
          >
            <LucideCopy size={18} />
          </button>
          <div
            className={`p-2 text-slate-400 transition-transform duration-300 ${
              abierto ? "rotate-180" : ""
            }`}
          >
            <LucideChevronDown size={18} />
          </div>
        </div>
      </div>

      {abierto && (
        <div className="p-4 bg-white">
          <ul className="space-y-2">
            {pedido.detalle_pedidos.map((d) => (
              <li
                key={d.id}
                className="flex justify-between text-sm border-b border-slate-50 last:border-0 pb-1 last:pb-0"
              >
                <span className="text-slate-700">{d.producto_nombre}</span>
                <span className="font-bold text-slate-900">
                  {d.cantidad_solicitada}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function Dashboard() {
  const [productos, setProductos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Orden
  const [filtroCategoria, setFiltroCategoria] = useState("materia_prima");
  const [vistaPedido, setVistaPedido] = useState("nuevo");
  const [orden, setOrden] = useState("creacion");

  // UI States
  const [mostrarModal, setMostrarModal] = useState(false);

  // Logic States
  const [cantidadesPedido, setCantidadesPedido] = useState({});
  const [cantidadPaso, setCantidadPaso] = useState(1);
  const [modoManual, setModoManual] = useState(false);
  const [valorManual, setValorManual] = useState(0);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      categoria: "materia_prima",
      unidad: "unidad",
      stock_inicial: "",
      stock_min: "",
    },
  });
  const categoriaForm = watch("categoria");

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (filtroCategoria === "pedido" && vistaPedido === "historial") {
      cargarHistorial();
    }
  }, [filtroCategoria, vistaPedido]);

  // --- CARGA DE DATOS ---
  async function cargarProductos() {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      setProductos(data);
    } catch {
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  async function cargarHistorial() {
    const { data } = await supabase
      .from("pedidos")
      .select(`*, detalle_pedidos (*)`)
      .order("created_at", { ascending: false });
    setHistorial(data || []);
  }

  // --- CRUD PRODUCTOS ---
  const onSubmit = async (data) => {
    const { error } = await supabase.from("productos").insert([
      {
        nombre: data.nombre,
        cantidad: parseFloat(data.stock_inicial || 0),
        stock_min: parseFloat(data.stock_min || 0),
        categoria: data.categoria,
        unidad: data.unidad,
        fecha_produccion: data.fecha_produccion || null,
      },
    ]);

    if (error) {
      toast.error("Error al guardar");
    } else {
      toast.success("¡Producto creado!");
      reset();
      setMostrarModal(false);
      cargarProductos();
    }
  };

  async function actualizarStock(producto, operacion) {
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

    setProductos((prev) =>
      prev.map((p) => (p.id === producto.id ? { ...p, cantidad: nueva } : p))
    );
    await supabase
      .from("productos")
      .update({ cantidad: nueva })
      .eq("id", producto.id);
  }

  async function borrarProducto(id) {
    if (!confirm("¿Eliminar producto?")) return;
    await supabase.from("productos").delete().eq("id", id);
    toast.success("Eliminado");
    cargarProductos();
  }

  // --- LOGICA PEDIDOS ---
  async function borrarPedido(id) {
    if (!confirm("¿Eliminar este pedido del historial?")) return;
    const { error } = await supabase.from("pedidos").delete().eq("id", id);

    if (error) {
      toast.error("Error al eliminar pedido");
    } else {
      toast.success("Pedido eliminado");
      cargarHistorial(); // Refrescamos la lista localmente
    }
  }

  const guardarYCopiarPedido = async () => {
    const itemsAEnviar = productosProcesados.filter((p) => {
      const val = cantidadesPedido[p.id];
      return val && val.trim() !== "" && parseFloat(val) > 0;
    });

    if (itemsAEnviar.length === 0)
      return toast.error("Ingresa cantidades válidas");

    const toastId = toast.loading("Procesando pedido...");
    try {
      // Buscar pedido de hoy para fusionar
      const hoyStart = new Date();
      hoyStart.setHours(0, 0, 0, 0);
      const hoyEnd = new Date();
      hoyEnd.setHours(23, 59, 59, 999);

      const { data: pedidosHoy } = await supabase
        .from("pedidos")
        .select("id, created_at, detalle_pedidos(*)")
        .gte("created_at", hoyStart.toISOString())
        .lte("created_at", hoyEnd.toISOString());

      let pedidoId;
      let pedidoExistente =
        pedidosHoy && pedidosHoy.length > 0 ? pedidosHoy[0] : null;

      if (pedidoExistente) {
        pedidoId = pedidoExistente.id;
        for (const item of itemsAEnviar) {
          const cantidadNueva = parseFloat(cantidadesPedido[item.id]);
          const unidad = item.unidad === "kg" ? "kg" : "un";
          const detalleExistente = pedidoExistente.detalle_pedidos.find(
            (d) => d.producto_nombre === item.nombre
          );

          if (detalleExistente) {
            const cantidadAnterior = parseFloat(
              detalleExistente.cantidad_solicitada
            );
            const nuevaSuma = cantidadAnterior + cantidadNueva;
            await supabase
              .from("detalle_pedidos")
              .update({ cantidad_solicitada: `${nuevaSuma} ${unidad}` })
              .eq("id", detalleExistente.id);
          } else {
            await supabase
              .from("detalle_pedidos")
              .insert({
                pedido_id: pedidoId,
                producto_nombre: item.nombre,
                cantidad_solicitada: `${cantidadNueva} ${unidad}`,
              });
          }
        }
      } else {
        const { data: nuevoPedido } = await supabase
          .from("pedidos")
          .insert({})
          .select()
          .single();
        pedidoId = nuevoPedido.id;
        const detalles = itemsAEnviar.map((p) => ({
          pedido_id: pedidoId,
          producto_nombre: p.nombre,
          cantidad_solicitada: `${cantidadesPedido[p.id]} ${
            p.unidad === "kg" ? "kg" : "un"
          }`,
        }));
        await supabase.from("detalle_pedidos").insert(detalles);
      }

      // Generar mensaje final consolidado
      const { data: pedidoFinal } = await supabase
        .from("pedidos")
        .select("*, detalle_pedidos(*)")
        .eq("id", pedidoId)
        .single();
      let msg = `📋 *PEDIDO COCINA SILVESTRE* (${formatearFecha(
        new Date()
      )})\n\n`;
      pedidoFinal.detalle_pedidos.forEach((d) => {
        msg += `- ${d.producto_nombre}: *${d.cantidad_solicitada}*\n`;
      });

      navigator.clipboard.writeText(msg);
      setCantidadesPedido({});
      toast.success(
        pedidoExistente ? "¡Actualizado y copiado!" : "¡Creado y copiado!",
        { id: toastId }
      );
    } catch (error) {
      console.error(error);
      toast.error("Error procesando", { id: toastId });
    }
  };

  // --- FILTROS Y PROCESAMIENTO ---
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

  const presets = [
    { label: "1", val: 1, desc: "Un / Kg" },
    { label: "0.1", val: 0.1, desc: "100g" },
    { label: "0.5", val: 0.5, desc: "Media" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-48">
      {/* Header Sticky */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Cocina Silvestre</h1>
            <p className="text-xs text-slate-400">Sistema de Stock</p>
          </div>
          <div className="flex gap-3">
            {filtroCategoria !== "pedido" && (
              <button
                onClick={() => setMostrarModal(true)}
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

        {/* BARRA DE FILTROS (Solo stock) */}
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
                <LucideAlertCircle size={12} /> Prioridad
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
                onClick={guardarYCopiarPedido}
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
                              onClick={() => actualizarStock(prod, "restar")}
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
                              onClick={() => actualizarStock(prod, "sumar")}
                              className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-900 rounded-xl text-white shadow-sm active:scale-95 hover:bg-slate-800"
                            >
                              <LucidePlus size={20} />
                            </button>
                            <button
                              onClick={() => borrarProducto(prod.id)}
                              className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500"
                            >
                              <LucideTrash2 size={16} />
                            </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <LucidePlus size={20} /> Nuevo Producto
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <LucideX />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Nombre
                </label>
                <input
                  {...register("nombre", { required: true })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                  placeholder="Ej: Harina 000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Categoría
                  </label>
                  <select
                    {...register("categoria")}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="materia_prima">Materia Prima</option>
                    <option value="produccion">Producción</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Medida
                  </label>
                  <select
                    {...register("unidad")}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("stock_inicial")}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register("stock_min")}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    placeholder="Ej: 5"
                  />
                </div>
              </div>
              {categoriaForm === "produccion" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Fecha Elaboración
                  </label>
                  <input
                    type="date"
                    {...register("fecha_produccion")}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50"
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg transform transition-transform active:scale-95"
              >
                Guardar Producto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOTONERA */}
      {filtroCategoria !== "pedido" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1">
            {presets.map((preset) => (
              <button
                key={preset.val}
                onClick={() => {
                  setCantidadPaso(preset.val);
                  setModoManual(false);
                }}
                className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg flex flex-col items-center justify-center transition-all border ${
                  !modoManual && cantidadPaso === preset.val
                    ? "bg-slate-900 text-white border-slate-900 shadow-md -translate-y-1"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="text-lg font-bold">{preset.label}</span>
                <span
                  className={`text-[10px] uppercase ${
                    !modoManual && cantidadPaso === preset.val
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {preset.desc}
                </span>
              </button>
            ))}
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
      )}
    </div>
  );
}
