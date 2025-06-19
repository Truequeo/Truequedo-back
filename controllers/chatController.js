const { pool } = require("../connections/database");

const enviarChat = async (req, res) => {
  const { codarticulo, codarticulo2, codremitente, codreceptor, texto } =
    req.body;
  try {
    const result = await pool.query(
      `
  INSERT INTO mensaje (codarticulo, codremitente, codreceptor, texto, codarticulo2, leido)
  VALUES ($1, $2, $3, $4, $5, false) RETURNING *`,
      [codarticulo, codremitente, codreceptor, texto, codarticulo2]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
};

const marcarComoLeido = async (req, res) => {
  const { codarticulo1, codarticulo2, codusuario1, codusuario2 } = req.body;

  try {
    await pool.query(
      `
      UPDATE mensaje
      SET leido = true
      WHERE leido = false
      AND (
        (codarticulo = $1 AND codarticulo2 = $2) OR
        (codarticulo = $2 AND codarticulo2 = $1)
      )
      AND codremitente = $4 AND codreceptor = $3
      `,
      [codarticulo1, codarticulo2, codusuario1, codusuario2]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error al marcar como leído:", error);
    res.status(500).json({ error: "Error al marcar como leído" });
  }
};

const obtenerMensajes = async (req, res) => {
  let { codarticulo1, codarticulo2, codusuario1, codusuario2 } = req.params;

  // Asegurar que los códigos estén en el mismo orden que se guardan en "match"
  const [a1, a2] =
    codarticulo1 < codarticulo2
      ? [codarticulo1, codarticulo2]
      : [codarticulo2, codarticulo1];

  try {
    const result = await pool.query(
      `
      SELECT m.*, u.nombreusuario, mt.estadofinal
      FROM mensaje m
      JOIN usuario u ON u.codusuario = m.codremitente
      LEFT JOIN match mt 
        ON mt.codarticulo = $5 AND mt.codarticulomatch = $6
      WHERE (
        (m.codarticulo = $1 AND m.codarticulo2 = $2)
        OR
        (m.codarticulo = $2 AND m.codarticulo2 = $1)
      )
      AND (
        (m.codremitente = $3 AND m.codreceptor = $4)
        OR
        (m.codremitente = $4 AND m.codreceptor = $3)
      )
      ORDER BY m.fecha ASC
      `,
      [codarticulo1, codarticulo2, codusuario1, codusuario2, a1, a2]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
};

const obtenerChats = async (req, res) => {
  const { codusuario } = req.params;
  try {
    const resultado = await pool.query(
      `
      WITH ultimos_mensajes AS (
        SELECT DISTINCT ON (
          LEAST(codremitente, codreceptor),
          GREATEST(codremitente, codreceptor),
          LEAST(codarticulo, codarticulo2),
          GREATEST(codarticulo, codarticulo2)
        ) *
        FROM mensaje
        WHERE codremitente = $1 OR codreceptor = $1
        ORDER BY 
          LEAST(codremitente, codreceptor),
          GREATEST(codremitente, codreceptor),
          LEAST(codarticulo, codarticulo2),
          GREATEST(codarticulo, codarticulo2),
          fecha DESC
      )
      SELECT 
        um.*,

        -- Datos del usuario actual y su artículo
        CASE WHEN um.codremitente = $1 THEN um.codremitente ELSE um.codreceptor END AS codusuario1,
        CASE WHEN um.codremitente = $1 THEN um.codarticulo ELSE um.codarticulo2 END AS codarticulo1,
        a1.nombrearticulo AS nombrearticulo1,
        a1.fotoarticulo AS fotoarticulo1,

        -- Datos del interlocutor y su artículo
        CASE WHEN um.codremitente != $1 THEN um.codremitente ELSE um.codreceptor END AS codusuario2,
        CASE WHEN um.codremitente != $1 THEN um.codarticulo ELSE um.codarticulo2 END AS codarticulo2,
        a2.nombrearticulo AS nombrearticulo2,
        a2.fotoarticulo AS fotoarticulo2,

        -- Datos del usuario interlocutor
        u.nombreusuario AS nombreinterlocutor,
        u.fotoperfil AS fotoperfilinterlocutor

      FROM ultimos_mensajes um
      JOIN articulo a1 ON a1.codarticulo = CASE 
        WHEN um.codremitente = $1 THEN um.codarticulo ELSE um.codarticulo2 END
      JOIN articulo a2 ON a2.codarticulo = CASE 
        WHEN um.codremitente != $1 THEN um.codarticulo ELSE um.codarticulo2 END
      JOIN usuario u ON u.codusuario = CASE 
        WHEN um.codremitente != $1 THEN um.codremitente ELSE um.codreceptor END
      `,
      [codusuario]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error("❌ Error al obtener chats:", error);
    res.status(500).json({ error: "Error al obtener chats" });
  }
};

module.exports = {
  obtenerMensajes,
  enviarChat,
  obtenerChats,
  marcarComoLeido,
};
