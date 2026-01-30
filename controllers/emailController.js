const transporter = require("../config/mailer") // Importar el transporter

// Controlador para enviar email
const sendEmail = async (req, res) => {
  const { to, subject, html } = req.body // Datos recibidos del frontend

  // Envio de mail
  transporter
    .sendMail({
      to: to, // Usar el email del cuerpo si se proporciona
      subject: subject,
      html: html,
    })
    .then(() => {
      console.log("Email sent")
      res.status(200).send("Email sent successfully")
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send("Error sending email")
    })
}

module.exports = { sendEmail }
