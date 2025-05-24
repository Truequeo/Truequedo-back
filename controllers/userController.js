const { pool } = require("../connections/database");
const jwt = require("jsonwebtoken");

const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuario");
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const path = require("path");

const createUsuario = async (req, res) => {
  const {
    codusuario,
    nombreusuario,
    celularusuario,
    ubicacionarticulo,
    fechanacimientousuario,
  } = req.body;

  const filePath = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/user/${req.file.filename}`
    : null;

  try {
    const [lat, lon] = ubicacionarticulo.split(",").map(Number);

    const query = `
      INSERT INTO usuario (
        codusuario, nombreusuario, celularusuario, fotoperfil, estado,
        ubicacionarticulo, fechanacimiento, ratingusuario
      )
      VALUES (
        $1, $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, 10
      )
      RETURNING *;
    `;

    const values = [
      codusuario,
      nombreusuario,
      celularusuario,
      filePath,
      "activo",
      lon,
      lat,
      fechanacimientousuario,
    ];

    const result = await pool.query(query, values);
    const usuario = result.rows[0];

    const intereses = JSON.parse(req.body.intereses || "[]"); // Asegura que sea un array real

    for (const interes of intereses) {
      await pool.query(
        `INSERT INTO interes_usuario (codusuario, interes) VALUES ($1, $2)`,
        [codusuario, interes]
      );
    }

    const token = jwt.sign({ celularusuario }, process.env.JWT_SECRET);

    res.status(201).json({
      message: "Usuario creado",
      usuario,
      token,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
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
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    const userRow = result.rows[0];
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
    result.rows.forEach((row) => {
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
    res.json(usuario);
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const updateUsuario = async (req, res) => {
  const { codusuario, nombreusuario, ubicacionarticulo } = req.body;

  const fotoperfil = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/user/${req.file.filename}`
    : req.body.fotoperfil;

  try {
    if (!codusuario) {
      return res.status(400).json({ error: "Código de usuario requerido" });
    }
    const updateQuery = `
      UPDATE usuario
      SET
        nombreusuario = $1,
        fotoperfil = $2,
        ubicacionarticulo = $3
      WHERE codusuario = $4
      RETURNING *;
    `;
    const updateValues = [
      nombreusuario,
      fotoperfil,
      ubicacionarticulo,
      codusuario,
    ];
    const updateResult = await pool.query(updateQuery, updateValues);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const selectQuery = `
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
      WHERE u.codusuario = $1;
    `;
    const selectResult = await pool.query(selectQuery, [codusuario]);
    const rows = selectResult.rows;
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Usuario no encontrado en detalle" });
    }
    const usuarioBase = {
      codusuario: rows[0].codusuario,
      nombreusuario: rows[0].nombreusuario,
      celularusuario: rows[0].celularusuario,
      fotoperfil: rows[0].fotoperfil,
      estado: rows[0].estado,
      ubicacionarticulo: rows[0].ubicacionarticulo,
      fechanacimiento: rows[0].fechanacimiento,
      ratingusuario: rows[0].ratingusuario,
      articulos: [],
      ratings: [],
    };
    const articulosSet = new Set();
    for (const row of rows) {
      if (row.codarticulo && !articulosSet.has(row.codarticulo)) {
        usuarioBase.articulos.push({
          codarticulo: row.codarticulo,
          nombrearticulo: row.nombrearticulo,
          detallearticulo: row.detallearticulo,
          estadoarticulo: row.estadoarticulo,
          fotoarticulo: row.fotoarticulo,
        });
        articulosSet.add(row.codarticulo);
      }
    }
    const ratingsSet = new Set();
    for (const row of rows) {
      const key = `${row.rating_comentario}-${row.rating_fecha}`;
      if (row.rating_comentario && !ratingsSet.has(key)) {
        usuarioBase.ratings.push({
          comentario: row.rating_comentario,
          calificacion: row.rating_calificacion,
          fecha: row.rating_fecha,
        });
        ratingsSet.add(key);
      }
    }
    res.status(200).json({
      message: "Usuario actualizado",
      usuario: usuarioBase,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

const createRating = async (req, res) => {
  const { codusuario, comentario, calificacion } = req.body;
  if (
    typeof calificacion !== "number" ||
    calificacion < 0.0 ||
    calificacion > 10.0
  ) {
    return res.status(400).json({
      error: "La calificación debe ser un número entre 0.0 y 10.0",
    });
  }
  try {
    const query = `
      INSERT INTO rating (codusuario, comentario, calificacion)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [codusuario, comentario, calificacion];
    const result = await pool.query(query, values);
    res.status(201).json({
      message: "Rating creado con éxito",
      rating: result.rows[0],
    });
  } catch (error) {
    console.error("Error al crear rating:", error);
    res.status(500).json({ error: "Error interno al crear rating" });
  }
};

module.exports = {
  getUsuarios,
  createUsuario,
  getUsuarioById,
  updateUsuario,
  createRating,
};
