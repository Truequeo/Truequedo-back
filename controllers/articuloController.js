const { pool } = require("../connections/database");

const getArticulo = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM articulo");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const createArticulo = async (req, res) => {
  const {
    codarticulo,
    codusuario,
    nombrearticulo,
    detallearticulo,
    estadoarticulo,
    categorias = [],
  } = req.body;

  const client = await pool.connect();

  const filePath = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/articulo/${req.file.filename}`
    : null;

  try {
    await client.query("BEGIN");

    const articuloQuery = `
      INSERT INTO articulo (codarticulo, codusuario, nombrearticulo, detallearticulo, estadoarticulo, fotoarticulo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const articuloValues = [
      codarticulo,
      codusuario,
      nombrearticulo,
      detallearticulo,
      estadoarticulo,
      filePath,
    ];

    await client.query(articuloQuery, articuloValues);

    for (const categoria of categorias) {
      await client.query(
        `INSERT INTO categorias (codarticulo, categoria) VALUES ($1, $2);`,
        [codarticulo, categoria]
      );
    }

    await client.query("COMMIT");

    // 🔄 Obtener usuario actualizado
    const userResult = await client.query(
      `
      SELECT 
        u.codusuario,
        u.nombreusuario,
        u.celularusuario,
        u.fotoperfil,
        u.estado,
        u.ubicacionarticulo,
        u.fechanacimiento,
        u.ratingusuario,
        a.codarticulo,
        a.nombrearticulo,
        a.detallearticulo,
        a.estadoarticulo,
        a.fotoarticulo,
        r.comentario AS rating_comentario,
        r.calificacion AS rating_calificacion,
        r.fecha AS rating_fecha
      FROM usuario u
      LEFT JOIN articulo a ON u.codusuario = a.codusuario
      LEFT JOIN rating r ON u.codusuario = r.codusuario
      WHERE u.codusuario = $1
      `,
      [codusuario]
    );

    const userRow = userResult.rows[0];

    const usuario = {
      codusuario: userRow.codusuario,
      nombreusuario: userRow.nombreusuario,
      celularusuario: userRow.celularusuario,
      fotoperfil: userRow.fotoperfil,
      estado: userRow.estado,
      ubicacionarticulo: userRow.ubicacionarticulo,
      fechanacimiento: userRow.fechanacimiento,
      ratingusuario: userRow.ratingusuario,
      articulos: [],
      ratings: [],
    };

    const articulosMap = new Map();
    const ratingsSet = new Set();

    userResult.rows.forEach((row) => {
      if (row.codarticulo && !articulosMap.has(row.codarticulo)) {
        articulosMap.set(row.codarticulo, {
          codarticulo: row.codarticulo,
          nombrearticulo: row.nombrearticulo,
          detallearticulo: row.detallearticulo,
          estadoarticulo: row.estadoarticulo,
          fotoarticulo: row.fotoarticulo,
        });
      }
      if (row.rating_comentario && row.rating_calificacion) {
        const key = row.rating_comentario + row.rating_fecha;
        if (!ratingsSet.has(key)) {
          usuario.ratings.push({
            comentario: row.rating_comentario,
            calificacion: row.rating_calificacion,
            fecha: row.rating_fecha,
          });
          ratingsSet.add(key);
        }
      }
    });

    usuario.articulos = Array.from(articulosMap.values());

    // ✅ Retorna SOLO el objeto usuario actualizado (sin message, sin articulo individual)
    res.status(201).json(usuario);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear artículo con categorías:", error);
    res.status(500).json({ error: "Error al crear artículo con categorías" });
  } finally {
    client.release();
  }
};

const getArticuloById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM articulo WHERE codarticulo = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Articulo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el articulo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateArticulo = async (req, res) => {
  const {
    codarticulo,
    nombrearticulo,
    detallearticulo,
    estadoarticulo,
    fotoarticulo,
    categorias = [],
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updateQuery = `
      UPDATE articulo
      SET nombrearticulo = $1,
          detallearticulo = $2,
          estadoarticulo = $3,
          fotoarticulo = $4
      WHERE codarticulo = $5
      RETURNING *;
    `;
    const updateValues = [
      nombrearticulo,
      detallearticulo,
      estadoarticulo,
      fotoarticulo,
      codarticulo,
    ];
    const result = await client.query(updateQuery, updateValues);
    if (result.rowCount === 0) {
      throw new Error("Artículo no encontrado");
    }
    await client.query(`DELETE FROM categorias WHERE codarticulo = $1`, [
      codarticulo,
    ]);
    for (const categoria of categorias) {
      await client.query(
        `INSERT INTO categorias (codarticulo, categoria) VALUES ($1, $2);`,
        [codarticulo, categoria]
      );
    }
    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Artículo actualizado", articulo: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar artículo:", error);
    res.status(500).json({ error: "Error al actualizar artículo" });
  } finally {
    client.release();
  }
};

module.exports = {
  getArticulo,
  createArticulo,
  getArticuloById,
  updateArticulo,
};
