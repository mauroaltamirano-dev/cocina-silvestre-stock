import { useState } from "react";
import {
  LucideCalendar,
  LucideChevronDown,
  LucideTrash2,
  LucideCopy,
  LucideCheckCircle,
  LucideTruck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useStockStore } from "../store/useStockStore";

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fechaISO));
};

export default function HistorialItem({ pedido, onEliminar }) {
  const [abierto, setAbierto] = useState(false);
  const [modoRecepcion, setModoRecepcion] = useState(false);
  const [seleccionados, setSeleccionados] = useState({}); // { id_detalle: true/false }

  const { confirmarRecepcion } = useStockStore();

  // Filtrar solo los no recibidos para mostrar en la lista activa
  const itemsActivos = pedido.detalle_pedidos.filter((d) => !d.recibido);
  const itemsYaRecibidos = pedido.detalle_pedidos.filter((d) => d.recibido);
  const estaCompletamenteCerrado = itemsActivos.length === 0;

  const toggleSeleccion = (id) => {
    setSeleccionados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmarRecepcion = async () => {
    const idsRecibidos = Object.keys(seleccionados)
      .filter((id) => seleccionados[id])
      .map((id) => parseInt(id));

    if (
      idsRecibidos.length === 0 &&
      !confirm("No marcaste nada. ¿Todo pasará al pedido de mañana?")
    )
      return;

    await confirmarRecepcion(pedido.id, idsRecibidos, itemsActivos);
    setModoRecepcion(false);
    setSeleccionados({});
  };

  const copiarEstePedido = (e) => {
    e.stopPropagation();
    let msg = `📋 *PEDIDO COCINA SILVESTRE* (${formatearFecha(
      pedido.created_at
    )})\n\n`;
    itemsActivos.forEach((d) => {
      msg += `- ${d.producto_nombre}: *${d.cantidad_solicitada}*\n`;
    });
    navigator.clipboard.writeText(msg);
    toast.success("Copiado al portapapeles");
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onEliminar(pedido.id);
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden mb-3 shadow-sm transition-all animate-in fade-in ${
        estaCompletamenteCerrado
          ? "bg-slate-100 border-slate-200 opacity-70"
          : "bg-white border-slate-200"
      }`}
    >
      {/* HEADER TARJETA */}
      <div
        onClick={() => setAbierto(!abierto)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
          >
            <LucideTrash2 size={18} />
          </button>

          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              estaCompletamenteCerrado
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {estaCompletamenteCerrado ? (
              <LucideCheckCircle size={20} />
            ) : (
              <LucideCalendar size={20} />
            )}
          </div>

          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate">
              Pedido del {formatearFecha(pedido.created_at)}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {estaCompletamenteCerrado
                ? "Completado"
                : `${itemsActivos.length} pendientes`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">
          {!estaCompletamenteCerrado && (
            <button
              onClick={copiarEstePedido}
              className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-emerald-50"
            >
              <LucideCopy size={18} />
            </button>
          )}
          <div
            className={`p-2 text-slate-400 transition-transform duration-300 ${
              abierto ? "rotate-180" : ""
            }`}
          >
            <LucideChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* CONTENIDO DESPLEGABLE */}
      {abierto && (
        <div className="p-4 bg-white border-t border-slate-100">
          {/* MODO VISUALIZACIÓN */}
          {!modoRecepcion && !estaCompletamenteCerrado && (
            <button
              onClick={() => setModoRecepcion(true)}
              className="w-full mb-4 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <LucideTruck size={16} /> Recibir Mercadería
            </button>
          )}

          {/* LISTA DE ITEMS */}
          <ul className="space-y-2">
            {itemsActivos.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  {modoRecepcion && (
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                      checked={!!seleccionados[d.id]}
                      onChange={() => toggleSeleccion(d.id)}
                    />
                  )}
                  <span
                    className={`${
                      modoRecepcion && seleccionados[d.id]
                        ? "text-emerald-700 font-medium"
                        : "text-slate-700"
                    }`}
                  >
                    {d.producto_nombre}
                  </span>
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                  {d.cantidad_solicitada}
                </span>
              </li>
            ))}

            {/* ITEMS YA CERRADOS (Histórico visual) */}
            {itemsYaRecibidos.length > 0 && (
              <div className="mt-4 pt-2 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                  Historial de este pedido
                </p>
                {itemsYaRecibidos.map((d) => {
                  const noLlego = d.estado === "no_entregado";

                  return (
                    <li
                      key={d.id}
                      className="flex justify-between text-xs mb-1"
                    >
                      <span
                        className={`${
                          noLlego
                            ? "text-red-400 line-through decoration-red-300"
                            : "text-slate-400 line-through"
                        }`}
                      >
                        {d.producto_nombre}
                        {noLlego && (
                          <span className="no-underline ml-1 font-bold text-[9px] text-red-500 bg-red-50 px-1 rounded">
                            (No entregado)
                          </span>
                        )}
                      </span>
                      <span
                        className={`${
                          noLlego
                            ? "text-red-300 line-through"
                            : "text-slate-400 line-through"
                        }`}
                      >
                        {d.cantidad_solicitada}
                      </span>
                    </li>
                  );
                })}
              </div>
            )}
          </ul>

          {/* BOTONES CONFIRMACIÓN */}
          {modoRecepcion && (
            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModoRecepcion(false)}
                className="flex-1 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRecepcion}
                className="flex-1 py-2 text-sm bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
              >
                Confirmar Recepción
              </button>
            </div>
          )}

          {modoRecepcion && (
            <p className="text-[10px] text-center text-slate-400 mt-2">
              * Lo no seleccionado se moverá a un nuevo pedido para mañana.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
