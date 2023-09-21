// to generate query string from params
export const generateQueryStringFromParams = (params, removeFlag = true) => {
  delete params.slug
  delete params.pageSize
  if (removeFlag) {
    delete params.page
  }
  delete params.includeProperties
  delete params.min_size
  delete params.max_size
  delete params.min_price
  delete params.max_price

  const queriesArray = []
  for (const property in params) {
    if (property === 'priceRange') {
      const priceRangeStr = `min_price=${params[property][0].min}&max_price=${params[property][0].max}`
      queriesArray.push(priceRangeStr)
    } else if (property === 'propertySizeRange') {
      const minSize = params[property][0].min
      const maxSize = params[property][0].max
      const propertySizeRangeStr = `min_size=${minSize}&max_size=${maxSize}`
      queriesArray.push(propertySizeRangeStr)
    } else if (property === 'propertyTypeData') {
      let propertyTypeDataStr
      if (Array.isArray(params[property])) {
        propertyTypeDataStr = params[property].join(',')
      } else {
        propertyTypeDataStr = params[property]
      }
      propertyTypeDataStr = `${property}=${propertyTypeDataStr}`
      queriesArray.push(propertyTypeDataStr)
    } else if (property === 'neighborhoodsData') {
      let neighborhoodsDataStr = params[property].join(',')
      neighborhoodsDataStr = `${property}=${neighborhoodsDataStr}`
      queriesArray.push(neighborhoodsDataStr)
    } else {
      const str = `${property}=${params[property]}`
      queriesArray.push(str)
    }
  }

  const combinedQueries = queriesArray.join('&')
  const queryString = `?${combinedQueries}`

  return queryString
}

export const getParamsFromQuery = (query) => {
  const filterQueries = { ...query }
  // Remove Slug
  if (query.slug && !query.propertyFor && (query.slug == 'sale' || query.slug == 'rent')) {
    filterQueries.propertyFor = query.slug
    delete filterQueries.slug
  }

  if (query.min_price || query.max_price) {
    filterQueries.priceRange = [
      { min: query.min_price ? query.min_price : 0, max: query.max_price ? query.max_price : 'Any' },
    ]
    delete filterQueries.min_price
    delete filterQueries.max_price
  }

  if (query.min_size || query.max_size) {
    filterQueries.propertySizeRange = [
      { min: query.min_size ? query.min_size : 0, max: query.max_size ? query.max_size : 35000 },
    ]
    delete filterQueries.min_size
    delete filterQueries.max_size
  }
  if (query.propertyTypeData) {
    filterQueries.propertyTypeData = query.propertyTypeData.split(',')
  }
  if (query.neighborhoodsData) {
    filterQueries.neighborhoodsData = query.neighborhoodsData.split(',')
  }
  if (query.districtId && query.districtId === 'null') {
    filterQueries.districtId = null
  }

  filterQueries.page = filterQueries.page || 0
  filterQueries.pageSize = filterQueries.pageSize || 16
  filterQueries.includeProperties = filterQueries.includeProperties || true

  return filterQueries
}

export const getParamsFromRefUrl = (refUrl) => {
  const referenceUrlParams = refUrl.split('?')

  const propertyForSlug = referenceUrlParams[0].split('/')[0]

  const propertyFor = propertyForSlug

  const referenceQueryString = referenceUrlParams[1]

  const refUrlParams = JSON.parse(
    '{"' + decodeURI(referenceQueryString.replace(/&/g, '","').replace(/=/g, '":"')) + '"}',
  )

  const queryparams = {
    ...refUrlParams,
    propertyFor,
    page: 0,
    pageSize: 16,
    includeProperties: true,
  }

  return queryparams
}
