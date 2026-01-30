const express = require("express")
const { sendEmail } = require("../controllers/emailController")
const router = express.Router()

// Ruta para enviar email
router.post("/sendEmail", sendEmail)

module.exports = router
