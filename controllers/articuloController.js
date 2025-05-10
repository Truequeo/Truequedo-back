const { pool } = require('../connections/database');

const getArticulo = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articulo');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createArticulo = async (req, res) => {
  const { codarticulo, codusuario, nombrearticulo, detallearticulo, estadoarticulo, fotoarticulo } = req.body;

  try {
    const query = `
      INSERT INTO articulo (codarticulo, codusuario, nombrearticulo, detallearticulo, estadoarticulo, fotoarticulo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [codarticulo, codusuario, nombrearticulo, detallearticulo, estadoarticulo, fotoarticulo];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Articulo creado', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al crear articulo:', error);
    res.status(500).json({ error: 'Error al crear articulo' });
  }
};

const getArticuloById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM articulo WHERE codarticulo = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Articulo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el articulo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
module.exports = { getArticulo, createArticulo ,getArticuloById };
