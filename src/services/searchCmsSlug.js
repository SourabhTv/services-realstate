import axios from 'axios'

/**
 * for search cms slug
 * @returns
 */

export const searchCmsSlug = async (requestHeaders, slug) => {
  const encodedSlug = encodeURIComponent(slug)
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_V1}/search-cms-slug/${encodedSlug}`, {
    headers: requestHeaders,
  })
  const responseData = await response.data
  const data = await responseData.data
  return data
}
