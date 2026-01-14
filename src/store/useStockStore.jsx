import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

// Helper para fecha en Store
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
  loading: true,

  // --- PRODUCTOS ---
  cargarProductos: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      set({ productos: data });
    } catch (error) {
      toast.error("Error cargando productos");
    } finally {
      set({ loading: false });
    }
  },

  agregarProducto: async (nuevoProducto) => {
    const { error } = await supabase.from("productos").insert([nuevoProducto]);
    if (error) {
      toast.error("Error al guardar");
      return false;
    }
    toast.success("¡Producto creado!");
    get().cargarProductos();
    return true;
  },

  // [NUEVO] Editar Producto
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
    // Actualización optimista local
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, ...datosActualizados } : p
      ),
    }));
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

  actualizarStockCantidad: async (id, nuevaCantidad) => {
    // Optimistic UI
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, cantidad: nuevaCantidad } : p
      ),
    }));
    const { error } = await supabase
      .from("productos")
      .update({ cantidad: nuevaCantidad })
      .eq("id", id);
    if (error) {
      toast.error("Error de sincronización");
      get().cargarProductos();
    }
  },

  // --- HISTORIAL & PEDIDOS ---
  cargarHistorial: async () => {
    const { data } = await supabase
      .from("pedidos")
      .select(`*, detalle_pedidos (*)`)
      .order("created_at", { ascending: false });
    set({ historial: data || [] });
  },

  borrarPedido: async (id) => {
    if (!confirm("¿Eliminar este pedido del historial?")) return;
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success("Pedido eliminado");
      get().cargarHistorial();
    }
  },

  // [LÓGICA DE FUSIÓN MOVIDA AL STORE]
  procesarPedido: async (itemsAEnviar, cantidadesPedido) => {
    const toastId = toast.loading("Procesando pedido...");
    try {
      const { start, end } = getFechaHoyISO();

      // 1. Buscar si existe pedido hoy
      const { data: pedidosHoy } = await supabase
        .from("pedidos")
        .select("id, created_at, detalle_pedidos(*)")
        .gte("created_at", start)
        .lte("created_at", end);

      let pedidoId;
      let esActualizacion = false;
      let pedidoExistente =
        pedidosHoy && pedidosHoy.length > 0 ? pedidosHoy[0] : null;

      if (pedidoExistente) {
        // --- FUSIÓN ---
        esActualizacion = true;
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
            await supabase.from("detalle_pedidos").insert({
              pedido_id: pedidoId,
              producto_nombre: item.nombre,
              cantidad_solicitada: `${cantidadNueva} ${unidad}`,
            });
          }
        }
      } else {
        // --- CREACIÓN ---
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

      // 2. Generar Mensaje Final
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

      // 3. Feedback (Aquí está el toast success asegurado)
      toast.success(
        esActualizacion
          ? "¡Pedido actualizado y copiado!"
          : "¡Pedido creado y copiado!",
        { id: toastId }
      );

      return true; // Éxito
    } catch (error) {
      console.error(error);
      toast.error("Error procesando pedido", { id: toastId });
      return false;
    }
  },
}));
