const express = require("express")
const { listTours, submitTourReview } = require("../controllers/tourReviewController")

const router = express.Router()

router.get("/tour-reviews/tours", listTours)
router.post("/tour-reviews", submitTourReview)

module.exports = router
