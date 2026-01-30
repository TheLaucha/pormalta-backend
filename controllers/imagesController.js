const axios = require("axios")

// Controlador para obtener imágenes
const getImages = async (req, res) => {
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
}

module.exports = { getImages }
