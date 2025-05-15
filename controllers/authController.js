const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require("../connections/database");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Enviar SMS
exports.enviarCodigo = async (req, res) => {
  const phone = req.params.phone;
  try {
    const query = 'SELECT * FROM usuario WHERE "celularusuario" = $1';
    const result = await pool.query(query, [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Número no registrado' });
    }
    await twilioClient.verify
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });
    return res.json({ message: 'Código enviado' });
  } catch (err) {
    console.error('Error al enviar código:', err);
    return res.status(500).json({ error: 'Error al enviar el código' });
  }
};

// Verificar SMS
exports.verificarCodigo = async (req, res) => {
  const { phone, code } = req.body;
  try {
    const verification = await twilioClient.verify
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    if (verification.status === "approved") {
      const query = "SELECT * FROM usuario WHERE celularusuario = $1 LIMIT 1";
      const result = await pool.query(query, [phone]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      const usuario = result.rows[0];
      const token = jwt.sign({ phone }, process.env.JWT_SECRET);
      return res.json({
        token,
        usuario,
      });
    } else {
      return res.status(401).json({ error: "Código incorrecto" });
    }
  } catch (err) {
    console.error("Error en verificación:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.google = async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const token = jwt.sign({ email: payload.email }, process.env.JWT_SECRET);
    res.json({ token, user: payload });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
