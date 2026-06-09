import nodemailer from "nodemailer"

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://quehacerenmalta.com",
  "https://www.quehacerenmalta.com",
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
