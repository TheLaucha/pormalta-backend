const cors = require("cors")

const corsConfig = cors({
  origin: [
    "http://localhost:5173",
    "https://pormalta.com",
    "https://quehacerenmalta.com",
    "https://maltafreetour.com",
  ],
})

module.exports = corsConfig
