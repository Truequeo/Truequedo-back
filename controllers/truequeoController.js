const { pool } = require("../connections/database");
const { getIO } = require("../socket"); // 👈 importante

const modificarEstado = async (req, res) => {
  const io = getIO();
  const { codarticulo, codarticulo2, estado } = req.body;
  try {
    // Ordenar siempre los artículos para manejar combinación única
    const [a1, a2] = codarticulo < codarticulo2
      ? [codarticulo, codarticulo2]
      : [codarticulo2, codarticulo];
    const resultado = await pool.query(
      `SELECT * FROM match WHERE codarticulo = $1 AND codarticulomatch = $2`,
      [a1, a2]
    );
    let estado_articulo1 = null;
    let estado_articulo2 = null;
    let estado_final = "Pendiente";
    let fechaconfirmacion = null;
    // Si no existe aún el match, insertamos uno nuevo
    if (resultado.rowCount === 0) {
      if (codarticulo === a1) estado_articulo1 = estado;
      else estado_articulo2 = estado;
      if (estado === "Rechazado") {
        estado_final = "Rechazado";
        fechaconfirmacion = new Date();
      }
      await pool.query(
        `INSERT INTO match (codarticulo, codarticulomatch, estado, estado2, estadofinal, fechaconfirmacion)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [a1, a2, estado_articulo1, estado_articulo2, estado_final, fechaconfirmacion]
      );
      if (estado === "Rechazado") {
        io.emit("cambioEstado", {
          codarticulo: a1,
          codarticulo2: a2,
          estadoTruequeo: "Rechazado",
          quienCambio: codarticulo,
        });
      } else {
        io.emit("informarOtro", {
          codarticulo: codarticulo,
          codarticulo2: codarticulo === a1 ? a2 : a1,
          estado: "Trueque en espera",
          quienCambio: codarticulo,
        });
      }
      return res.json({ success: true, estado_final, fechaconfirmacion });
    }
    // Ya existe el match, actualizamos estados
    const match = resultado.rows[0];
    // Si ya está finalizado, retornamos error
    if (match.estadofinal === "Truequeado" || match.estadofinal === "Rechazado") {
      return res.status(400).json({
        success: false,
        message: `El trueque ya fue ${match.estadofinal.toLowerCase()}.`,
        estado_final: match.estadofinal
      });
    }
    // Obtener estados anteriores
    estado_articulo1 = match.estado;
    estado_articulo2 = match.estado2;
    // Actualizar el estado del artículo correspondiente
    if (codarticulo === a1) estado_articulo1 = estado;
    else estado_articulo2 = estado;
    // Determinar estado final
    if (estado_articulo1 === "Rechazado" || estado_articulo2 === "Rechazado") {
      estado_final = "Rechazado";
      fechaconfirmacion = new Date();
      io.emit("cambioEstado", {
        codarticulo: a1,
        codarticulo2: a2,
        estado: "Rechazado",
        quienCambio: codarticulo,
      });
    } else if (estado_articulo1 === "Truequeado" && estado_articulo2 === "Truequeado") {
      estado_final = "Truequeado";
      fechaconfirmacion = new Date();
      io.emit("cambioEstado", {
        codarticulo: a1,
        codarticulo2: a2,
        estado: "Truequeado",
        quienCambio: codarticulo,
      });
    } else {
      estado_final = "Pendiente";
      fechaconfirmacion = null;
      io.emit("informarOtro", {
        codarticulo: codarticulo,
        codarticulo2: codarticulo === a1 ? a2 : a1,
        estado: estado === "Truequeado"
          ? "El otro artículo puso Truequeado"
          : "Trueque en espera",
        quienCambio: codarticulo,
      });
    }
    // Guardar los cambios en la base de datos
    await pool.query(
      `UPDATE match
       SET estado = $1, estado2 = $2, estadofinal = $3, fechaconfirmacion = $4
       WHERE codarticulo = $5 AND codarticulomatch = $6`,
      [estado_articulo1, estado_articulo2, estado_final, fechaconfirmacion, a1, a2]
    );

    return res.json({ success: true, estado_final, fechaconfirmacion });
  } catch (error) {
    console.error("Error en modificarEstado:", error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
};






module.exports = { modificarEstado };
