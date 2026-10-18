import nodemailer from "nodemailer"
import tourReviewController from "../controllers/tourReviewController.js"

const { createTourReview, getAvailableTours } = tourReviewController

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://localhost:5173",
  "http://127.0.0.1:5173",
  "https://127.0.0.1:5173",
  "https://pormalta.com",
  "https://www.pormalta.com",
  "https://quehacerenmalta.com",
  "https://www.quehacerenmalta.com",
  "https://maltafreetour.com",
]

function getCorsHeaders(requestOrigin) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[1]
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

export async function handler(event) {
  const requestOrigin = event.headers?.origin || ""
  const headers = getCorsHeaders(requestOrigin)

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" }
  }

  const path = event.path.replace("/.netlify/functions/api", "")

  if (path === "/tour-reviews/tours") {
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: "method_not_allowed" }),
      }
    }

    try {
      const tours = await getAvailableTours()
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, tours }),
      }
    } catch (error) {
      if (!error.statusCode || error.statusCode >= 500) {
        console.error("Error fetching tours for review:", error)
      }
      return {
        statusCode: error.statusCode || 500,
        headers,
        body: JSON.stringify({ success: false, error: error.code || "server_error" }),
      }
    }
  }

  if (path === "/tour-reviews") {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ success: false, error: "method_not_allowed" }),
      }
    }

    let requestBody
    let body
    try {
      requestBody = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf8")
        : event.body
      body = JSON.parse(requestBody || "{}")
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: "invalid_input" }),
      }
    }

    try {
      const result = await createTourReview(body)
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, ...result }),
      }
    } catch (error) {
      if (!error.statusCode || error.statusCode >= 500) {
        console.error("Error creating tour review:", error)
      }
      return {
        statusCode: error.statusCode || 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.code || "server_error",
        }),
      }
    }
  }

  // ── POST /sendEmail ────────────────────────────────────────────────────
  if (path === "/sendEmail" && event.httpMethod === "POST") {
    try {
      const { to, subject, html } = JSON.parse(event.body)

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.APP_PASSWORD,
        },
      })

      await transporter.sendMail({ to, subject, html })

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Email sent successfully" }),
      }
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: err.message }),
      }
    }
  }

  // ── GET / (galería Bunny) ──────────────────────────────────────────────
  try {
    const res = await fetch(`https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/`, {
      headers: {
        AccessKey: process.env.BUNNY_GALLERY_API_KEY,
        Accept: "application/json",
      },
    })

    if (!res.ok) throw new Error(`Bunny error ${res.status}`)

    const data = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify(data) }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
