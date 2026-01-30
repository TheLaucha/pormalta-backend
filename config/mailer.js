const nodemailer = require("nodemailer")

// Crear un objeto transporter
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.APP_PASSWORD,
  },
})

module.exports = transporter
