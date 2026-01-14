import { useState } from "react";
import {
  LucideCalendar,
  LucideChevronDown,
  LucideTrash2,
  LucideCopy,
} from "lucide-react";
import toast from "react-hot-toast";

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

  const copiarEstePedido = (e) => {
    e.stopPropagation();
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
    e.stopPropagation();
    onEliminar(pedido.id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-sm transition-all animate-in fade-in">
      <div
        onClick={() => setAbierto(!abierto)}
        className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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
}
