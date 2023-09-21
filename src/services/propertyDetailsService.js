import axios from 'axios'

// to get property details
export const getPropertyDetails = async (reqHeaders, id) => {
  let queryString = ''
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/properties/${id}${queryString}`, {
    headers: reqHeaders,
  })
  const data = await response.data
  return data
}

// to get property details v3
export const getPropertyDetailsV3 = async (reqHeaders, id) => {
  let queryString = ''
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_V3}/properties/${id}${queryString}`, {
    headers: reqHeaders,
  })
  const data = await response.data
  return data
}

// to get gallery details
export const getGalleryDetails = async (reqHeaders, id) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_V3}/property-gallery/${id}`, {
    headers: reqHeaders,
  })
  const data = await response.data
  return data
}

// to get info details
export const getInformation = async (reqHeaders, id) => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_V3}/property-amenities/${id}`, {
    headers: reqHeaders,
  })
  const data = await response.data
  return data
}