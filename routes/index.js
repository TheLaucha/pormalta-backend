const express = require("express")
const { home } = require("../controllers/indexController")
const router = express.Router()

// Ruta principal
router.get("/", home)

module.exports = router
