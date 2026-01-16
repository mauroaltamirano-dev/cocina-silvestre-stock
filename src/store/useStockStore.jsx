import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

// Helper Fecha
const getFechaHoyISO = () => {
  const hoyStart = new Date();
  hoyStart.setHours(0, 0, 0, 0);
  const hoyEnd = new Date();
  hoyEnd.setHours(23, 59, 59, 999);
  return { start: hoyStart.toISOString(), end: hoyEnd.toISOString() };
};

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fechaISO));
};

export const useStockStore = create((set, get) => ({
  productos: [],
  historial: [],
  pendientes: {},
  loading: true,

  // Almacén de temporizadores para el debounce
  writeTimeouts: {},

  // --- CARGAR PRODUCTOS (Con Lógica Híbrida) ---
  cargarProductos: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Mapa para acceso rápido
      const productosMap = new Map(data.map((p) => [p.id, p]));

      const productosProcesados = data.map((prod) => {
        // Si tiene un padre configurado
        if (prod.stock_padre_id && prod.factor_conversion) {
          const padre = productosMap.get(prod.stock_padre_id);
          if (padre) {
            // --- LÓGICA HÍBRIDA DE LECTURA ---
            const esContenido = padre.unidad === "unidad";
            let cantidadCalculada = 0;

            if (esContenido) {
              // Lógica Multiplicación (Ej: Huevos)
              cantidadCalculada = padre.cantidad * prod.factor_conversion;
            } else {
              // Lógica División (Ej: Medallones)
              cantidadCalculada =
                prod.factor_conversion > 0
                  ? padre.cantidad / prod.factor_conversion
                  : 0;
            }

            return {
              ...prod,
              cantidad: parseFloat(cantidadCalculada.toFixed(2)),
            };
          }
        }
        return prod;
      });

      set({ productos: productosProcesados });
      get().calcularPendientes();
    } catch (error) {
      console.error(error);
      toast.error("Error cargando productos");
    } finally {
      set({ loading: false });
    }
  },

  // --- CRUD BÁSICO ---
  agregarProducto: async (nuevoProducto) => {
    const { data, error } = await supabase
      .from("productos")
      .insert([nuevoProducto])
      .select()
      .single();
    if (error) {
      toast.error("Error al guardar");
      return null;
    }
    toast.success("¡Producto creado!");
    get().cargarProductos();
    return data;
  },

  editarProducto: async (id, datosActualizados) => {
    const { error } = await supabase
      .from("productos")
      .update(datosActualizados)
      .eq("id", id);
    if (error) {
      toast.error("Error al actualizar");
      return false;
    }
    toast.success("Producto actualizado");
    get().cargarProductos();
    return true;
  },

  borrarProducto: async (id) => {
    if (!confirm("¿Eliminar producto definitivamente?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success("Eliminado");
      get().cargarProductos();
    }
  },

  // --- LÓGICA DE STOCK EN TIEMPO REAL (DEBOUNCE) ---

  // 1. Esta función se llama desde los botones (+ / -)
  sumarStock: (id, cantidadASumar) => {
    const productos = get().productos;
    const prod = productos.find((p) => p.id === id);
    if (!prod) return;

    const nuevoTotal = parseFloat((prod.cantidad + cantidadASumar).toFixed(3));
    get().actualizarStockCantidad(id, nuevoTotal);
  },

  // 2. Esta función actualiza UI instantáneamente y espera para guardar en DB
  actualizarStockCantidad: async (id, nuevaCantidad) => {
    const productosActuales = get().productos;
    const prod = productosActuales.find((p) => p.id === id);

    // 🛑 CASO A: Es un HIJO
    if (prod && prod.stock_padre_id && prod.factor_conversion) {
      const padre = productosActuales.find((p) => p.id === prod.stock_padre_id);

      if (padre) {
        const esContenido = padre.unidad === "unidad";
        let nuevoStockPadre = 0;

        if (esContenido) {
          nuevoStockPadre = nuevaCantidad / prod.factor_conversion;
        } else {
          nuevoStockPadre = nuevaCantidad * prod.factor_conversion;
        }

        return get().actualizarStockCantidad(
          prod.stock_padre_id,
          parseFloat(nuevoStockPadre.toFixed(4))
        );
      }
    }

    // 🟢 CASO B: Es un PRODUCTO NORMAL o PADRE
    const nuevosProductos = productosActuales.map((p) => {
      if (p.id === id) return { ...p, cantidad: nuevaCantidad };

      // Si es un HIJO de este producto, RECALCULAMOS su stock visualmente
      if (p.stock_padre_id === id && p.factor_conversion) {
        const padreUnidad = prod.unidad === "unidad";
        let cantidadHijo = 0;

        if (padreUnidad) {
          cantidadHijo = nuevaCantidad * p.factor_conversion;
        } else {
          cantidadHijo =
            p.factor_conversion > 0 ? nuevaCantidad / p.factor_conversion : 0;
        }
        return { ...p, cantidad: parseFloat(cantidadHijo.toFixed(2)) };
      }
      return p;
    });

    set({ productos: nuevosProductos });

    const timeouts = get().writeTimeouts;
    if (timeouts[id]) clearTimeout(timeouts[id]);

    const nuevoTimeout = setTimeout(async () => {
      const { error } = await supabase
        .from("productos")
        .update({ cantidad: nuevaCantidad })
        .eq("id", id);
      if (error) {
        toast.error("Error guardando");
        get().cargarProductos();
      }
      const currentTs = get().writeTimeouts;
      const { [id]: _, ...rest } = currentTs;
      set({ writeTimeouts: rest });
    }, 500);

    set({ writeTimeouts: { ...timeouts, [id]: nuevoTimeout } });
  },

  // --- PEDIDOS E HISTORIAL ---
  cargarHistorial: async () => {
    const { data } = await supabase
      .from("pedidos")
      .select(`*, detalle_pedidos (*)`)
      .order("created_at", { ascending: false });
    set({ historial: data || [] });
  },

  borrarPedido: async (id) => {
    if (
      !confirm(
        "¿Eliminar este pedido del historial? \n⚠️ Si el pedido fue entregado, se descontará del stock."
      )
    )
      return;
    const toastId = toast.loading("Eliminando...");
    try {
      const { data: pedidoData } = await supabase
        .from("pedidos")
        .select(`*, detalle_pedidos (*)`)
        .eq("id", id)
        .single();
      const actualizacionesDeStock = [];
      for (const item of pedidoData.detalle_pedidos) {
        if (item.estado === "entregado") {
          const cantidadARestar = parseFloat(item.cantidad_solicitada);
          const productoEnStock = get().productos.find(
            (p) => p.nombre === item.producto_nombre
          );
          if (productoEnStock) {
            const nuevoStock = parseFloat(
              (productoEnStock.cantidad - cantidadARestar).toFixed(3)
            );
            actualizacionesDeStock.push(
              supabase
                .from("productos")
                .update({ cantidad: nuevoStock })
                .eq("id", productoEnStock.id)
            );
          }
        }
      }
      if (actualizacionesDeStock.length > 0)
        await Promise.all(actualizacionesDeStock);
      await supabase.from("pedidos").delete().eq("id", id);
      toast.success("Pedido eliminado", { id: toastId });
      get().cargarHistorial();
      get().cargarProductos();
      get().calcularPendientes();
    } catch (e) {
      toast.error("Error", { id: toastId });
    }
  },

  calcularPendientes: async () => {
    const { data } = await supabase
      .from("detalle_pedidos")
      .select("producto_nombre, cantidad_solicitada")
      .eq("recibido", false);
    const mapaPendientes = {};
    if (data) {
      data.forEach((item) => {
        const cantidad = parseFloat(item.cantidad_solicitada) || 0;
        mapaPendientes[item.producto_nombre] =
          (mapaPendientes[item.producto_nombre] || 0) + cantidad;
      });
    }
    set({ pendientes: mapaPendientes });
  },

  procesarPedido: async (itemsAEnviar, cantidadesPedido) => {
    const toastId = toast.loading("Procesando...");
    try {
      const { start, end } = getFechaHoyISO();
      const { data: pedidosHoy } = await supabase
        .from("pedidos")
        .select("id, created_at, detalle_pedidos(*)")
        .gte("created_at", start)
        .lte("created_at", end);
      let pedidoId;
      let pedidoExistente =
        pedidosHoy && pedidosHoy.length > 0 ? pedidosHoy[0] : null;

      if (pedidoExistente) {
        pedidoId = pedidoExistente.id;
        for (const item of itemsAEnviar) {
          const cantidadNueva = parseFloat(cantidadesPedido[item.id]);
          const unidad = item.unidad === "kg" ? "kg" : "un";
          const detalleExistente = pedidoExistente.detalle_pedidos.find(
            (d) => d.producto_nombre === item.nombre && !d.recibido
          );
          if (detalleExistente) {
            const nuevaSuma =
              parseFloat(detalleExistente.cantidad_solicitada) + cantidadNueva;
            await supabase
              .from("detalle_pedidos")
              .update({ cantidad_solicitada: `${nuevaSuma} ${unidad}` })
              .eq("id", detalleExistente.id);
          } else {
            await supabase.from("detalle_pedidos").insert({
              pedido_id: pedidoId,
              producto_nombre: item.nombre,
              cantidad_solicitada: `${cantidadNueva} ${unidad}`,
            });
          }
        }
      } else {
        const { data: nuevo } = await supabase
          .from("pedidos")
          .insert({})
          .select()
          .single();
        pedidoId = nuevo.id;
        await supabase.from("detalle_pedidos").insert(
          itemsAEnviar.map((p) => ({
            pedido_id: pedidoId,
            producto_nombre: p.nombre,
            cantidad_solicitada: `${cantidadesPedido[p.id]} ${
              p.unidad === "kg" ? "kg" : "un"
            }`,
          }))
        );
      }

      const { data: final } = await supabase
        .from("pedidos")
        .select("*, detalle_pedidos(*)")
        .eq("id", pedidoId)
        .single();
      let msg = `📋 *PEDIDO COCINA SILVESTRE* (${formatearFecha(
        new Date()
      )})\n\n`;
      final.detalle_pedidos.forEach((d) => {
        if (!d.recibido)
          msg += `- ${d.producto_nombre}: *${d.cantidad_solicitada}*\n`;
      });
      navigator.clipboard.writeText(msg);
      toast.success("Pedido listo", { id: toastId });
      get().calcularPendientes();
      return true;
    } catch (e) {
      toast.error("Error", { id: toastId });
      return false;
    }
  },

  // --- CONFIRMAR RECEPCIÓN (La función que faltaba) ---
  confirmarRecepcion: async (pedidoId, itemsRecibidosIds, itemsFaltantes) => {
    const toastId = toast.loading("Procesando recepción...");
    try {
      // 1. Marcar como recibidos los seleccionados
      for (const item of itemsFaltantes) {
        const fueRecibido = itemsRecibidosIds.includes(item.id);
        if (fueRecibido) {
          // Actualizar estado en DB
          await supabase
            .from("detalle_pedidos")
            .update({ recibido: true, estado: "entregado" })
            .eq("id", item.id);

          // Sumar al Stock
          const cantidadRecibida = parseFloat(item.cantidad_solicitada);
          const productoEnStock = get().productos.find(
            (p) => p.nombre === item.producto_nombre
          );

          if (productoEnStock && cantidadRecibida > 0) {
            // Usamos sumarStock o actualizarStockCantidad directo
            // Para asegurar que se guarden los decimales y la lógica padre/hijo,
            // calculamos el nuevo total y usamos actualizarStockCantidad.
            const nuevoTotal = parseFloat(
              (productoEnStock.cantidad + cantidadRecibida).toFixed(3)
            );
            await get().actualizarStockCantidad(productoEnStock.id, nuevoTotal);
          }
        }
      }

      // 2. Gestionar los NO recibidos (Pasar a pedido de mañana)
      const noRecibidos = itemsFaltantes.filter(
        (i) => !itemsRecibidosIds.includes(i.id)
      );

      if (noRecibidos.length > 0) {
        // Marcar como "no_entregado" en este pedido
        await supabase
          .from("detalle_pedidos")
          .update({ recibido: true, estado: "no_entregado" })
          .in(
            "id",
            noRecibidos.map((i) => i.id)
          );

        // Crear pedido para mañana (o el próximo día)
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);

        const { data: nuevoPedido } = await supabase
          .from("pedidos")
          .insert({ created_at: manana.toISOString() })
          .select()
          .single();

        // Mover los items pendientes al nuevo pedido
        await supabase.from("detalle_pedidos").insert(
          noRecibidos.map((i) => ({
            pedido_id: nuevoPedido.id,
            producto_nombre: i.producto_nombre,
            cantidad_solicitada: i.cantidad_solicitada,
            recibido: false,
            estado: "pendiente",
          }))
        );
      }

      toast.success("Recepción confirmada", { id: toastId });
      get().cargarHistorial();
      get().cargarProductos();
      get().calcularPendientes();
    } catch (e) {
      console.error(e);
      toast.error("Error en recepción", { id: toastId });
    }
  },
}));
