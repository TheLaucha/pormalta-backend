const express = require("express")
const { getImages } = require("../controllers/imagesController")
const router = express.Router()

// Ruta para obtener las imágenes
router.get("/images", getImages)

module.exports = router
