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
    fotoarticulo,
    categorias = [],
  } = req.body;
  const client = await pool.connect();
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
      fotoarticulo,
    ];
    const result = await client.query(articuloQuery, articuloValues);
    for (const categoria of categorias) {
      await client.query(
        `INSERT INTO categorias (codarticulo, categoria) VALUES ($1, $2);`,
        [codarticulo, categoria]
      );
    }
    await client.query("COMMIT");
    res
      .status(201)
      .json({
        message: "Artículo y categorías creados",
        articulo: result.rows[0],
      });
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
    categorias = []
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
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
      codarticulo
    ];
    const result = await client.query(updateQuery, updateValues);
    if (result.rowCount === 0) {
      throw new Error('Artículo no encontrado');
    }
    await client.query(`DELETE FROM categorias WHERE codarticulo = $1`, [codarticulo]);
    for (const categoria of categorias) {
      await client.query(
        `INSERT INTO categorias (codarticulo, categoria) VALUES ($1, $2);`,
        [codarticulo, categoria]
      );
    }
    await client.query('COMMIT');
    res.status(200).json({ message: 'Artículo actualizado', articulo: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar artículo:', error);
    res.status(500).json({ error: 'Error al actualizar artículo' });
  } finally {
    client.release();
  }
};

module.exports = { getArticulo, createArticulo, getArticuloById, updateArticulo };
