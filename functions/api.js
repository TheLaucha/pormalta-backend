export async function handler(event) {
  const headers = {
    "Access-Control-Allow-Origin": [
      "https://quehacerenmalta.com",
      "https://www.quehacerenmalta.com",
    ].join(", "),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    }
  }

  try {
    const res = await fetch(`https://storage.bunnycdn.com/${process.env.BUNNY_STORAGE_ZONE}/`, {
      headers: {
        AccessKey: process.env.BUNNY_GALLERY_API_KEY,
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      throw new Error(`Bunny error ${res.status}`)
    }

    const data = await res.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
