import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useStockStore } from "./useStockStore"; // Importamos para comunicar cambios

export const useRecipeStore = create((set, get) => ({
  ingredientes: [],
  loadingReceta: false,

  // Obtener ingredientes de un producto específico
  obtenerReceta: async (productoId) => {
    set({ loadingReceta: true });
    try {
      const { data, error } = await supabase
        .from("recetas")
        .select(
          `
          id,
          cantidad_necesaria,
          insumo:insumo_id ( id, nombre, unidad, cantidad )
        `
        )
        .eq("producto_padre_id", productoId);

      if (error) throw error;
      set({ ingredientes: data || [] });
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      set({ loadingReceta: false });
    }
  },

  // Vincular un insumo a un producto
  agregarIngredienteAReceta: async (padreId, insumoId, cantidad) => {
    const { error } = await supabase.from("recetas").insert({
      producto_padre_id: padreId,
      insumo_id: insumoId,
      cantidad_necesaria: parseFloat(cantidad),
    });

    if (error) {
      toast.error("Error al guardar ingrediente");
      return false;
    }
    toast.success("Ingrediente agregado");
    // Recargamos la lista interna
    get().obtenerReceta(padreId);
    return true;
  },

  eliminarIngredienteDeReceta: async (idReceta, padreId) => {
    const { error } = await supabase
      .from("recetas")
      .delete()
      .eq("id", idReceta);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success("Ingrediente quitado");
      get().obtenerReceta(padreId);
    }
  },

  // ¡LA FUNCIÓN DE PRODUCCIÓN!
  registrarProduccion: async (
    productoPadre,
    cantidadProducida,
    insumoAVaciarId = null
  ) => {
    const toastId = toast.loading("Procesando...");
    try {
      const cantidad = parseFloat(cantidadProducida);
      if (cantidad <= 0) throw new Error("Inválido");

      const { data: receta } = await supabase
        .from("recetas")
        .select(
          `cantidad_necesaria, insumo:insumo_id ( id, nombre, stock_padre_id, factor_conversion )`
        )
        .eq("producto_padre_id", productoPadre.id);

      const actualizaciones = [];
      const stockStore = useStockStore.getState();

      // A) Sumar al producto final
      const nuevoStockPadre = parseFloat(
        (productoPadre.cantidad + cantidad).toFixed(3)
      );
      actualizaciones.push(
        supabase
          .from("productos")
          .update({ cantidad: nuevoStockPadre })
          .eq("id", productoPadre.id)
      );

      // B) Restar insumos
      for (const item of receta) {
        // ¿Este es el insumo que el usuario pidió vaciar?
        const debeVaciar = insumoAVaciarId === item.insumo.id;

        const consumoTotalHijo = item.cantidad_necesaria * cantidad;

        if (item.insumo.stock_padre_id && item.insumo.factor_conversion) {
          // ES UN DERIVADO (Ej: Huevo -> Maple)
          const padreReal = stockStore.productos.find(
            (p) => p.id === item.insumo.stock_padre_id
          );

          if (padreReal) {
            const esContenido = padreReal.unidad === "unidad";
            let consumoPadre = 0;

            if (esContenido) {
              consumoPadre = consumoTotalHijo / item.insumo.factor_conversion;
            } else {
              consumoPadre = consumoTotalHijo * item.insumo.factor_conversion;
            }

            // SI DEBE VACIAR, PONEMOS 0. SI NO, CALCULAMOS RESTA.
            const nuevoStock = debeVaciar
              ? 0
              : parseFloat((padreReal.cantidad - consumoPadre).toFixed(4));

            // Protección: No permitir negativos si no se vacía
            const stockFinal = nuevoStock < 0 ? 0 : nuevoStock;

            actualizaciones.push(
              supabase
                .from("productos")
                .update({ cantidad: stockFinal })
                .eq("id", padreReal.id)
            );
          }
        } else {
          // ES UN PRODUCTO NORMAL (Ej: Carne Molida)
          const prodActual = stockStore.productos.find(
            (p) => p.id === item.insumo.id
          );
          if (prodActual) {
            // SI DEBE VACIAR, PONEMOS 0. SI NO, CALCULAMOS RESTA.
            const nuevoStock = debeVaciar
              ? 0
              : parseFloat((prodActual.cantidad - consumoTotalHijo).toFixed(3));

            const stockFinal = nuevoStock < 0 ? 0 : nuevoStock;

            actualizaciones.push(
              supabase
                .from("productos")
                .update({ cantidad: stockFinal })
                .eq("id", item.insumo.id)
            );
          }
        }
      }

      await Promise.all(actualizaciones);
      toast.success("Hecho", { id: toastId });
      stockStore.cargarProductos();
    } catch (error) {
      console.error(error);
      toast.error("Error", { id: toastId });
    }
  },
}));
