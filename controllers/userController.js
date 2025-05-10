const { pool } = require('../connections/database');

const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuario');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createUsuario = async (req, res) => {
  const { codusuario, nombreusuario, celularusuario, fotoperfil, estado, ubicacionarticulo } = req.body;

  try {
    const query = `
      INSERT INTO usuario (codusuario, nombreusuario, celularusuario, fotoperfil, estado, ubicacionarticulo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [codusuario, nombreusuario, celularusuario, fotoperfil, estado, ubicacionarticulo];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Usuario creado', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const getUsuarioById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM usuario WHERE codusuario = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
module.exports = { getUsuarios, createUsuario ,getUsuarioById };
