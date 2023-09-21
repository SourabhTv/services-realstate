import axios from 'axios'

/**
 * Get Footer SEO Links based upon Query Parameters
 * For Users landing to Search page from internal search / application
 * @param {Object} query
 */
const createQueryStringFromParams = (queryObj) => {
  let queryArray = []
  for (const key in queryObj) {
    if (queryObj[key] ?? null) {
      queryArray.push(`${key}=${queryObj[key]}`)
    }
  }
  return `?${queryArray.join('&')}`
}
export const getFooterLinksByParams = async (apiPath, reqHeaders, reqUrl) => {
  if(apiPath == 'get-internal-links-by-params') {
    reqUrl = reqUrl.replace(/(districtId=([^&]*))/g, '')
    if(reqUrl.slice(-1) == "&"){
      reqUrl = reqUrl.slice(0, -1)
    }
  }
  let queryString = `?${reqUrl.split('?')[1].replace('propertyFor', 'categ')}`
  if (!queryString.includes('type')) {
    queryString = `${queryString}&type=residential`
  }
  // if(queryString.includes('274') && (apiPath == 'get-internal-links-by-params' || apiPath == 'get-breadcrumb-links-by-params')) {
  //   queryString = `?categ=sale&countryId=1&cityId=274&type=residential`
  // }
  const apiURL = `${process.env.NEXT_PUBLIC_API_URL}/${apiPath}`
  const response = await fetch(`${apiURL}${queryString}`, { method: 'GET', headers: reqHeaders })
  const responseData = await response.json()
  const data = responseData.data
  return data
}

/**
 * Get Footer SEO Links based upon URL Slug
 * For Users landing to Search page from SEO URL
 * @param {string} slug
 */

export const getFooterLinksBySlug = async (apiPath, reqHeaders, slug) => {
  const encodedSlug = encodeURIComponent(slug)
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${apiPath}/${encodedSlug}`
  const response = await axios.get(apiUrl, { headers: reqHeaders })
  const responseData = await response.data
  const data = responseData.data
  return data
}
