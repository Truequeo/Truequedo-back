const { pool } = require("../connections/database");

const modificarEstado = async (req, res) => {
  const { codarticulo, codarticulo2, estado } = req.body;

  try {
    // Ordenar los códigos para evitar duplicados invertidos
    const [a1, a2] =
      codarticulo < codarticulo2
        ? [codarticulo, codarticulo2]
        : [codarticulo2, codarticulo];

    // Buscar match existente
    const busqueda = await pool.query(
      `SELECT * FROM match WHERE codarticulo = $1 AND codarticulomatch = $2`,
      [a1, a2]
    );

    let estado_articulo1 = null;
    let estado_articulo2 = null;
    let estado_final = "Pendiente";
    let fechaconfirmacion = null;

    if (busqueda.rowCount === 0) {
      // Nuevo registro
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
    } else {
      const t = busqueda.rows[0];

      // Si ya finalizó el trueque, no se puede modificar
      if (t.estadofinal === "Truequeado" || t.estadofinal === "Rechazado") {
        return res.status(400).json({
          success: false,
          message: `El trueque ya fue ${t.estadofinal.toLowerCase()}.`,
          estado_final: t.estadofinal,
        });
      }

      // Mantener estados actuales
      estado_articulo1 = t.estado;
      estado_articulo2 = t.estado2;

      // Actualizar solo el estado del artículo que responde
      if (codarticulo === a1) estado_articulo1 = estado;
      else if (codarticulo === a2) estado_articulo2 = estado;

      // Determinar estado final y fecha
      if (estado_articulo1 === "Rechazado" || estado_articulo2 === "Rechazado") {
        estado_final = "Rechazado";
        fechaconfirmacion = new Date();
      } else if (
        estado_articulo1 === "Truequeado" &&
        estado_articulo2 === "Truequeado"
      ) {
        estado_final = "Truequeado";
        fechaconfirmacion = new Date();
      } else {
        estado_final = "Pendiente";
        fechaconfirmacion = null;
      }

      await pool.query(
        `UPDATE match
         SET estado = $1, estado2 = $2, estadofinal = $3, fechaconfirmacion = $4
         WHERE codarticulo = $5 AND codarticulomatch = $6`,
        [estado_articulo1, estado_articulo2, estado_final, fechaconfirmacion, a1, a2]
      );
    }

    return res.json({ success: true, estado_final, fechaconfirmacion });
  } catch (error) {
    console.error("Error en modificarEstado:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

module.exports = {
  modificarEstado,
};
