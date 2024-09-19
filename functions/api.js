const express = require("express")
const axios = require("axios")
require("dotenv").config()
const cors = require("cors")
const router = express.Router()

const app = express()
const port = process.env.PORT || 3000

// Configura CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "https://pormalta.com"], // Reemplaza con el dominio de tu frontend
  })
)

router.get("/", (req, res) => {
  res.status(200).send("Hello World")
})

router.get("/api/images", async (req, res) => {
  try {
    const url = `https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/./`
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        AccessKey: `${process.env.BUNNY_GALLERY_API_KEY}`,
      },
    }

    const response = await axios.get(url, options)
    const images = response.data
    res.json(images)
  } catch (error) {
    console.error(error)
    res.status(500).send("Error fetching images from Bunny.net")
  }
})

app.use("/.netlify/functions/api", router)

module.exports.handler = serverless(app)
