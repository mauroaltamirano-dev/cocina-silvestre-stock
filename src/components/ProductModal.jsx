import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  LucidePlus,
  LucideX,
  LucidePencil,
  LucideAlertTriangle,
  LucideLink,
} from "lucide-react";
import { useStockStore } from "../store/useStockStore";

export default function ProductModal({
  onClose,
  productoAEditar,
  defaultCategory,
  onCreated,
}) {
  const { productos, agregarProducto, editarProducto } = useStockStore();
  const [usaPadre, setUsaPadre] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      categoria: defaultCategory || "materia_prima",
      unidad: "unidad",
      stock_inicial: "0",
      stock_min: "0",
      nombre: "",
      apto_receta: true, // Por defecto true
      stock_padre_id: "",
      factor_conversion: "",
    },
  });

  const categoriaForm = watch("categoria");
  const aptoReceta = watch("apto_receta");
  const esReceta = categoriaForm === "receta";

  // Filtramos posibles padres
  const posiblesPadres = productos.filter(
    (p) =>
      p.id !== productoAEditar?.id &&
      (p.categoria === "materia_prima" ||
        p.categoria === "verduras" ||
        p.categoria === "objetos")
  );

  // Watch para ver qué padre seleccionó y determinar si es Unidad o Peso
  const padreSeleccionadoId = watch("stock_padre_id");
  const padreSeleccionado = productos.find((p) => p.id == padreSeleccionadoId);
  const unidadPadre = padreSeleccionado?.unidad || "unidad";
  // Si la unidad es 'kg' o 'l', asumimos división. Si es 'unidad', asumimos multiplicación.
  const esPadrePorContenido = unidadPadre === "unidad";

  useEffect(() => {
    if (productoAEditar) {
      reset({
        nombre: productoAEditar.nombre,
        categoria: productoAEditar.categoria,
        unidad: productoAEditar.unidad,
        stock_inicial: productoAEditar.cantidad,
        stock_min: productoAEditar.stock_min,
        fecha_produccion: productoAEditar.fecha_produccion,
        apto_receta: productoAEditar.apto_receta,
        stock_padre_id: productoAEditar.stock_padre_id || "",
        factor_conversion: productoAEditar.factor_conversion || "",
      });
      if (productoAEditar.stock_padre_id) setUsaPadre(true);
    } else if (defaultCategory) {
      reset({ categoria: defaultCategory, apto_receta: true });
    }
  }, [productoAEditar, defaultCategory, reset]);

  const onSubmit = async (data) => {
    const datosFormateados = {
      nombre: data.nombre,
      stock_min: parseFloat(data.stock_min || 0),
      categoria: data.categoria,
      unidad: data.unidad,
      fecha_produccion: data.fecha_produccion || null,
      apto_receta: data.apto_receta,
      cantidad: usaPadre ? 0 : parseFloat(data.stock_inicial || 0),
      stock_padre_id:
        usaPadre && data.stock_padre_id ? parseInt(data.stock_padre_id) : null,
      factor_conversion:
        usaPadre && data.factor_conversion
          ? parseFloat(data.factor_conversion)
          : null,
    };

    let nuevoProducto = null;
    let exito = false;

    if (productoAEditar) {
      exito = await editarProducto(productoAEditar.id, datosFormateados);
    } else {
      nuevoProducto = await agregarProducto(datosFormateados);
      exito = !!nuevoProducto;
    }

    if (exito) {
      reset();
      onClose();
      if (onCreated && nuevoProducto) onCreated(nuevoProducto);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            {productoAEditar ? (
              <LucidePencil size={20} />
            ) : (
              <LucidePlus size={20} />
            )}
            {productoAEditar ? "Editar" : "Nuevo"}
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
              placeholder="Ej: Huevo (Unidad)"
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
                <option value="verduras">Verduras</option>
                <option value="produccion">Producción (Intermedia)</option>
                <option value="receta">Receta (Plato Final)</option>
                <option value="objetos">Objetos</option>
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
                <option value="l">Litro</option>
              </select>
            </div>
          </div>

          {!esReceta && categoriaForm !== "objetos" && (
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <input
                type="checkbox"
                id="apto_receta"
                {...register("apto_receta")}
                className="w-4 h-4 accent-slate-900"
              />
              <label
                htmlFor="apto_receta"
                className="text-sm text-slate-700 font-medium select-none"
              >
                ¿Aparece en lista de ingredientes?
              </label>
            </div>
          )}

          {aptoReceta && !esReceta && categoriaForm !== "objetos" && (
            <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="usa_padre"
                  checked={usaPadre}
                  onChange={(e) => setUsaPadre(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label
                  htmlFor="usa_padre"
                  className="text-sm font-bold text-indigo-900 flex items-center gap-1 select-none"
                >
                  <LucideLink size={14} /> Asociar a Stock Padre
                </label>
              </div>

              {usaPadre && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] text-indigo-700 leading-tight">
                    El stock de este producto se calcula en tiempo real basado
                    en el Padre. Ideal para packs (Ej: Huevos/Maple). <br />
                    <b>No usar para producción (Carne -> Medallón).</b>
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-1">
                      Producto Padre (Stock Real)
                    </label>
                    <select
                      {...register("stock_padre_id", { required: usaPadre })}
                      className="w-full border border-indigo-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Seleccionar padre...</option>
                      {posiblesPadres.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} (Stock: {p.cantidad} {p.unidad})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-800 uppercase mb-1">
                      {esPadrePorContenido
                        ? "Contenido del Padre"
                        : "Consumo por Unidad"}
                    </label>

                    <div className="flex items-center gap-2">
                      {esPadrePorContenido ? (
                        <>
                          <span className="text-xs text-indigo-600">
                            1 {padreSeleccionado?.nombre || "Padre"} trae
                          </span>
                          <input
                            type="number"
                            step="any"
                            placeholder="30"
                            {...register("factor_conversion", {
                              required: usaPadre,
                            })}
                            className="w-20 border border-indigo-200 rounded-lg px-2 py-1.5 text-sm outline-none text-center font-bold"
                          />
                          <span className="text-xs text-indigo-600">Hijos</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-indigo-600">
                            1 {watch("nombre") || "Hijo"} utiliza
                          </span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.145"
                            {...register("factor_conversion", {
                              required: usaPadre,
                            })}
                            className="w-20 border border-indigo-200 rounded-lg px-2 py-1.5 text-sm outline-none text-center font-bold"
                          />
                          <span className="text-xs text-indigo-600">
                            {unidadPadre} de Padre
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      {esPadrePorContenido
                        ? "Ej: 1 Maple trae 30 Huevos."
                        : "Ej: 1 Medallón usa 0.145 Kg de Carne."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!esReceta && !usaPadre && (
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
          )}

          {usaPadre && (
            <div className="bg-indigo-100 text-indigo-700 p-3 rounded-lg text-xs font-medium text-center">
              🚫 Stock bloqueado: Se calcula desde el Padre.
            </div>
          )}

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
            {productoAEditar ? "Guardar Cambios" : "Crear"}
          </button>
        </form>
      </div>
    </div>
  );
}
