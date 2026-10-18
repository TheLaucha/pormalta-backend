const { randomUUID } = require("node:crypto")
const axios = require("axios")

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ACCESS_DURATION_MS = 15 * 24 * 60 * 60 * 1000
const VIDEOS_PER_PAGE = 100

class TourReviewError extends Error {
  constructor(statusCode, code) {
    super(code)
    this.statusCode = statusCode
    this.code = code
  }
}

const getSanityConfig = () => {
  const projectId = process.env.SANITY_PROJECT_ID
  const dataset = process.env.SANITY_DATASET || "production"
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN

  if (!projectId || !dataset || !token) {
    throw new TourReviewError(500, "server_configuration_error")
  }

  return { projectId, dataset, token }
}

const sanityRequest = async (config, path, options = {}) => {
  const response = await fetch(
    `https://${config.projectId}.api.sanity.io/v2023-03-02/data/${path}/${encodeURIComponent(config.dataset)}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/json",
        ...options.headers,
      },
    },
  )

  if (!response.ok) {
    throw new TourReviewError(502, "sanity_unavailable")
  }

  return response.json()
}

const sanityQuery = async (config, query, params = {}) => {
  const url = new URL(
    `https://${config.projectId}.api.sanity.io/v2023-03-02/data/query/${encodeURIComponent(config.dataset)}`,
  )
  url.searchParams.set("query", query)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(`$${key}`, JSON.stringify(value))
  })

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new TourReviewError(502, "sanity_unavailable")
  }

  const result = await response.json()
  return result.result
}

const getAvailableTours = async () => {
  const config = getSanityConfig()
  const tours = await sanityQuery(
    config,
    '*[_type == "freetour" && !(_id in path("drafts.**"))] | order(_createdAt asc) {_id, titulo, slug}',
  )
  return tours || []
}

const getAllVideoIds = async () => {
  const accountApiKey = process.env.BUNNY_API_KEY
  if (!accountApiKey) {
    throw new TourReviewError(500, "server_configuration_error")
  }

  try {
    const { data: librariesResponse } = await axios.get(
      "https://api.bunny.net/videolibrary",
      {
        params: { page: 1, perPage: 1000, includeAccessKey: false },
        headers: { AccessKey: accountApiKey, Accept: "application/json" },
      },
    )
    const libraries = librariesResponse.Items

    if (!Array.isArray(libraries)) {
      throw new Error("Unexpected Bunny video-library response")
    }

    const videoLists = await Promise.all(
      libraries.map(async (library) => {
        if (!library.Id || !library.ApiKey) {
          throw new Error("Bunny video library is missing its ID or API key")
        }

        const videoIds = []
        let page = 1
        let fetchedItemCount = 0
        let totalItems

        let hasMorePages = true
        while (hasMorePages) {
          const { data } = await axios.get(
            `https://video.bunnycdn.com/library/${library.Id}/videos`,
            {
              params: { page, itemsPerPage: VIDEOS_PER_PAGE },
              headers: { AccessKey: library.ApiKey, Accept: "application/json" },
            },
          )

          if (!Array.isArray(data.items)) {
            throw new Error(`Unexpected video response for library ${library.Id}`)
          }
          if (Number.isInteger(data.totalItems)) totalItems = data.totalItems

          videoIds.push(...data.items.map((video) => video.guid).filter(Boolean))
          fetchedItemCount += data.items.length
          hasMorePages =
            data.items.length === VIDEOS_PER_PAGE &&
            (totalItems === undefined || fetchedItemCount < totalItems)
          page += 1
        }

        return videoIds
      }),
    )

    const videoIds = [...new Set(videoLists.flat())]
    if (videoIds.length === 0) throw new Error("No Bunny videos were found")
    return videoIds
  } catch (error) {
    console.error(
      "Error fetching video IDs from Bunny:",
      error.response?.status || error.message,
    )
    throw new TourReviewError(502, "bunny_unavailable")
  }
}

const validateReview = (body) => {
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const comment = typeof body?.comment === "string" ? body.comment.trim() : ""
  const tourId = typeof body?.tourId === "string" ? body.tourId.trim() : ""
  const score = body?.score

  if (
    email.length > 254 ||
    !EMAIL_PATTERN.test(email) ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 10 ||
    !comment ||
    comment.length > 5000 ||
    !tourId ||
    tourId.length > 128
  ) {
    throw new TourReviewError(400, "invalid_input")
  }

  return { email, comment, tourId, score }
}

const createTourReview = async (body) => {
  const { email, comment, tourId, score } = validateReview(body)
  const config = getSanityConfig()

  const tour = await sanityQuery(
    config,
    '*[_type == "freetour" && _id == $tourId && !(_id in path("drafts.**"))][0]{_id}',
    { tourId },
  )
  if (!tour) throw new TourReviewError(400, "invalid_tour")

  const benefitGranted = score >= 9
  const createdAt = new Date()
  const reviewId = randomUUID()
  const review = {
    _id: reviewId,
    _type: "tourReview",
    tour: { _type: "reference", _ref: tour._id },
    email,
    score,
    comment,
    createdAt: createdAt.toISOString(),
    benefitGranted,
  }
  const mutations = [{ create: review }]
  let accessExpiresAt

  if (benefitGranted) {
    const [activity, videoIds] = await Promise.all([
      sanityQuery(
        config,
        '*[_type == "activity" && email == $email] | order(_createdAt desc)[0]{_id, videos}',
        { email },
      ),
      getAllVideoIds(),
    ])
    const allVideos = [...new Set(["tesoro", ...(videoIds || []).filter(Boolean)])]
    accessExpiresAt = new Date(createdAt.getTime() + ACCESS_DURATION_MS).toISOString()

    if (activity?._id) {
      const currentVideos = (activity.videos || []).filter(
        (videoId) => !/^\d+$/.test(videoId),
      )
      mutations.push({
        patch: {
          id: activity._id,
          set: {
            videos: [...new Set([...currentVideos, ...allVideos])],
            accessExpiresAt,
          },
        },
      })
    } else {
      mutations.push({
        create: {
          _type: "activity",
          email,
          videos: allVideos,
          accessExpiresAt,
        },
      })
    }
  }

  await sanityRequest(config, "mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mutations }),
  })

  return { reviewId, benefitGranted, accessExpiresAt }
}

const submitTourReview = async (req, res) => {
  try {
    const result = await createTourReview(req.body)
    return res.status(201).json({ success: true, ...result })
  } catch (error) {
    if (!(error instanceof TourReviewError) || error.statusCode >= 500) {
      console.error("Error creating tour review:", error)
    }
    return res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.code || "server_error" })
  }
}

const listTours = async (req, res) => {
  try {
    const tours = await getAvailableTours()
    return res.status(200).json({ success: true, tours })
  } catch (error) {
    if (!(error instanceof TourReviewError) || error.statusCode >= 500) {
      console.error("Error fetching tours for review:", error)
    }
    return res
      .status(error.statusCode || 500)
      .json({ success: false, error: error.code || "server_error" })
  }
}

module.exports = {
  createTourReview,
  submitTourReview,
  getAvailableTours,
  getAllVideoIds,
  listTours,
}
