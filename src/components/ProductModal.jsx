import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  LucidePlus,
  LucideX,
  LucidePencil,
  LucideAlertTriangle,
} from "lucide-react";
import { useStockStore } from "../store/useStockStore";

export default function ProductModal({ onClose, productoAEditar }) {
  const { agregarProducto, editarProducto } = useStockStore();

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      categoria: "materia_prima",
      unidad: "unidad",
      stock_inicial: "",
      stock_min: "",
      nombre: "",
    },
  });

  const categoriaForm = watch("categoria");

  // Al abrir, si es edición, rellenamos el formulario
  useEffect(() => {
    if (productoAEditar) {
      reset({
        nombre: productoAEditar.nombre,
        categoria: productoAEditar.categoria,
        unidad: productoAEditar.unidad,
        stock_inicial: productoAEditar.cantidad,
        stock_min: productoAEditar.stock_min,
        fecha_produccion: productoAEditar.fecha_produccion,
      });
    }
  }, [productoAEditar, reset]);

  const onSubmit = async (data) => {
    const datosFormateados = {
      nombre: data.nombre,
      cantidad: parseFloat(data.stock_inicial || 0),
      stock_min: parseFloat(data.stock_min || 0),
      categoria: data.categoria,
      unidad: data.unidad,
      fecha_produccion: data.fecha_produccion || null,
    };

    let exito;
    if (productoAEditar) {
      exito = await editarProducto(productoAEditar.id, datosFormateados);
    } else {
      exito = await agregarProducto(datosFormateados);
    }

    if (exito) {
      reset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {productoAEditar ? (
              <LucidePencil size={20} />
            ) : (
              <LucidePlus size={20} />
            )}
            {productoAEditar ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white transition-all"
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
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
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
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="unidad">Unidad</option>
                <option value="kg">Kilo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Stock Actual
              </label>
              <input
                type="number"
                step="any"
                {...register("stock_inicial")}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-900"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                Stock Mínimo{" "}
                <LucideAlertTriangle size={10} className="text-amber-500" />
              </label>
              <input
                type="number"
                step="any"
                {...register("stock_min")}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-900"
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
            {productoAEditar ? "Guardar Cambios" : "Crear Producto"}
          </button>
        </form>
      </div>
    </div>
  );
}
