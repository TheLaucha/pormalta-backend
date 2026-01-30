<<<<<<< HEAD
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
=======
export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": [
      "https://quehacerenmalta.com",
      "https://www.quehacerenmalta.com",
    ].join(", "),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    }
  }

  try {
    const res = await fetch(`https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/`, {
      headers: {
        AccessKey: process.env.BUNNY_GALLERY_API_KEY,
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      throw new Error(`Bunny error ${res.status}`)
    }

    const data = await res.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
>>>>>>> 2be70e139c1e5428d08c503ed3ab85017f016f5a
