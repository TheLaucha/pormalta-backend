const express = require("express")
const axios = require("axios")
require("dotenv").config()
const cors = require("cors")

const app = express()
const port = process.env.PORT || 3000

// Configura CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Reemplaza con el dominio de tu frontend
  })
)

app.get("/", (req, res) => {
  res.status(200).send("Hello World")
})

app.get("/api/images", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
