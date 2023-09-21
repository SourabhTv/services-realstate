import axios from 'axios'

/**
 * Header Links for Search Page
 */
export const getHeaderLinks = async (reqHeaders) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/get-navigation-links-by-slug/menu-header`, {
    headers: reqHeaders
  })
  const responseData = await response.data
  const data = await responseData.data
  return data
}
