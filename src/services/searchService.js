import axios from 'axios'

/**
 * get List of Properties | Search API
 * @param {Object} query
 * @returns
 */
export const getSearhData = async (reqHeaders, reqBody) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.NEXT_PUBLIC_API_URL_V3}/properties/filter`,
      headers: reqHeaders,
      data: reqBody,
    })
    const res = await response.data
    const data = res.data
    if (res.status === true) {
      return data
    } else {
      throw res.status
    }
  } catch (error) {
    return error.response
  }
}
