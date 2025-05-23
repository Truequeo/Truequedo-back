const { pool } = require("../connections/database");

const fs = require("fs");
const path = require("path");

const getArticulo = async (req, res) => {
  try {
    const { codusuario } = req.params;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;
    let result;

    if (codusuario) {
      result = await pool.query(
        "SELECT * FROM articulo WHERE codusuario != $1 ORDER BY codarticulo DESC OFFSET $2 LIMIT $3",
        [codusuario, offset, limit]
      );
    } else {
      result = await pool.query(
        "SELECT * FROM articulo ORDER BY codarticulo DESC OFFSET $1 LIMIT $2",
        [offset, limit]
      );
    }

    const articulosConCantidad = result.rows.map((articulo) => {
      const codarticulo = articulo.codarticulo;
      const articuloPath = path.join(
        __dirname,
        "../uploads/articulo",
        codarticulo.toString()
      );

      let cantidadImagenes = 0;
      if (fs.existsSync(articuloPath)) {
        const files = fs.readdirSync(articuloPath);
        cantidadImagenes = files.length;
      }

      return {
        ...articulo,
        cantidadImagenes,
      };
    });

    res.json(articulosConCantidad);
  } catch (error) {
    console.error("Error al obtener artículos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getArticulosCercanos = async (req, res) => {
  const { lat, lon, codusuario } = req.query;
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 10;

  if (!lat || !lon || !codusuario) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros: lat, lon o codusuario" });
  }

  try {
    const query = `
      SELECT 
        a.*, 
        u.ubicacionarticulo,
        ST_Distance(u.ubicacionarticulo, ST_SetSRID(ST_MakePoint($1, $2), 4326)) AS distancia
      FROM articulo a
      JOIN usuario u ON a.codusuario = u.codusuario
      WHERE a.codusuario != $3
      ORDER BY distancia ASC
      LIMIT $4 OFFSET $5;
    `;
    const values = [lon, lat, codusuario, limit, offset];

    const result = await pool.query(query, values);

    const articulosConCantidad = result.rows.map((articulo) => {
      const codarticulo = articulo.codarticulo;
      const articuloPath = path.join(
        __dirname,
        "../uploads/articulo",
        codarticulo.toString()
      );

      let cantidadImagenes = 0;
      if (fs.existsSync(articuloPath)) {
        const files = fs.readdirSync(articuloPath);
        cantidadImagenes = files.length;
      }

      return {
        ...articulo,
        cantidadImagenes,
      };
    });

    res.json(articulosConCantidad);
  } catch (error) {
    console.error("Error al obtener artículos cercanos:", error);
    res.status(500).json({ error: "Error al obtener artículos cercanos" });
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
  const folderPath = req.files?.length
    ? `${req.protocol}://${req.get("host")}/uploads/articulo/${codarticulo}`
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
      folderPath,
    ];
    await client.query(articuloQuery, articuloValues);
    for (const categoria of categorias) {
      await client.query(
        `INSERT INTO categorias (codarticulo, categoria) VALUES ($1, $2);`,
        [codarticulo, categoria]
      );
    }
    await client.query("COMMIT");
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

async function obtenerArticuloConCategorias(codarticulo) {
  const resArticulo = await pool.query(
    "SELECT * FROM articulo WHERE codarticulo = $1",
    [codarticulo]
  );
  const resCategorias = await pool.query(
    "SELECT categoria FROM categorias WHERE codarticulo = $1",
    [codarticulo]
  );
  if (resArticulo.rows.length === 0) return null;
  const articulo = resArticulo.rows[0];
  articulo.categorias = resCategorias.rows.map((c) => c.categoria);
  return articulo;
}

async function obtenerTodosLosArticulos() {
  const resArticulos = await pool.query("SELECT * FROM articulo");
  const articulos = resArticulos.rows;
  for (let articulo of articulos) {
    const resCategorias = await pool.query(
      "SELECT categoria FROM categorias WHERE codarticulo = $1",
      [articulo.codarticulo]
    );
    articulo.categorias = resCategorias.rows.map((c) => c.categoria);
  }
  return articulos;
}

function calcularSimilitud(base, otro) {
  let score = 0;
  const palabrasBase = base.nombrearticulo.toLowerCase().split(/\s+/);
  const palabrasOtro = otro.nombrearticulo.toLowerCase().split(/\s+/);
  const comunes = palabrasBase.filter((p) => palabrasOtro.includes(p));
  score += comunes.length;
  const categoriasBase = new Set(base.categorias);
  const categoriasOtro = new Set(otro.categorias);
  const interseccion = [...categoriasBase].filter((cat) =>
    categoriasOtro.has(cat)
  );
  const union = new Set([...categoriasBase, ...categoriasOtro]);
  score += (interseccion.length / union.size) * 2;
  score += similitudEstado(base.estadoarticulo, otro.estadoarticulo);
  return score;
}

function similitudEstado(e1, e2) {
  const mapa = {
    Nuevo: { Nuevo: 1, Seminuevo: 0.7, Viejo: 0.3 },
    Seminuevo: { Nuevo: 0.7, Seminuevo: 1, Viejo: 0.6 },
    Viejo: { Nuevo: 0.3, Seminuevo: 0.6, Viejo: 1 },
  };
  return mapa[e1]?.[e2] || 0;
}

async function recomendarArticulos(codarticulo, topN = 5) {
  const base = await obtenerArticuloConCategorias(codarticulo);
  if (!base) return [];
  const todos = await obtenerTodosLosArticulos();
  const recomendaciones = [];
  for (let art of todos) {
    if (art.codarticulo === codarticulo) continue;
    const similitud = calcularSimilitud(base, art);
    recomendaciones.push({ ...art, similitud });
  }
  recomendaciones.sort((a, b) => b.similitud - a.similitud);
  return recomendaciones.slice(0, topN);
}

const getArticuloRecomendado = async (req, res) => {
  try {
    const { codarticulo } = req.params;
    const recomendaciones = await recomendarArticulos(codarticulo);
    const resultado = recomendaciones.map((art) => ({
      codarticulo: art.codarticulo,
      codusuario: art.codusuario,
      nombrearticulo: art.nombrearticulo,
      detallearticulo: art.detallearticulo,
      estadoarticulo: art.estadoarticulo,
      fotoarticulo: art.fotoarticulo,
      similitud: art.similitud,
    }));
    const articulosConCantidad = resultado.map((articulo) => {
      const codarticulo = articulo.codarticulo;
      const articuloPath = path.join(
        __dirname,
        "../uploads/articulo",
        codarticulo.toString()
      );

      let cantidadImagenes = 0;
      if (fs.existsSync(articuloPath)) {
        const files = fs.readdirSync(articuloPath);
        cantidadImagenes = files.length;
      }

      return {
        ...articulo,
        cantidadImagenes,
      };
    });

    res.json(articulosConCantidad);
  } catch (error) {
    console.error("Error recomendando artículos:", error);
    res.status(500).json([]);
  }
};

module.exports = {
  getArticulo,
  createArticulo,
  getArticuloById,
  updateArticulo,
  getArticuloRecomendado,
  getArticulosCercanos,
};
