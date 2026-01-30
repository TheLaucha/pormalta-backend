require("dotenv").config()
const express = require("express")
const corsConfig = require("../config/corsConfig")
const serverless = require("serverless-http")

const app = express()

// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(express.json())

// Configura CORS
app.use(corsConfig)

// Importar rutas
const indexRoutes = require("../routes/index")
const imagesRoutes = require("../routes/images")
const emailRoutes = require("../routes/email")

// Usar las rutas
app.use("/.netlify/functions/api", indexRoutes)
app.use("/.netlify/functions/api", imagesRoutes)
app.use("/.netlify/functions/api", emailRoutes)
// app.use("/", indexRoutes)
// app.use("/api/images", imagesRoutes)
// app.use("/api/email", emailRoutes)

module.exports.handler = serverless(app)
