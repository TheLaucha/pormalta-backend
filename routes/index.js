const express = require("express")
const { home } = require("../controllers/indexController")
const tourReviews = require("./tourReviews")
const router = express.Router()

// Ruta principal
router.get("/", home)
router.use(tourReviews)

module.exports = router
