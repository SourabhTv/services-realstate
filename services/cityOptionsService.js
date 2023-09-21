/**
 * get List of Cities & related Zones
 * @param {Object} query
 * @returns
 */
export const getCityData = async (reqHeaders, propertyFor) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/auto-suggest`, {
      method: 'post',
      headers: reqHeaders,
      body: JSON.stringify({
        searchText: '',
        propertyFor,
      }),
    })
    const res = await response.json()
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
