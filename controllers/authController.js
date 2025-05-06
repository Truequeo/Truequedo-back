const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Enviar OTP
exports.enviarCodigo = async (req, res) => {
  const phone = req.params.phone; // <-- Obtenido desde la URL
  try {
    await twilioClient.verify.services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });
    res.json({ message: 'Código enviado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verificar OTP
exports.verificarCodigo = async (req, res) => {
  const { phone, code } = req.body;
  try {
    const verification = await twilioClient.verify.services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });

    if (verification.status === 'approved') {
      const token = jwt.sign({ phone }, process.env.JWT_SECRET);
      return res.json({ token });
    } else {
      return res.status(401).json({ error: 'Código incorrecto' });
    }
  } catch (err) {
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
