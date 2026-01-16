import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  LucideX,
  LucidePlus,
  LucideTrash2,
  LucideChefHat,
  LucideLoader2,
  LucideCalculator,
} from "lucide-react";
import toast from "react-hot-toast";

// IMPORTAMOS AMBOS STORES
import { useStockStore } from "../store/useStockStore";
import { useRecipeStore } from "../store/useRecipeStore";

export default function RecipeModal({ producto, onClose }) {
  const { productos } = useStockStore();
  const {
    ingredientes,
    loadingReceta,
    obtenerReceta,
    agregarIngredienteAReceta,
    eliminarIngredienteDeReceta,
    registrarProduccion,
  } = useRecipeStore();

  const [cantidadProducir, setCantidadProducir] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [insumoLimitante, setInsumoLimitante] = useState(null);
  const [vaciarLimitante, setVaciarLimitante] = useState(false);

  // --- FILTRO DE INSUMOS ---
  const candidatosInsumo = productos.filter(
    (p) =>
      p.id !== producto.id &&
      (p.categoria === "materia_prima" ||
        p.categoria === "verduras" ||
        p.categoria === "produccion") &&
      p.apto_receta === true
  );

  const { register, handleSubmit, reset } = useForm();

  const cargarDatos = async () => {
    await obtenerReceta(producto.id);
  };

  useEffect(() => {
    cargarDatos();
  }, [producto]);

  // --- CORRECCIÓN: ELIMINAMOS EL USEEFFECT CONFLICTIVO ---
  // Antes había un useEffect aquí que reseteaba todo al cambiar la cantidad.
  // Lo borramos para que no choque con "Calc. Máx".

  const onAddIngredient = async (data) => {
    if (!data.insumo_id || !data.cantidad) return;
    setAgregando(true);
    const exito = await agregarIngredienteAReceta(
      producto.id,
      data.insumo_id,
      data.cantidad
    );
    if (exito) {
      reset({ insumo_id: "", cantidad: "" });
    }
    setAgregando(false);
  };

  const onDeleteIngredient = async (id) => {
    await eliminarIngredienteDeReceta(id, producto.id);
  };

  const handleProducir = async () => {
    if (!cantidadProducir || parseFloat(cantidadProducir) <= 0)
      return toast.error("Ingresa una cantidad");
    const idParaVaciar =
      vaciarLimitante && insumoLimitante ? insumoLimitante.id : null;
    await registrarProduccion(producto, cantidadProducir, idParaVaciar);
    onClose();
  };

  const calcularMaximo = () => {
    if (ingredientes.length === 0)
      return toast.error("No hay ingredientes configurados");

    let maximoPosible = Infinity;
    let limitanteEncontrado = null;

    ingredientes.forEach((item) => {
      const insumoReal = productos.find((p) => p.id === item.insumo.id);

      if (insumoReal) {
        let posible = 0;
        const consumoPorUnidad = parseFloat(item.cantidad_necesaria);

        if (consumoPorUnidad > 0) {
          posible = insumoReal.cantidad / consumoPorUnidad;
        }

        if (posible < maximoPosible) {
          maximoPosible = posible;
          limitanteEncontrado = insumoReal;
        }
      }
    });

    if (maximoPosible === Infinity) return;

    const cantidadEntera = Math.floor(maximoPosible);
    setCantidadProducir(cantidadEntera);

    if (limitanteEncontrado) {
      setInsumoLimitante(limitanteEncontrado);
      setVaciarLimitante(true);
      toast.success(`Limitado por: ${limitanteEncontrado.nombre}`);
    }
  };

  // --- HANDLER PARA INPUT MANUAL ---
  // Movemos la lógica de limpieza aquí
  const handleManualChange = (e) => {
    setCantidadProducir(e.target.value);
    // Si el usuario escribe a mano, quitamos la sugerencia automática de vaciar
    if (insumoLimitante) {
      setInsumoLimitante(null);
      setVaciarLimitante(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Compacto */}
        <div className="bg-slate-900 p-3 sm:p-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
              <LucideChefHat size={20} />{" "}
              {producto.categoria === "receta"
                ? "Vender Plato"
                : "Producir Stock"}
            </h3>
            <p className="text-slate-400 text-[10px] sm:text-xs text-white/70 truncate max-w-[200px]">
              {producto.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <LucideX size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* SECCIÓN PRODUCIR / VENDER */}
          <div className="bg-emerald-50 border border-emerald-100 p-3 sm:p-4 rounded-xl mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-emerald-800 font-bold text-xs sm:text-sm uppercase">
                {producto.categoria === "receta"
                  ? "🍽️ Registrar Venta"
                  : "🍳 Registrar Producción"}
              </h4>
              <button
                onClick={calcularMaximo}
                className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1.5 rounded border border-emerald-200 hover:bg-emerald-200 flex items-center gap-1 transition-colors active:scale-95"
                title="Calcular cuánto puedo hacer con mi stock actual"
              >
                <LucideCalculator size={12} /> Calc. Máx
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Cant..."
                className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-900 text-lg w-full min-w-0"
                value={cantidadProducir}
                onChange={handleManualChange} // <--- USAMOS EL NUEVO HANDLER
              />
              <button
                onClick={handleProducir}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md active:scale-95 text-sm sm:text-base whitespace-nowrap"
              >
                Confirmar
              </button>
            </div>

            {insumoLimitante && (
              <div className="mt-3 bg-white/50 border border-emerald-200 p-2 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <input
                  type="checkbox"
                  id="vaciarLimitante"
                  checked={vaciarLimitante}
                  onChange={(e) => setVaciarLimitante(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="vaciarLimitante"
                  className="text-xs text-emerald-800 cursor-pointer select-none leading-tight"
                >
                  <span className="font-bold">
                    Vaciar stock de {insumoLimitante.nombre}
                  </span>{" "}
                  <br />
                  <span className="text-[10px] opacity-80">
                    Ajusta el sobrante (merma) a 0.
                  </span>
                </label>
              </div>
            )}

            {!insumoLimitante && (
              <p className="text-[10px] text-emerald-600 mt-2 leading-tight">
                {producto.categoria === "receta"
                  ? "* Descuenta ingredientes del stock."
                  : "* Aumenta este producto y resta ingredientes."}
              </p>
            )}
          </div>

          <hr className="border-slate-100 my-4" />

          {/* SECCIÓN CONFIGURACIÓN */}
          <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
              📝 Ingredientes{" "}
              <span className="text-xs font-normal text-slate-400">
                (Por 1 unidad)
              </span>
            </h4>

            {/* FORMULARIO RESPONSIVE: Stack en móvil, Row en Desktop */}
            <form
              onSubmit={handleSubmit(onAddIngredient)}
              className="flex flex-col sm:flex-row gap-2 mb-4"
            >
              <select
                id="select-insumo"
                {...register("insumo_id", { required: true })}
                className="w-full sm:flex-1 border border-slate-300 rounded-lg px-2 py-2.5 sm:py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="">Seleccionar insumo...</option>
                {candidatosInsumo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.unidad}){" "}
                    {p.categoria === "produccion" ? "(Prod)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  step="any"
                  placeholder="Cant."
                  {...register("cantidad", { required: true })}
                  className="flex-1 sm:w-20 border border-slate-300 rounded-lg px-3 py-2.5 sm:py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
                <button
                  type="submit"
                  disabled={agregando}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center min-w-[3rem]"
                >
                  {agregando ? (
                    <LucideLoader2 className="animate-spin" size={18} />
                  ) : (
                    <LucidePlus size={20} />
                  )}
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {loadingReceta ? (
                <p className="text-center text-xs text-slate-400">
                  Cargando...
                </p>
              ) : ingredientes.length === 0 ? (
                <p className="text-center text-xs text-slate-400 italic py-2">
                  Sin ingredientes.
                </p>
              ) : (
                ingredientes.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-sm shadow-sm"
                  >
                    <div className="pr-2">
                      <span className="font-bold text-slate-700 block sm:inline">
                        {item.insumo.nombre}
                      </span>
                      <span className="text-xs text-slate-400 ml-0 sm:ml-1">
                        ({item.insumo.unidad})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {item.cantidad_necesaria}
                      </span>
                      <button
                        onClick={() => onDeleteIngredient(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <LucideTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
