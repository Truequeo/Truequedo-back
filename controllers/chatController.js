const { pool } = require("../connections/database");

const enviarChat = async (req, res) => {
  const { codarticulo, codremitente, codreceptor, texto } = req.body;
  try {
    const result = await pool.query(
      `
      INSERT INTO mensaje (codarticulo, codremitente, codreceptor, texto)
      VALUES ($1, $2, $3, $4) RETURNING *`,
      [codarticulo, codremitente, codreceptor, texto]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar el mensaje" });
  }
};

const obtenerMensajes = async (req, res) => {
  const { codarticulo, codusuario1, codusuario2 } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT m.*, u.nombreusuario
      FROM mensaje m
      JOIN usuario u ON u.codusuario = m.codremitente
      WHERE m.codarticulo = $1
      AND (
        (m.codremitente = $2 AND m.codreceptor = $3)
        OR (m.codremitente = $3 AND m.codreceptor = $2)
      )
      ORDER BY m.fecha ASC
    `,
      [codarticulo, codusuario1, codusuario2]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
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
          codarticulo,
          LEAST(codremitente, codreceptor),
          GREATEST(codremitente, codreceptor)
        ) *
        FROM mensaje
        WHERE codremitente = $1 OR codreceptor = $1
        ORDER BY 
          codarticulo,
          LEAST(codremitente, codreceptor),
          GREATEST(codremitente, codreceptor),
          fecha DESC
      )
      SELECT 
        um.*,
        u.nombreusuario,
        u.fotoperfil,
        a.nombrearticulo,
        a.fotoarticulo,
        CASE 
          WHEN um.codremitente = $1 THEN um.codreceptor
          ELSE um.codremitente
        END AS codinterlocutor
      FROM ultimos_mensajes um
      JOIN usuario u 
        ON u.codusuario = (
          CASE 
            WHEN um.codremitente = $1 THEN um.codreceptor
            ELSE um.codremitente
          END
        )
      JOIN articulo a
        ON a.codarticulo = um.codarticulo;
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
};
