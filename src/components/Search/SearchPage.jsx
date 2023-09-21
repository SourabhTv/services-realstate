import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { analytics } from '@/components/GTM/gtm'
import { generateQueryStringFromParams, getParamsFromQuery } from 'services/queryString'
import { useSwipeable } from 'react-swipeable'
import Filter from './Filter/Filter'
import styles from './SearchPage.module.scss'
import Layout from '../Common/Layout/Layout'
import GridView from './Layout/GridView'
import DropDown from '@/hoc/components/Dropdown'
import PageNotFound from '../PageNotFound'
import Breadcrumbs from './Breadcrumbs/Breadcrumbs'
import IconTripleDots from 'assets/icons/triple-dots'
import SearchDropDown from '@/hoc/components/Dropdown/searchdropdown'
import SearchResultMap from './SearchResultMap/SearchResultMap'
import SchedulePropertyTour from '@/components/SchedulePropertyTour/schedulePropertyTour'
import MapIcon from 'assets/icons/map-icon'
import IconCross from 'assets/icons/cross'
import { useMediaQuery } from 'react-responsive'
import GridViewHeader from './Layout/GridViewHeader'
import { getUrlParams, showErrorToast } from '@/utils/utils'
import { observerService } from '@/utils/observer'
import { isDesktop, isMobileOnly } from 'react-device-detect'
import { setPropertyFavourite, clearPropertyFavourite } from '@/utils/propertyStore'
import { pushDataLayerEventHandler } from '@/utils/utils'
import BuyIcon from 'assets/icons/buyIcon'
import RentIcon from 'assets/icons/rentIcon'
import IconoGraphy from '../Common/IconoGraphy'
import AutoSearchDropDown from '../Common/AutoSearchDropDown'
import Error404 from '@/components/Common/Error404'
import { debounceFunction } from '@/utils/utils'
import LoaderImage from '../../assets/images/loader.gif'
import Image from 'next/image'
import { RenderCardOnMap } from './RenderCardOnMap'
import { getFooterLinksByParams } from 'services/footerService'

let _timeout = null

const SearchPage = (props) => {
  const searchChildRef = useRef()

  const {
    metaData,
    searchResult,
    headerMenuLinks,
    footerLinks,
    locale,
    params,
    reqHeaders,
    slugQueries,
    internalLinks,
    breadcrumbsLinks,
  } = props
  const { t, lang } = useTranslation('translations')
  const router = useRouter()
  const { query, route, asPath } = router

  // onst routerSlug = query.slug
  const routerParams = getParamsFromQuery({ ...query, ...slugQueries })
  let routerSlug
  if (metaData) {
    routerSlug = slugQueries.propertyFor
  } else {
    routerSlug = query.slug
  }
  delete routerParams.slug
  const [transactionType] = useState(routerSlug)
  // !!! IMPORTANT DO NOT DELETE ANYTHING FROM THIS OBJECT
  const filterPayload = {
    type: 'residential', // string -- not needed
    // includeProperties: true, // boolean -- mandatory
    // pageSize: 16, //int -- mandaroty
    // page: 0, //int -- mandatory
    cityId: !slugQueries?.countryId || !routerParams.countryId ? routerParams.cityId || 273 : '', //int -- mandartory
    zoneId: routerParams.zoneId || null, //int
    regionId: routerParams.regionId || null, //int
    countryId: slugQueries ? slugQueries.countryId : routerParams.countryId || 1,
    // districtId: 2098, //int
    propertyFor: transactionType, // 'sale', //string/slug  - sale / rent
    // priceRange: [{ min: 0, max: 180000000 }], //Arr[{ min: int, max: int }]
    // propertySizeRange: [{ min: 0, max: 5000 }], //Arr[{min: int, max: int}]
    // plotSizeRange: [{ min: 0, max: 5000 }], // Not yet available in API
    // propertyTypeData: [], //Arr[string] - refer screenshot
    // bedroomsCount: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], //Array of int  0 for Studio Apartments
    // bathroomsCount: [1, 2, 3, 4, 5, 6, 7, 8, 9], //Array of int
    // livingroomsCount: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Array of Int | Not yet available in API
    // guestroomsCount: [1, 2, 3, 4, 5, 6, 7, 8, 9], //Array of int | not yet Availale in API
    // neighborhoodsData: [2098], //Arr[districtIds] -- not needed
    // furnishingTypeId: 7, //int  -- refer screenshot
    // propertyAge: '0_1', //string 10_100 for 10+
    // view: 'LIST_VIEW_MOBILE', //string
    // sort: 'attribute.salePrice_desc', //string
    // fav: [3242, 234234, 32, 42, 34, 23, 4], // Arr[int]
  }

  const [filterResults, setFilterResults] = useState(searchResult)
  const [payload, setPayload] = useState(null)
  const [cityPayload, setCityPayload] = useState([])
  const [userSelectedCity, setUserSelectedCity] = useState(null)
  const [zonePayload, setZonePayload] = useState([])
  const [zoneMapPayload, setZoneMapPayload] = useState([])
  const [userSelectedZone, setUserSelectedZone] = useState({ id: null, label: t('Home.ALL_ZONES') })
  const [userSelectedZoneMap, setUserSelectedZoneMap] = useState({ id: null, label: t('Home.SELECT_ZONE') })
  const [countryPayload, setCountryPayload] = useState([])
  const [userSelectedCountry, setUserSelectedCountry] = useState(null)
  const [interLinkOpen, setInterLinkOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState(metaData?.meta_title ? metaData.meta_title : t('Search.PROPERTY_SEARCH'))
  const [getInternalLinks, setInternalLinks] = useState(internalLinks)
  const [getBreadcrumbsLinks, setBreadcrumbsLinks] = useState(breadcrumbsLinks)
  const [getFooterLinks, setFooterLinks] = useState(footerLinks)
  const [searchParams, setSearchParams] = useState(null)
  const [listView, setListView] = useState(true)
  const [allZones, showAllZones] = useState(false)
  const [schedulePropertyTour, setSchedulePropertyTour] = useState(false)
  const [schedulePropertyMobPopup, setSchedulePropertyMobPopup] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState({})
  const [isOpenAppHeader, setIsOpenAppHeader] = useState(false)
  const [showAuctionBannerPopup, setShowAuctionBannerPopup] = useState(true)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [scrollMapPosition, setScrollMapPosition] = useState(0)
  const [headerReachedTop, setHeaderReachedTop] = useState(false)
  const [headerFixed, setHeaderFixed] = useState(false)
  const [scrollStatus, setScrollStatus] = useState(false)
  const [isInternationListing, setIsInternationListing] = useState(null)
  const [searchProperties, setSearchProperties] = useState(null)
  const [propertySearchResult, setPropertySearchResult] = useState(true)
  const [currentZoneValue, setCurrentZoneValue] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isLoader, setIsLoader] = useState(false)
  const [enableListAnimation, setEnableListAnimation] = useState(false)
  const [handleCardOnMapStatus, setHandleCardOnMapStatus] = useState(null)
  const [handleSelectedPropertyData, setHandleSelectedPropertyData] = useState(null)
  const propertyHeaderRef = useRef()
  const fixedSubHeaderRef = useRef()
  let scrollDemo
  let redirectUrl = !(metaData?.reference_url && routerParams?.zoneId == null && routerParams?.districtId != null)
  let tempMapView = false
  if (metaData) {
    tempMapView =
      slugQueries?.countryId === '1' &&
      !(
        metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
        metaData?.slug == 'properties-for-sale-in-saudi-arabia'
      )
  } else {
    tempMapView =
      routerParams?.countryId === '1' &&
      !(
        metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
        metaData?.slug == 'properties-for-sale-in-saudi-arabia'
      )
  }
  const [mapView, setMapView] = useState(!tempMapView)
  const childRef = useRef()
  const mobileChildRef = useRef()
  const scrollRef = useRef(null)
  const getPageTitle = () => {
    const genericTitle = `${t('Search.PROPERTY_SEARCH')}`
    if (metaData && metaData.h1tag) {
      return routerParams.countryId == 1 && !routerParams.cityId
        ? generatePageTitle(t('common.SAUDI'), router.query.propertyFor || slugQueries.propertyFor)
        : metaData.h1tag
    }
    if (breadcrumbsLinks && breadcrumbsLinks.length > 1) return breadcrumbsLinks[breadcrumbsLinks.length - 1].title
    return genericTitle
  }

  const onCalendarClick = (pd = {}) => {
    if (pd.id) {
      setPropertyDetails({ ...pd })
    }
    setSchedulePropertyTour(!schedulePropertyTour)
  }
  useEffect(() => {
    window.dataLayer = window.dataLayer || []
    // analytics.page()
    if (window.localStorage.getItem('authToken')) {
      clearPropertyFavourite()
      getAllSavedProperties()
    }
    window.scroll(0, 0)

    setIsOpenAppHeader(
      typeof window != 'undefined' && window.sessionStorage && window.sessionStorage.getItem('isOpenHeaderClosed'),
    )
    const data = JSON.parse(localStorage.getItem('zonefilterClick'))
    if (routerParams?.variant == 'mapview') {
      setIsLoader(true)
      if (!isDesktop) {
        if (routerParams.countryId == 1) {
          setMapView(true)
          setListView(false)
        } else {
          setMapView(false)
        }
      } else {
        routerParams.countryId == 1 ? setMapView(true) : setMapView(false)
      }
    } else if (
      ((!routerParams.zoneId && !routerParams.type && (routerParams.cityId == 273 || routerParams.cityId == 274)) ||
        allZones) &&
      isDesktop
    ) {
      setMapView(data ? data.isMapView : false)
      setIsLoader(true)
    } else {
      if (data && data.zonefilterClick) {
        if (!isDesktop) {
          routerParams.countryId == 1 ? setMapView(true) : setMapView(data ? data.isMapView : false)
          setIsLoader(true)
        } else {
          setMapView(data ? data.isMapView : false)
        }
        setIsLoader(true)
        setInterLinkOpen(false)
        document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
      } else {
        setIsLoader(true)
        if (!isDesktop) {
          if (routerParams.countryId == 1) {
            setMapView(true)
            setListView(data ? !data.isMapView : true)
          } else {
            setMapView(data ? data.isMapView : false)
          }
        } else {
          setMapView(data ? data.isMapView : false)
        }
        setListView(data ? !data.isMapView : true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const observer = observerService.observable().subscribe((val) => {
      if (val?.data?.type == 'openApp') {
        setIsOpenAppHeader(window.sessionStorage.getItem('isOpenHeaderClosed'))
      }
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      // localStorage.setItem('zonefilterClick', null)
      observer.unsubscribe
    }
  }, [])

  const onCardClick = () => {
    localStorage.setItem('scrollPosition', scrollPosition)
  }

  useEffect(() => {
    setBreadcrumbsLinks(breadcrumbsLinks)
    setInternalLinks(internalLinks)
    if (lang === 'en') {
      localStorage.setItem('searchURLPD-en', metaData ? metaData?.slug : '')
      localStorage.setItem('searchURLPD-ar', metaData ? metaData?.alternateSlug : '')
    } else {
      localStorage.setItem('searchURLPD-ar', metaData ? metaData?.slug : '')
      localStorage.setItem('searchURLPD-en', metaData ? metaData?.alternateSlug : '')
    }
    localStorage.setItem('searchURLPD', router.asPath)
    const updatedPageTitle = getPageTitle()
    setPageTitle(updatedPageTitle)
  }, [breadcrumbsLinks])

  useEffect(() => {
    if (
      (routerParams?.cityId == 273 || routerParams?.cityId == 274) &&
      !routerParams?.zoneId &&
      !routerParams?.districtId
    ) {
      showAllZones(true)
    } else {
      showAllZones(false)
      if (!metaData) setUserSelectedZone(zoneMapPayload.find((item) => item.id == routerParams.zoneId))
    }
  }, [routerParams])

  useEffect(() => {
    if (metaData) {
      if (!routerSlug) {
        routerSlug = metaData?.reference_url?.split('/')[0] || routerSlug
      }
      filterPayload.propertyFor = routerSlug
      const params = new getUrlParams(metaData?.reference_url)
      filterPayload.cityId = filterPayload.cityId == '' ? params.cityId : filterPayload.cityId
      if (!filterPayload.districtId && params.districtId) {
        filterPayload.districtId = params.districtId
      }
      setUserSelectedZone(zoneMapPayload.find((item) => item.id == params.zoneId))
    }
    setPayload(filterPayload)
    setFilterResults(searchResult)
    setSearchParams({ ...filterPayload, ...routerParams, propertyFor: routerParams.propertyFor })
    setTimeout(() => {
      const lastScrollPosition = localStorage.getItem('scrollPosition')
      const data = JSON.parse(localStorage.getItem('zonefilterClick'))
      const isMapView = data ? data.isMapView : true
      if (lastScrollPosition && lastScrollPosition > 0) {
        if (isMapView) {
          document.getElementById('infiniteScrollableId')?.scrollTo(0, lastScrollPosition)
        } else if (
          !(
            metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
            metaData?.slug == 'properties-for-sale-in-saudi-arabia'
          ) ||
          routerParams.countryId == 1
        ) {
          window.scrollTo(0, lastScrollPosition)
        } else {
          window.scrollTo(0, lastScrollPosition)
        }
      } else {
        if (mapView && router?.query?.page && routerParams.countryId === '1') {
          document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
        } else {
          window.scrollTo(0, 0)
        }
      }
    }, 250)
  }, [searchResult])

  async function getAllSavedProperties() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_AUCTION_URL}getAllSavedAuctionsProperties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        locale: lang,
        authorization: window.localStorage.getItem('authToken') ?? '',
      },
      body: JSON.stringify({
        userId: Number(window.localStorage.getItem('userId')),
        type: 'saved_property',
      }),
    })
    const response = await res.json()
    if (response?.data) {
      const favProperties = response?.data?.properties.map((item, index) => {
        setPropertyFavourite(item)
      })
    }
  }

  const getInternational = async () => {
    let isInternationListing = false
    const countries = []
    const pageUrl = window.location.href.split('/').pop()
    const res = await fetch(`/api/properties/fetchCountry`, {
      headers: {
        'Content-Type': 'application/json',
        locale: locale,
      },
    })
    const response = await res.json()
    response?.data?.forEach((item) => {
      countries.push({
        id: item.country,
        label: item.title,
        url: item.url,
      })
      if (item.url.includes(pageUrl) || item.country === routerParams.countryId) {
        generatePageTitle(item.title)
        setUserSelectedCountry({
          id: item.country,
          label: item.title,
          url: item.url,
        })
        isInternationListing = true
      } else {
        if (
          decodeURI(pageUrl).includes('عقارات-للبيع-في-السعودية') ||
          decodeURI(pageUrl).includes('properties-for-sale-in-saudi-arabia')
        ) {
          // setMapView(false)
          setUserSelectedCountry({
            id: 'saudi',
            label: lang === 'ar' ? 'المملكة العربية السعودية' : 'Saudi Arabia',
            url: `/${pageUrl}`,
          })
        }
        isInternationListing = true
      }
    })
    setIsInternationListing(isInternationListing)
    setMapView(false)
    setCountryPayload(countries)
    setCityPayload([])
    setZonePayload([])
  }

  const getCityZone = async (pageUrl) => {
    let cityUrl = ''
    let zoneUrl = ''
    const cityOptions = []
    const zoneOptions = []
    const zoneMapOptions = []

    const res = await fetch(`/api/properties/fetchCity`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const response = await res.json()

    let selectedCity = null

    response.data.forEach((item) => {
      const name = lang === 'ar' ? item.ar_name : item?.name
      cityOptions.push({
        id: item.id,
        label: name,
        // count: item.property_count,
        zones: item.zones,
        popular: item.popular,
      })
      if (item.id === pageUrl || item.id === cityUrl) {
        selectedCity = { id: item.id, label: name }

        setUserSelectedCity(selectedCity)
        item.zones?.forEach((elem) => {
          zoneOptions.push({
            id: elem.id,
            label: lang === 'ar' ? `${elem.ar_name}` : `${elem.name}`,
            // count: elem.property_count,
          })
          zoneMapOptions.push({
            id: elem.id,
            label: lang === 'ar' ? `${elem.ar_name}` : `${elem.name}`,
            // count: elem.property_count,
          })
          if (elem.id == zoneUrl || elem.id == slugQueries?.zoneId) {
            setUserSelectedZone({
              id: elem.id,
              label: lang === 'ar' ? `${elem.ar_name}` : `${elem.name}`,
            })
          }
        })
      }
    })
    setCityPayload(cityOptions)
    if (zoneOptions.length > 0) {
      let params = new getUrlParams(metaData?.reference_url)
      if (metaData && metaData?.reference_url) {
        if (params?.zoneId) {
          zoneOptions.unshift({ id: null, label: t('Home.ALL_ZONES') })
        }
      } else {
        if (!routerParams?.districtId && !metaData?.reference_url) {
          zoneOptions.unshift({ id: null, label: t('Home.ALL_ZONES') })
        }
      }

      let foundZone = zoneOptions.find((item) => {
        if (!metaData) {
          if (item.id == routerParams.zoneId) {
            const label = item.id == null && selectedCity ? selectedCity.label : item.label
            generatePageTitle(label)
            return true
          }
        }
      })
      if (!routerParams?.districtId && !metaData?.reference_url) {
        if (
          !routerParams.zoneId &&
          (routerParams.cityId == 273 || routerParams.cityId == 274) &&
          !routerParams.districtId
        ) {
          setUserSelectedZone({ id: null, label: t('Home.SELECT_ZONE') })
        } else {
          setUserSelectedZone(foundZone || { id: null, label: t('Home.ALL_ZONES') })
        }
      } else {
        if (params?.zoneId) {
          setUserSelectedZone(zoneMapOptions.find((item) => item.id == params.zoneId))
        } else {
          setUserSelectedZone({ id: null, label: t('Home.SELECT_ZONE') })
        }
      }
    }

    if (zoneMapOptions.length > 0) {
      if (!routerParams?.districtId && !metaData?.reference_url) {
        zoneMapOptions.unshift({ id: null, label: t('Home.SELECT_ZONE') })
        setUserSelectedZoneMap({ id: null, label: t('Home.SELECT_ZONE') })
      }
    }
    setZonePayload(zoneOptions)
    setZoneMapPayload(zoneMapOptions)
    // {id: routerParams.zoneId, name:zonePayload.name}
    setCountryPayload([])
  }

  useEffect(() => {
    window.localStorage.setItem('key', JSON.stringify(searchResult.properties.slice(0, 6)))
    const pageUrl = routerParams.cityId || slugQueries?.cityId
    if (pageUrl) {
      getCityZone(pageUrl)
      setIsInternationListing(false)
    } else {
      getInternational()
    }
  }, [reqHeaders, routerParams.zoneId, routerParams.cityId])

  const handleScrollTopReach = (position) => {
    const topPosition = isDesktop ? 2 : 113
    if (headerReachedTop != position && position >= topPosition) {
      setHeaderReachedTop(true)
    }
    if (position <= topPosition) {
      setHeaderReachedTop(false)
    }
  }

  const handleInfiniteScrollBar = () => {
    setScrollPosition(scrollDemo.scrollTop)
    handleScrollTopReach(scrollDemo.scrollTop)
    !isDesktop && handleScrollForMobile()
  }

  const handleScroll = () => {
    let position = 0
    position = window.pageYOffset
    handleScrollTopReach(position)
    setScrollPosition(position)
    return position
  }

  // Handle scroll for mobile & tab
  const handleScrollForMobile = () => {
    if (_timeout) {
      //if there is already a timeout in process cancel it
      clearTimeout(_timeout)
    }
    _timeout = setTimeout(() => {
      _timeout = null
      setScrollStatus(false)
    }, 200)
    if (scrollStatus !== true) {
      setScrollStatus(true)
    }
  }

  // card details handle here
  const handleCardOnMap = useCallback((isCardVisible, selectedPropertyData) => {
    setHandleCardOnMapStatus(isCardVisible)
    setHandleSelectedPropertyData(selectedPropertyData)
  }, [])

  useEffect(() => {
    if (typeof window != 'undefined') {
      if (mapView) {
        scrollDemo = document.querySelector('#infiniteScrollableId')
        scrollDemo?.addEventListener('scroll', handleInfiniteScrollBar, { passive: true })
        isDesktop && window.addEventListener('scroll', handleScroll)
        return () => {
          scrollDemo?.removeEventListener('scroll', handleInfiniteScrollBar)
          isDesktop && window.removeEventListener('scroll', handleScroll)
        }
      } else {
        var scrollVal = window.addEventListener('scroll', handleScroll)
        return () => {
          window.removeEventListener('scroll', handleScroll)
        }
      }
    }
  }, [mapView, isLoader])

  // get scroll position @sourabh_c
  const onScroll = () => {
    if (!fixedSubHeaderRef.current) {
      return
    }
    const top = fixedSubHeaderRef.current.getBoundingClientRect().top
    if (top == 0) {
      setHeaderFixed(true)
    } else {
      setHeaderFixed(false)
    }
  }

  const onSortBySelection = ({ type, isVerified }) => {
    if (routerParams.page) {
      routerParams.page = routerParams.page - 1
    }
    const actualPayload = { ...defaultSearchParams, ...routerParams, sort: type, isVerified: isVerified }
    type === 'noSelect' && delete actualPayload.sort
    setPayload({ ...payload, ...actualPayload })
    removeUnwantedProperties(actualPayload)
  }

  const switchView = () => {
    const tempMapView = !mapView
    setMapView(tempMapView)
    if (tempMapView) {
      // const actualPayload = { ...routerParams, ...defaultSearchParams }
      //removed defaultSearchParams because on view switch from list to map pagination resets to 1
      const actualPayload = { ...routerParams, page: routerParams.page > 0 ? Number(routerParams.page) - 1 : 0 }
      filterProperties(actualPayload)
    }
    localStorage.setItem(
      'zonefilterClick',
      JSON.stringify({
        zonefilterClick: false,
        isMapView: tempMapView,
      }),
    )
    window.scrollTo(0, 0)
  }

  const defaultSearchParams = {
    includeProperties: true,
    pageSize: '16',
    page: '0',
  }

  const onChangeState = (state) => {
    setPayload({ ...payload, ...state })
  }

  const applyFilter = (state) => {
    if (mapView) {
      document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
    } else {
      window.scrollTo(0, 0)
    }
    setPayload({ ...payload, ...state })
    // Google Tag Manager -- Data Layer Start
    const dataDetails = {
      service: router.query.slug == 'Rent' ? 'Rent' : 'Sale',
      city: userSelectedCity?.label || '',
      zone: userSelectedZone?.label || '',
      bathroomsCount: state.bathroomsCount,
      bedroomsCount: state.bedroomsCount,
      priceRange: state.priceRange,
      propertyType: state.propertyTypeData,
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }

    pushDataLayerEventHandler(window, lang, 'Quick Filters', mapView ? 'SRP-Map' : 'SRP-List', dataDetails)

    //Google Tag Manager -- Data Layer end
    const tempPayload = { ...payload, ...state }
    !tempPayload.cityId && delete tempPayload.cityId
    !tempPayload.countryId && delete tempPayload.countryId
    !tempPayload.zoneId && delete tempPayload.zoneId
    removeUnwantedProperties(tempPayload)
  }

  const sideNavFilter = () => {
    if (payload?.priceRange && payload?.priceRange[0]?.min != undefined && payload?.priceRange[0]?.min != null) {
      if (payload?.propertyFor != routerParams?.propertyFor) {
        changePropertyforType(payload.propertyFor, true)
      }
      if (Number(payload.priceRange[0].max) >= Number(payload.priceRange[0].min)) {
        // Google Tag Manager -- Data Layer Start
        const data = {
          ...payload,
          service: router.query.slug == 'Rent' ? 'Rent' : 'Sale',
          // service: propertyFor,
          city: userSelectedCity?.label || '',
          zone: userSelectedZone?.label || '',
          country: userSelectedCountry?.label,
          property_category: routerParams?.countryId
            ? routerParams?.countryId == 1
              ? 'domestic'
              : 'international'
            : '',
        }

        const pageType = mapView ? (listView && !isDesktop ? 'SRP-List' : 'SRP-Map') : 'SRP-List'
        pushDataLayerEventHandler(window, lang, 'Filters Apply', pageType, data)
        //Google Tag Manager -- Data Layer end

        const tempPayload = payload
        !tempPayload.cityId && delete tempPayload.cityId
        !tempPayload.countryId && delete tempPayload.countryId
        !tempPayload.zoneId && delete tempPayload.zoneId
        removeUnwantedProperties(tempPayload)
        removeUnwantedProperties(payload)
      } else {
        showErrorToast(t('common.MAXIMUM_GREATER'))
      }
    } else {
      if (payload?.propertyFor != routerParams?.propertyFor) {
        changePropertyforType(payload.propertyFor, true)
      }
      pushDataLayerEventHandler(
        window,
        lang,
        'Filters Apply',
        mapView ? (listView && !isDesktop ? 'SRP-List' : 'SRP-Map') : 'SRP-List',
        {
          ...payload,
          service: router.query.slug == 'Rent' ? 'Rent' : 'Sale',
          property_category: routerParams?.countryId
            ? routerParams?.countryId == 1
              ? 'domestic'
              : 'international'
            : '',
        },
      )
      //Google Tag Manager -- Data Layer end
      const tempPayload = payload
      !tempPayload.cityId && delete tempPayload.cityId
      !tempPayload.countryId && delete tempPayload.countryId
      !tempPayload.zoneId && delete tempPayload.zoneId
      removeUnwantedProperties(tempPayload)
    }
  }

  const generatePageTitle = (selectedLabel, propertyforType) => {
    const type = propertyforType ? propertyforType : routerSlug
    let arText = `${t(`Search.${type == 'rent' ? 'PROPERTIES_FOR_RENT' : 'PROPERTIES_FOR_SALE'}`)} ${t(
      'Search.IN',
    )} ${selectedLabel}`
    let enText = `${t(`Search.${type == 'rent' ? 'PROPERTIES_FOR_RENT' : 'PROPERTIES_FOR_SALE'}`)} ${t(
      'Search.IN',
    )} ${selectedLabel}`
    lang === 'ar' ? setPageTitle(arText) : setPageTitle(enText)
    return lang === 'ar' ? arText : enText
  }

  //Generate page title as query param change
  useEffect(() => {
    if ((params?.countryId && params.countryId != 1) || (routerParams?.countryId && routerParams.countryId != 1)) {
      return
    }
    if (query.propertyFor && !query.districtId && !params.propertyZone) {
      generatePageTitle(
        userSelectedZone?.id != cityPayload.find((item) => item.id === routerParams.cityId)?.name
          ? userSelectedZone?.label
          : userSelectedCity?.label,
        query.propertyFor,
      )
    }
  }, [query, userSelectedZone, cityPayload])

  const removeUnwantedProperties = (filteredPayload) => {
    const actualPayload = { ...routerParams, ...defaultSearchParams, ...filteredPayload }
    if (!actualPayload.propertyFor) {
      actualPayload.propertyFor = routerSlug
    }
    for (let key in actualPayload) {
      if (!actualPayload[key]) {
        delete actualPayload[key]
      } else if (actualPayload[key] && !actualPayload[key].length) {
        if (key != 'fav') {
          delete actualPayload[key]
        }
      } else if (actualPayload[key].length && typeof actualPayload[key][0] === 'object') {
        if (parseInt(actualPayload[key][0].min) === 0 && parseInt(actualPayload[key][0].max) === 10000000) {
          // if (isObjectEmpty(actualPayload[key][0])) {
          delete actualPayload[key]
        }
      }
    }
    actualPayload.isVerified = filteredPayload.isVerified || false
    actualPayload.includeProperties = true
    actualPayload.page = 0
    actualPayload.pageSize = 16
    filterProperties(actualPayload)
  }

  const handleSetFilter = (data) => setFilterResults(data)

  const filterProperties = async (filterParams, sortingFilter = false) => {
    const isRevamp = typeof window !== 'undefined' && window.location.search.includes('variant=srp-revamp')
    let updatedFilterParams = { ...filterParams, timestamp: new Date().getTime() }
    const pageUrl = window.location.href.split('/').pop()
    if (
      decodeURI(pageUrl).includes('عقارات-للبيع-في-السعودية') ||
      decodeURI(pageUrl).includes('properties-for-sale-in-saudi-arabia')
    ) {
      setPayload({ ...payload, propertyFor: filterParams.propertyFor })
      delete filterParams.cityId
      delete updatedFilterParams.cityId
    }

    if (!sortingFilter) {
      setSearchParams(updatedFilterParams)
    }
    delete updatedFilterParams.timestamp
    if (String(updatedFilterParams.isVerified) == 'false') {
      delete updatedFilterParams.isVerified
    }
    const res = await fetch(`/api/properties/filter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        locale: locale,
      },
      body: JSON.stringify({ ...updatedFilterParams }),
    })
    const response = await res.json()
    const responseData = await response.data
    const data = await responseData.data
    handleSetFilter(data)
    if (filterParams && filterParams.fav && !filterParams.fav.length) {
      filterParams.fav = ['none']
    }
    // if (mapView) {
    //   document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
    // } else {
    //   window.scrollTo(0, 0)
    // }
    //removing unwanted properties
    !filterParams.districtId && delete filterParams.districtId
    delete filterParams.timestamp
    delete filterParams.propertyZone
    delete filterParams.includeProperties
    if (!filterParams.regionId) {
      delete filterParams.regionId
    }
    if (filterParams.zoneId == null) {
      delete filterParams.zoneId
    }
    filterParams.propertyFor = routerSlug
    if (filterParams.page > 0) {
      filterParams.page = Number(filterParams.page) + 1
    }
    // Generate Query String
    const queryString = await generateQueryStringFromParams(filterParams, filterParams.page == 0)
    if (redirectUrl) {
      if (
        !(
          decodeURI(pageUrl).includes('عقارات-للبيع-في-السعودية') ||
          decodeURI(pageUrl).includes('properties-for-sale-in-saudi-arabia')
        )
      ) {
        // Shallow Route
        const routeUrl = `/${lang}/${filterParams.propertyFor}/search${queryString}${
          !filterParams.variant && isRevamp ? '&variant=srp-revamp' : ''
        }`
        router.push(routeUrl, undefined, { shallow: true })
      } else {
        generatePageTitle(t('common.SAUDI'), filterParams.propertyFor)
        const routeUrl = `/${lang}/${router.query.slug}${queryString}${
          !filterParams.variant && isRevamp ? '&variant=srp-revamp' : ''
        }`
        router.push(routeUrl, undefined, { shallow: true })
      }
    }
    if (filterParams.countryId && filterParams.countryId != 1 && countryPayload.length > 0) {
      setUserSelectedCountry({ ...countryPayload.find((item) => item.id == filterParams.countryId) })
    } else if (filterParams.cityId && cityPayload.length > 0) {
      setUserSelectedCity({ ...cityPayload.find((item) => item.id == filterParams.cityId) })
    }
  }

  const fetchFooterDetails = async (url) => {
    const footerDetails = await getFooterLinksByParams(
      'get-footer-links-by-params',
      {
        'Content-Type': 'application/json',
        locale: locale,
      },
      url,
    )
    setFooterLinks(footerDetails)
  }

  // callback to change rent/sale // @sourabh_c
  const changePropertyforType = async (propertyforType, notClr = false) => {
    redirectUrl = true
    routerSlug = propertyforType
    setInputValue('')
    let resURL
    let url = localStorage.getItem('searchURLPD')
    if (propertyforType === 'sale') {
      resURL = url.replace(/rent/gi, 'sale')
    } else {
      resURL = url.replace(/sale/gi, 'rent')
    }
    localStorage.setItem('searchURLPD', resURL)
    const tempActualPayload = { ...routerParams, propertyFor: propertyforType, page: 0, pageSize: 16 }
    const queryString = await generateQueryStringFromParams(tempActualPayload)

    if (notClr) {
      generatePageTitle(
        userSelectedZone?.id != null ? userSelectedZone?.label : userSelectedCity?.label,
        propertyforType,
      )
    }
    // on changing property for filter calling fetch Breadcrumblinks
    getBreadCrumbDetails(routerParams?.cityId)
    // fetch footer links based on slug
    fetchFooterDetails(resURL)
    // clearing filter on propertyType change
    if (!notClr) {
      let params = router.query
      if (metaData) {
        params = {
          countryId: slugQueries.countryId || '1',
          cityId: slugQueries.cityId || '273',
        }
      }
      onClearClick(params, propertyforType)
    }
  }

  const handleZoneFilterClick = (val) => {
    let filterClick = val == undefined ? true : val
    if (val == undefined && mapView && !listView) {
      filterClick = false
    }
    const zonefilterClickData = JSON.parse(localStorage.getItem('zonefilterClick'))
    const data = {
      zonefilterClick: filterClick,
      isMapView: val == undefined ? mapView : zonefilterClickData?.isMapView,
    }
    localStorage.setItem('zonefilterClick', JSON.stringify(data))
  }

  const getBreadCrumbDetails = async (cityId) => {
    // Set Request Options

    const reqOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        locale: locale,
      },
      body: JSON.stringify({
        proptype: routerSlug,
        country: routerParams?.countryId || slugQueries?.countryId,
        city: cityId || slugQueries?.cityId,
        categ: routerSlug,
        type: routerParams?.type || slugQueries?.type || 'residential',
        slug: routerSlug,
      }),
    }

    // Get Breadcrumbs
    const res = await fetch(`/api/properties/breadcrumbsLinks`, reqOptions)
    const response = await res.json()
    setBreadcrumbsLinks(response.data)

    // Get Internal Links
    const linkRes = await fetch(`/api/properties/internalLinks`, reqOptions)
    const linkResponse = await linkRes.json()
    setInternalLinks(linkResponse.data)
  }

  const handleCityChange = async (values) => {
    redirectUrl = true
    // Google Tag Manager -- Data Layer Start

    const data = {
      city: values.label,
      service: router.query.slug == 'rent' ? 'Rent' : 'Sale',
      search_keyword: values.searchedVal,
      search_result_clicked: values.label,
      searchType: 'location',
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }

    pushDataLayerEventHandler(window, lang, 'CitySelection', mapView ? 'SRP-Map' : 'SRP-List', data)
    //Google Tag Manager -- Data Layer end

    handleZoneFilterClick()
    if (mapView) {
      document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
    } else {
      window.scrollTo(0, 0)
    }
    const zoneOptions = []
    const zoneMapOptions = []

    //Fetch breadcrumb and internal links
    await getBreadCrumbDetails(values.id)
    // fetch footer links based on slug
    let resURL = `/${router.query.slug}/search?cityId=${values.id}&propertyFor=${router.query.slug}&countryId=${
      routerParams?.countryId || 1
    }`
    fetchFooterDetails(resURL)
    // Set Page h1 Tag || Page Title
    let selectedCity = null
    cityPayload.forEach((item) => {
      if (item.id === values.id) {
        selectedCity = { id: values.id, label: values.label }

        setUserSelectedCity(selectedCity)

        item.zones?.forEach((elem) => {
          zoneOptions.push({
            id: elem.id,
            label: lang === 'ar' ? `${elem.ar_name} ` : `${elem.name}`,
          })
          zoneMapOptions.push({
            id: elem.id,
            label: lang === 'ar' ? `${elem.ar_name} ` : `${elem.name}`,
          })
        })
      }
    })

    if (selectedCity) {
      generatePageTitle(selectedCity.label)
    }

    if (zoneOptions.length > 0) {
      if (!routerParams?.districtId && !metaData?.reference_url) {
        zoneOptions.unshift({ id: null, label: t('Home.ALL_ZONES') })
        setUserSelectedZone({ id: null, label: t('Home.ALL_ZONES') })
      } else {
        setUserSelectedZone({ id: null, label: t('Home.SELECT_ZONE') })
      }
      setZonePayload(zoneOptions)
    } else {
      setZonePayload([])
    }

    if (zoneMapOptions.length > 0) {
      if (!routerParams?.districtId && !metaData?.reference_url) {
        zoneMapOptions.unshift({ id: null, label: t('Home.SELECT_ZONE') })
        setUserSelectedZoneMap({ id: null, label: t('Home.SELECT_ZONE') })
      }
      setZoneMapPayload(zoneMapOptions)
    } else {
      setZoneMapPayload([])
    }

    let temp = { ...payload }
    temp.cityId = values.id + ''
    temp.zoneId = null
    temp.districtId = null
    temp.priceRange = null
    temp.propertySizeRange = null
    temp.districtId = null
    setPayload(temp)
    removeUnwantedProperties(temp)
    setInterLinkOpen(false)
  }

  const handlePropertyIdChange = useCallback(
    debounceFunction(async function (searchVal) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/auto-suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          locale: lang,
          Cookie: `i18next=${lang}`,
          authorization: window.localStorage.getItem('authToken') ?? '',
        },
        body: JSON.stringify({
          searchText: searchVal,
          propertyFor: routerSlug,
        }),
      })
      const response = await res.json()

      // added indexOf to check whether number is negative
      if (response?.data?.length && searchVal.indexOf('-') == -1) {
        setSearchProperties(response.data)
        setPropertySearchResult(true)
      } else {
        setPropertySearchResult(false)
      }
    }, 400),
    [routerSlug],
  )

  const handlePropertyRedirection = (slug, propertyFor, searchedVal, title) => {
    const details = {
      service: propertyFor,
      search_keyword: searchedVal,
      search_result_clicked: title,
      searchType: 'property',
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }

    pushDataLayerEventHandler(window, lang, 'SearchProperty', mapView ? 'SRP-MAP' : 'SRP-List', details)
    router.push(`${lang == 'en' ? '/en' : ''}/${propertyFor}/${slug}`)
  }

  const noDataHandleClick = (searchedVal, type) => {
    const details = {
      service: transactionType,
      search_keyword: searchedVal,
      search_result_clicked: 'No result found',
      searchType: type,
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }

    pushDataLayerEventHandler(window, lang, 'SearchProperty', mapView ? 'SRP-MAP' : 'SRP-List', details)
  }

  const handleZoneChange = async (values) => {
    setCurrentZoneValue(values)
    redirectUrl = true
    // Google Tag Manager -- Data Layer Start
    const page_Type = mapView ? (listView && !isDesktop ? 'SRP-List' : 'SRP-Map') : 'SRP-List'
    const data = {
      service: router.query.slug === 'rent' ? 'Rent' : 'Sale',
      city: userSelectedCity?.label || '',
      zone: values.label,
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }
    pushDataLayerEventHandler(window, lang, 'ZoneSelection', page_Type, data)
    //Google Tag Manager -- Data Layer end

    if (breadcrumbsLinks.length == 0 || internalLinks.length == 0) {
      //Fetch breadcrumb and internal links
      getBreadCrumbDetails(routerParams?.cityId)
    }

    handleZoneFilterClick()
    if (mapView) {
      document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
    } else {
      window.scrollTo(0, 0)
    }
    if (values.id == null) {
      showAllZones(true)
    }
    setUserSelectedZone(values)
    let temp = { ...payload }
    temp.zoneId = values.id ? values.id + '' : null

    // Set Page Title
    let selectedLabel = null
    if (userSelectedCity.id == 273 || userSelectedCity.id == 274) {
      selectedLabel = userSelectedCity.label
    } else {
      selectedLabel = userSelectedCity.label
    }
    generatePageTitle(selectedLabel)
    temp.priceRange = null
    temp.propertySizeRange = null
    temp.districtId = null
    setPayload(temp)
    removeUnwantedProperties(temp)
    setInterLinkOpen(false)
  }

  const handleCountryChange = (values) => {
    redirectUrl = true
    handleZoneFilterClick()
    if (mapView) {
      document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
    }
    setUserSelectedCountry(values)
    router.push(`${values.url}?variant=srp-revamp`)
    // Google Tag Manager -- Data Layer Start

    const details = {
      country: values.label,
      service: router.query.slug == 'rent' ? 'Rent' : 'Sale',
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }

    pushDataLayerEventHandler(window, lang, 'Change Country', 'SRP-List', details)

    //Google Tag Manager -- Data Layer end
  }

  const handleAuctionBannerRedirection = () => {
    localStorage.setItem(
      'zonefilterClick',
      JSON.stringify({
        zonefilterClick: false,
        isMapView: true,
      }),
    )
    router.push(
      `${process.env.NEXT_PUBLIC_AUCTIONBASE_URL}${lang == 'en' ? '/en' : ''}${
        payload.cityId ? `?cityId=${payload.cityId}` : ''
      }`,
    )
  }

  const handleCloseAuctionBanner = (e) => {
    e?.stopPropagation()
    closeAuctionBanner()
  }

  const closeAuctionBanner = () => {
    if (showAuctionBannerPopup) {
      setShowAuctionBannerPopup(false)
    }
  }

  const handleDataLayer = (arg) => {
    // FOr Buy/Rent toggle on searchpage
    const data = {
      city: userSelectedCity?.label || '',
      service: arg,
      zone: userSelectedZone?.label || '',
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }
    pushDataLayerEventHandler(window, lang, 'Change Service', mapView ? 'SRP-MAP' : 'SRP-List', data)
  }
  const handleDataLayerSwitchView = () => {
    // For ListView/MapView change
    const data = {
      city: userSelectedCity?.label || '',
      service: router.query.slug == 'rent' ? 'Rent' : 'Sale',
      zone: userSelectedZone?.label || '',
      viewSelected: mapView ? 'SRP-List' : 'SRP-MAP',
      property_category: routerParams?.countryId ? (routerParams?.countryId == 1 ? 'domestic' : 'international') : '',
    }
    pushDataLayerEventHandler(window, lang, 'Change View', mapView ? 'SRP-MAP' : 'SRP-List', data)
  }
  const onClearClick = (params, propertyforType) => {
    let selectedZone = null
    let data = null
    if (params.countryId) {
      if (params.countryId == 1) {
        selectedZone = { ...cityPayload.find((item) => item.id == params.cityId) }
        data = {
          cityId: params.cityId || '273',
          countryId: '1',
          page: 0,
          pageSize: 16,
          propertyFor: propertyforType || routerSlug,
          includeProperties: true,
          zoneId: router.query.zoneId || params.zoneId || null,
        }
      } else {
        selectedZone = { ...countryPayload.find((item) => item.id == params.countryId) }
        data = {
          countryId: params.countryId,
          page: 0,
          pageSize: 16,
          propertyFor: propertyforType || routerSlug,
          includeProperties: true,
        }
      }
    } else {
      selectedZone = { ...cityPayload[0] }
      data = {
        cityId: '273',
        countryId: '1',
        page: 0,
        pageSize: 16,
        propertyFor: propertyforType || routerSlug,
        includeProperties: true,
      }
    }
    if (selectedZone.label) {
      setUserSelectedCountry(selectedZone)
      generatePageTitle(router.query.zoneId ? userSelectedZone?.label : selectedZone.label, propertyforType)
    }
    setPayload(data)
    filterProperties(data)
  }

  const handleBreadCrumbClick = (value) => {
    redirectUrl = true
    handleZoneFilterClick(listView)
    setInterLinkOpen(value)
  }

  const swipeHandler = () => {
    handleZoneFilterClick(!listView)
    setListView(!listView)
    // setMapView(false)
    setInterLinkOpen(false)
    document.getElementById('infiniteScrollableId')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }

  const handlers = useSwipeable({
    onSwipedUp: () => {
      setEnableListAnimation(true)
      setLocalStorage(listView)
      swipeHandler()
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  })

  const handleInternationListingBack = () => {
    router.push('/')
  }

  // set local storage for mobile
  const setLocalStorage = (data) => {
    localStorage.setItem(
      'zonefilterClick',
      JSON.stringify({
        zonefilterClick: false,
        isMapView: data,
      }),
    )
  }

  // Check for MediaQuery
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 980 })
  const isMobile = useMediaQuery({ maxWidth: 640 })
  const commonNewFilter = () => {
    return (
      <>
        <div
          className={`${styles.forDesktop}  ${styles.stickySubheader} ${headerFixed ? styles.fixedSubheader : ''}`}
          ref={fixedSubHeaderRef}
        >
          <div className={styles.bodySec} ref={propertyHeaderRef}>
            <div className={styles.mainSectionTop}>
              <div className={`${styles.innerMainSec}`}>
                <div className={styles.topHeader}>
                  <div
                    className={`${styles.searchSubHeader} ${styles.filterSubHeader} ${
                      isInternationListing && styles.marginBottom56
                    } `}
                  >
                    <div className={`${styles.thinFilter} ${styles.autoLenght}`}>
                      <Filter
                        onChangeState={onChangeState}
                        apply={applyFilter}
                        SideNavFilter={sideNavFilter}
                        payload={payload}
                        ref={childRef}
                        routerParams={routerParams}
                        mapView={mapView}
                        changePropertyforType={changePropertyforType}
                        forsaleInternationType={isInternationListing}
                        customClass={headerReachedTop ? 'subHeaderStickey' : ''}
                        cityProp={userSelectedCity?.label}
                        zoneProp={userSelectedZone?.label}
                      ></Filter>
                    </div>

                    <div className={styles.searchContainer}>
                      <div className={styles.searchWidget}>
                        <div
                          className={`${styles.searchBox} ${countryPayload.length > 0 ? styles.countrySearchBox : ''}`}
                        >
                          <div className={styles.searchSelectors}>
                            <div className={cityPayload.length > 0 ? styles.citySelector : styles.countrySelector}>
                              {cityPayload.length > 0 && (
                                <AutoSearchDropDown
                                  items={cityPayload}
                                  selectedItem={userSelectedCity}
                                  dropBtn='ghostDropdownHeader'
                                  dropBody='ghostDropdownBody'
                                  inputValue={inputValue}
                                  setInputValue={setInputValue}
                                  handleItemClick={(item) => handleCityChange(item)}
                                  searchProperties={searchProperties}
                                  propertySearchResult={propertySearchResult}
                                  handlePropertyIdChange={handlePropertyIdChange}
                                  handlePropertyRedirection={handlePropertyRedirection}
                                  noDataHandleClick={noDataHandleClick}
                                  inputId='city-input-one'
                                />
                              )}

                              {countryPayload.length > 0 && (
                                <DropDown
                                  data={countryPayload}
                                  selectedValue={userSelectedCountry}
                                  dropBtn='ghostDropdownHeader'
                                  dropBody='ghostDropdownBody'
                                  getSelectedValue={(item) => handleCountryChange(item)}
                                  iconWidth={16}
                                  iconHeight={16}
                                  iconColor={`currentcolor`}
                                />
                              )}
                            </div>
                            <div className={styles.zoneSelector}>
                              {zonePayload.length > 0 && (
                                <SearchDropDown
                                  items={zonePayload}
                                  selectedItem={userSelectedZone}
                                  dropBtn='ghostDropdownHeader'
                                  dropBody='ghostDropdownBody'
                                  handleItemClick={(item) => handleZoneChange(item)}
                                />
                              )}
                            </div>
                          </div>
                          <div className={styles.searchIcons}>
                            {/* {routerSlug == 'sale' && ( */}
                            <div onClick={() => setInterLinkOpen(!interLinkOpen)} className={styles.breadcrumbIcon}>
                              {
                                !countryPayload.length && (
                                  <IconoGraphy
                                    iconClass={'icon-three-dots'}
                                    iconColor={'color_grey'}
                                    fontSize={'f_12'}
                                  ></IconoGraphy>
                                )

                                // <IconTripleDots bgColor={'#fff'} />
                              }
                            </div>
                            {/* )} */}
                            <div
                              className={`${styles.mobileFilterIcon} ${lang === 'ar' ? styles.rtl : ''}`}
                              onClick={() => {
                                childRef.current.setFromOutside()
                              }}
                            >
                              <IconoGraphy
                                iconClass={'icon-filter'}
                                iconColor={'color_gray'}
                                fontSize={'f_15'}
                              ></IconoGraphy>
                            </div>
                          </div>
                        </div>
                        {interLinkOpen && (
                          <div className={styles.breadcrumbsWrapper}>
                            <Breadcrumbs
                              internalLinks={getInternalLinks}
                              breadcrumbsLinks={getBreadcrumbsLinks}
                              lang={lang}
                              handleClose={handleBreadCrumbClick}
                              isMapView={mapView}
                              isOpen={interLinkOpen}
                              customClass='headerChanges'
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {!(
                  metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
                  metaData?.slug == 'properties-for-sale-in-saudi-arabia'
                ) &&
                  routerParams.countryId == 1 && (
                    <div className={styles.rightSection}>
                      <button
                        className={styles.switchView}
                        onClick={() => {
                          switchView()
                          handleDataLayerSwitchView()
                        }}
                      >
                        {mapView ? (
                          <>
                            <span className={styles.viewIcon}>
                              {/* <MenuIcon width='12' height='12' fillColor='#FFFFFF' /> */}
                              <IconoGraphy
                                iconClass={'icon-menu'}
                                iconColor={'color_white'}
                                fontSize={'f_15'}
                              ></IconoGraphy>
                            </span>
                            {t('Search.LIST_VIEW')}
                          </>
                        ) : (
                          <>
                            <span className={styles.viewIcon}>
                              {/* <FlagIcon width='12' height='12' fillColor='#FFFFFF' /> */}
                              <IconoGraphy
                                iconClass={'icon-map-view'}
                                iconColor={'color_white'}
                                fontSize={'f_15'}
                              ></IconoGraphy>
                            </span>
                            {t('Search.MAP_VIEW')}
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {!mapView ? (
          <div className={`${styles.forDesktop}`}>
            <div className={styles.topHeader}>
              {filterResults?.properties?.length ? (
                <div className={styles.customGridViewHeader}>
                  <GridViewHeader
                    pageTitle={pageTitle}
                    switchView={switchView}
                    swipeHandler={swipeHandler}
                    filterResults={filterResults}
                    onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
                    // mapView={mapView}
                    listView={listView}
                    customClass={'commHeader'}
                    zone={userSelectedZone?.label}
                    city={userSelectedCity?.label}
                    sortByIcon={true}
                    dropDownClass='removeGap'
                    forsaleInternationType={isInternationListing}
                    slugQueries={slugQueries}
                    metaData={metaData}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </>
    )
  }

  const mobileViewFilter = () => {
    return (
      <div
        className={`${styles.gridViewWrapper}   ${
          filterResults?.properties && filterResults?.properties[0]?.propertyRegionId == 57 && !isOpenAppHeader
            ? styles.top13
            : ''
        }`}
      >
        {routerParams.countryId == 1 && (
          <div className={styles.searchContainer}>
            <div className={`${styles.searchWidget} ${headerReachedTop ? styles.mobileSticky : ''}`}>
              <div className={`${styles.searchWidgetTabs}`}>
                <div className={`${styles.searchWidgetTabsItem}`}>
                  <span className={`${styles.propertyTypeIcon}`}>
                    <BuyIcon fillColor={routerSlug == 'sale' ? '#8F15D0' : null} />
                  </span>
                  <input
                    type='radio'
                    name='property-type'
                    id='buy-type'
                    checked={routerSlug == 'sale'}
                    onClick={() => {
                      changePropertyforType('sale')
                      handleDataLayer('Sale')
                    }}
                  />
                  <label for='buy-type'>{t('Home.BUY')}</label>
                </div>
                <div className={styles.lineinbetween}></div>
                <div className={`${styles.searchWidgetTabsItem}`}>
                  <span className={`${styles.propertyTypeIcon}`}>
                    <RentIcon fillColor={routerSlug == 'rent' ? '#8F15D0' : null} />
                  </span>
                  <input
                    type='radio'
                    name='property-type'
                    id='rent-type'
                    checked={routerSlug == 'rent'}
                    onClick={() => {
                      changePropertyforType('rent')
                      handleDataLayer('Rent')
                    }}
                  />
                  <label for='rent-type'>{t('Home.RENT')}</label>
                </div>
                <div className={styles.rightline}></div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`${styles.searchSubHeader} ${
            filterResults?.properties && filterResults?.properties[0]?.propertyRegionId !== 57 && styles.marginBottom56
          } ${headerReachedTop ? styles.fixedForMobile : ''}
          ${!isOpenAppHeader ? (headerReachedTop ? styles.isOpenAppHeaderTop : '') : ''}
          `}
        >
          <div className={styles.thinFilter}>
            <Filter
              onChangeState={onChangeState}
              apply={applyFilter}
              SideNavFilter={sideNavFilter}
              payload={payload}
              ref={childRef}
              routerParams={routerParams}
              mapView={mapView}
              changePropertyforType={changePropertyforType}
              forsaleInternationType={isInternationListing}
              customClass={headerReachedTop ? 'mobileFilterFix' : ''}
              cityProp={userSelectedCity?.label}
              zoneProp={userSelectedZone?.label}
              filterTopCss={headerReachedTop ? (!isOpenAppHeader ? 'manageZindex' : 'top0') : ''}
            ></Filter>
          </div>
          <div className={styles.searchContainer}>
            <div
              className={`${styles.searchBox} ${headerReachedTop ? styles.topFixHeaderMobile : ''}
            ${
              metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
              metaData?.slug == 'properties-for-sale-in-saudi-arabia'
                ? styles.custom56top
                : ''
            }
            `}
            >
              <div className={styles.searchSelectors}>
                {/* city or country selector */}
                <div className={cityPayload.length > 0 ? styles.citySelector : styles.countrySelector}>
                  {cityPayload.length > 0 && (
                    <AutoSearchDropDown
                      items={cityPayload}
                      selectedItem={userSelectedCity}
                      dropBtn='ghostDropdownHeader'
                      dropBody='ghostDropdownBody'
                      inputValue={inputValue}
                      setInputValue={setInputValue}
                      handleItemClick={(item) => handleCityChange(item)}
                      searchProperties={searchProperties}
                      propertySearchResult={propertySearchResult}
                      handlePropertyIdChange={handlePropertyIdChange}
                      handlePropertyRedirection={handlePropertyRedirection}
                      noDataHandleClick={noDataHandleClick}
                      inputId='city-input-two'
                    />
                  )}
                  {countryPayload.length > 0 && (
                    <DropDown
                      data={countryPayload}
                      selectedValue={userSelectedCountry}
                      dropBtn='ghostDropdownHeader'
                      dropBody='ghostDropdownBody'
                      getSelectedValue={(item) => handleCountryChange(item)}
                      iconWidth={16}
                      iconHeight={16}
                      iconColor={`currentcolor`}
                    />
                  )}
                </div>
                {/* zone selector */}
                <div className={styles.zoneSelector}>
                  {zonePayload.length > 0 && (
                    <SearchDropDown
                      items={zonePayload}
                      selectedItem={userSelectedZone}
                      dropBtn='ghostDropdownHeader'
                      dropBody='ghostDropdownBody'
                      handleItemClick={(item) => handleZoneChange(item)}
                      inputId='city-input-three'
                    />
                  )}
                </div>
              </div>
              <div className={styles.searchIcons}>
                {/* Internal links selector */}
                {routerSlug == 'sale' && (
                  <div onClick={() => setInterLinkOpen(!interLinkOpen)} className={styles.breadcrumbIcon}>
                    {!countryPayload.length && <IconTripleDots bgColor={'#fff'} />}
                  </div>
                )}
                {/* Mobile Filter */}
                <div
                  className={`${styles.mobileFilterIcon} ${lang === 'ar' ? styles.rtl : ''}`}
                  onClick={() => {
                    childRef.current.setFromOutside()
                  }}
                >
                  <IconoGraphy iconClass={'icon-filter'} iconColor={'color_gray'} fontSize={'f_15'}></IconoGraphy>
                </div>
              </div>
            </div>
            {interLinkOpen && (
              <Breadcrumbs
                internalLinks={getInternalLinks}
                breadcrumbsLinks={getBreadcrumbsLinks}
                lang={lang}
                handleClose={handleBreadCrumbClick}
                isMapView={mapView}
                isOpen={interLinkOpen}
                customClass={headerReachedTop ? 'mobileTabHeaderTop' : 'mobileTabHeaderChanges'}
              />
            )}
          </div>
        </div>
        {filterResults?.properties?.length ? (
          <GridViewHeader
            pageTitle={pageTitle}
            switchView={switchView}
            swipeHandler={swipeHandler}
            filterResults={filterResults}
            onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
            mapView={mapView}
            metaData={metaData}
            listView={listView}
            zone={userSelectedZone?.label}
            city={userSelectedCity?.label}
            sortByIcon={true}
            dropDownClass='removeGap'
            forsaleInternationType={isInternationListing}
            slugQueries={slugQueries}
          />
        ) : (
          routerParams?.countryId == 1 && (
            <div className={`${styles.mobileErrorWrapper}`}>
              <h1 className={styles.page__title}>
                {0} {pageTitle}
              </h1>
              <Error404
                selectedValue={userSelectedCity}
                image='/images/404-image.svg'
                heading='ContentErrorPage.CANT_FIND_PAGE'
                alt='ContentErrorPage.NOT_FOUND'
                cityOptions={cityPayload}
                handleItemClick={(item) => handleCityChange(item)}
                inputId='mobile-input'
              />
            </div>
          )
        )}
        {!(
          metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
          metaData?.slug == 'properties-for-sale-in-saudi-arabia'
        ) &&
          routerParams.countryId == 1 && (
            <div className={`${styles.viewMapBtn} ${scrollStatus ? styles.isDisable : styles.isEnable}`}>
              <button
                className={styles.switchView}
                onClick={() => {
                  setEnableListAnimation(false)
                  swipeHandler()
                  setLocalStorage(listView)
                }}
              >
                <span className={styles.viewIcon}>
                  <MapIcon width='12' height='12' fillColor='#FFFFFF' />
                </span>
                {t('Search.VIEWMAP_LABEL')}
              </button>
            </div>
          )}
      </div>
    )
  }

  if (!isLoader) {
    return (
      <Layout
        title={`Search Page`}
        keywords={`Search Page`}
        description={`Search Page`}
        headerCities={headerMenuLinks}
        footerLinks={getFooterLinks}
        customClass={headerReachedTop ? 'headerRemove' : ''}
        slugQueries={slugQueries}
        pageType='SRP'
      >
        <div className={styles.centered_loader}>
          <Image width='45' height='45' src={LoaderImage} alt='loading ...' />{' '}
        </div>
      </Layout>
    )
  }
  if (!filterResults) {
    return (
      <Layout
        title={`Search Page`}
        keywords={`Search Page`}
        description={`Search Page`}
        headerCities={headerMenuLinks}
        footerLinks={getFooterLinks}
        customClass={headerReachedTop ? 'headerRemove' : ''}
        slugQueries={slugQueries}
        pageType='SRP'
      >
        <>
          <div className={styles.filter_error}>
            <h1 style={{ flexGrow: 1 }} className={styles.page__title}>
              {t('PageNotFound.TEXT2')}
            </h1>
            <div className={styles.filter_sort}>
              <GridViewHeader
                pageTitle={pageTitle}
                switchView={switchView}
                swipeHandler={swipeHandler}
                filterResults={{ count: 0, properties: [] }}
                onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
                // mapView={mapView}
                metaData={metaData}
                listView={listView}
                zone={userSelectedZone?.label}
                city={userSelectedCity?.label}
                sortByIcon={true}
                dropDownClass='removeGap'
                forsaleInternationType={isInternationListing}
                slugQueries={slugQueries}
              />
            </div>
          </div>

          <Error404
            selectedValue={userSelectedCity}
            image='/images/404-image.svg'
            heading='ContentErrorPage.CANT_FIND_PAGE'
            alt='ContentErrorPage.NOT_FOUND'
            cityOptions={cityPayload}
            handleItemClick={(item) => handleCityChange(item)}
            inputId='no-filter-input'
          />
        </>
      </Layout>
    )
  } else if (
    mapView &&
    routerParams.countryId == 1 &&
    !(
      metaData?.alternateSlug == 'properties-for-sale-in-saudi-arabia' ||
      metaData?.slug == 'properties-for-sale-in-saudi-arabia'
    )
  ) {
    return (
      <Layout
        title={pageTitle}
        keywords={metaData && metaData.meta_keyword}
        description={metaData && metaData.meta_description}
        headerCities={headerMenuLinks}
        footerLinks={getFooterLinks}
        locale={locale}
        currentPage={'mapSearch'}
        metaData={metaData}
        customClass={headerReachedTop ? 'headerRemove' : ''}
        slugQueries={slugQueries}
        pageType={mapView ? 'SRP Map' : 'SRP List'}
      >
        {/* list view cards. */}
        {schedulePropertyTour && (
          <SchedulePropertyTour
            pageType={mapView ? (listView && !isDesktop ? 'SRP-List' : 'SRP-Map') : 'SRP-List'}
            isCompound={propertyDetails.isCompound}
            propertyDetails={propertyDetails}
            onClickPositive={() => onCalendarClick()}
            onClickNegative={() => onCalendarClick()}
          />
        )}

        {/* for Desktop with map view */}
        {commonNewFilter()}
        {/* for Desktop end */}
        {
          <div className={`${styles.mapview__container} ${schedulePropertyMobPopup ? styles.mapview__zindex99 : ''}`}>
            <section
              id='infiniteScrollableId'
              className={`${styles.mapview__sidebar} ${
                enableListAnimation ? styles.mapview__sidebar_optionalListAnimation : ''
              } ${
                listView
                  ? `${
                      filterResults?.count <= 16 && isOpenAppHeader
                        ? styles.sidebarMobile3
                        : filterResults?.count <= 16
                        ? styles.sidebarMobile2
                        : styles.sidebarMobile
                    } ${
                      !(
                        typeof window != 'undefined' &&
                        window.sessionStorage &&
                        window.sessionStorage.getItem('isOpenHeaderClosed')
                      ) && styles.open_app_header
                    }`
                  : ''
              }`}
            >
              {/* for mobile */}
              <div className={styles.forMobile}>{mobileViewFilter()}</div>
              {/* mobile end */}

              <div>
                {/* Custom title view for desktop @sourabh_c */}
                {mapView ? (
                  <div className={`${styles.dekstopGridView} ${styles.forDesktop}`}>
                    {filterResults?.properties?.length ? (
                      <div className={styles.dekstopGridViewHeader}>
                        {
                          <GridViewHeader
                            pageTitle={pageTitle}
                            switchView={switchView}
                            swipeHandler={swipeHandler}
                            filterResults={filterResults}
                            onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
                            // mapView={mapView}
                            metaData={metaData}
                            listView={listView}
                            zone={userSelectedZone?.label}
                            city={userSelectedCity?.label}
                            sortByIcon={true}
                            dropDownClass='removeGap'
                            forsaleInternationType={isInternationListing}
                            slugQueries={slugQueries}
                          />
                        }
                      </div>
                    ) : (
                      <div className={styles.dekstopGridViewHeader}>
                        <GridViewHeader
                          pageTitle={pageTitle}
                          switchView={switchView}
                          swipeHandler={swipeHandler}
                          filterResults={filterResults}
                          onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
                          // mapView={mapView}
                          metaData={metaData}
                          listView={listView}
                          zone={userSelectedZone?.label}
                          city={userSelectedCity?.label}
                          sortByIcon={true}
                          dropDownClass='removeGap'
                          forsaleInternationType={isInternationListing}
                          slugQueries={slugQueries}
                        />
                        <Error404
                          selectedValue={userSelectedCity}
                          image='/images/404-image.svg'
                          heading='ContentErrorPage.CANT_FIND_PAGE'
                          alt='ContentErrorPage.NOT_FOUND'
                          cityOptions={cityPayload}
                          handleItemClick={(item) => handleCityChange(item)}
                          inputId='desktop-input'
                        />
                      </div>
                    )}
                  </div>
                ) : null}
                <div ref={scrollRef} id='scrollRef'>
                  {filterResults?.properties?.length && pageTitle ? (
                    <GridView
                      pageTitle={pageTitle}
                      switchView={switchView}
                      swipeHandler={swipeHandler}
                      filterResults={filterResults}
                      onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
                      locale={locale}
                      isMobile={isMobile}
                      isTablet={isTablet}
                      totalCount={filterResults.count}
                      metaData={metaData}
                      reqHeaders={reqHeaders}
                      reference_url={metaData ? metaData.reference_url : null}
                      mapView={mapView}
                      searchParams={searchParams}
                      updateSearchParams={(params) => {
                        setSearchParams({ ...searchParams, ...params, timestamp: new Date().getTime() })
                      }}
                      onCalendarClick={onCalendarClick}
                      cityId={payload?.cityId || null}
                      listView={listView}
                      userSelectedCity={userSelectedCity}
                      userSelectedZone={userSelectedZone}
                      scrollPosition={scrollPosition}
                      onCardClick={onCardClick}
                      slugQueries={slugQueries}
                    />
                  ) : null}
                </div>
              </div>
            </section>
            <section className={styles.mapview__maparea}>
              {payload && (
                <SearchResultMap
                  ref={searchChildRef}
                  handleCardOnMap={handleCardOnMap}
                  userSelectedCity={userSelectedCity}
                  selectedZone={
                    (!routerParams.zoneId && (routerParams.cityId == 273 || routerParams.cityId == 274)) || allZones
                      ? null
                      : searchParams.zoneId
                  }
                  selectedCity={
                    (!routerParams.zoneId && (routerParams.cityId == 273 || routerParams.cityId == 274)) || allZones
                      ? null
                      : searchParams.cityId
                  }
                  searchParams={searchParams}
                  metaData={metaData}
                  routerParams={routerParams}
                  updateSearchParams={(params) => {
                    if (params.propertyZone) {
                      generatePageTitle(params.propertyZone, params.propertyFor)
                    }
                    filterProperties(params)
                  }}
                  isListviewMobile={listView}
                  showAuctionBannerPopup={showAuctionBannerPopup}
                  handleMapEvents={closeAuctionBanner}
                  currentZoneValue={currentZoneValue}
                  handleSchedulePopup={(val) => {
                    setSchedulePropertyMobPopup(val)
                  }}
                  isOpenAppHeader={isOpenAppHeader}
                />
              )}
            </section>
            {/* searchcontainer Mobile */}
            {!listView && (
              <div className={styles.searchSubHeaderMobile}>
                <div className={styles.searchContainerMobile}>
                  <div className={styles.searchWidget}>
                    <div className={`${styles.searchWidgetTabs}`}>
                      <div className={`${styles.searchWidgetTabsItem}`}>
                        <span className={`${styles.propertyTypeIcon}`}>
                          <BuyIcon fillColor={routerSlug == 'sale' ? '#8F15D0' : null} />
                        </span>
                        <input
                          type='radio'
                          name='property-type'
                          id='buy-type'
                          checked={routerSlug == 'sale'}
                          onClick={() => {
                            changePropertyforType('sale')
                            handleDataLayer('Sale')
                          }}
                        />
                        <label for='buy-type'>{t('Home.BUY')}</label>
                      </div>
                      <div className={styles.lineinbetween}></div>
                      <div className={`${styles.searchWidgetTabsItem}`}>
                        <span className={`${styles.propertyTypeIcon}`}>
                          <RentIcon fillColor={routerSlug == 'rent' ? '#8F15D0' : null} />
                        </span>
                        <input
                          type='radio'
                          name='property-type'
                          id='rent-type'
                          checked={routerSlug == 'rent'}
                          onClick={() => {
                            changePropertyforType('rent')
                            handleDataLayer('Rent')
                          }}
                        />
                        <label for='rent-type'>{t('Home.RENT')}</label>
                      </div>
                      <div className={styles.rightline}></div>
                    </div>
                    <div
                      className={`${styles.searchBox} ${
                        filterResults?.properties && filterResults?.properties[0]?.propertyRegionId !== 57
                          ? styles.top56_searchBox
                          : ''
                      }`}
                    >
                      <div className={styles.searchSelectors}>
                        {/* city or country selector */}
                        <div className={cityPayload.length > 0 ? styles.citySelector : styles.countrySelector}>
                          {/* <div className={styles.caretIcon}>
                          <CaretRightIcon fillColor='#4A4C4F' width='20' height='20' />
                        </div> */}
                          {cityPayload.length > 0 && (
                            <AutoSearchDropDown
                              items={cityPayload}
                              selectedItem={userSelectedCity}
                              dropBtn='ghostDropdownHeader'
                              dropBody='ghostDropdownBody'
                              inputValue={inputValue}
                              setInputValue={setInputValue}
                              handleItemClick={(item) => handleCityChange(item)}
                              searchProperties={searchProperties}
                              propertySearchResult={propertySearchResult}
                              handlePropertyIdChange={handlePropertyIdChange}
                              handlePropertyRedirection={handlePropertyRedirection}
                              noDataHandleClick={noDataHandleClick}
                              inputId='city-input-four'
                            />
                          )}
                          {countryPayload.length > 0 && (
                            <DropDown
                              data={countryPayload}
                              selectedValue={userSelectedCountry}
                              dropBtn='ghostDropdownHeader'
                              dropBody='ghostDropdownBody'
                              getSelectedValue={(item) => handleCountryChange(item)}
                              iconWidth={16}
                              iconHeight={16}
                              iconColor={`currentcolor`}
                            />
                          )}
                        </div>
                        {/* zone selector */}
                        <div className={styles.zoneSelector}>
                          {zonePayload.length > 0 && (
                            <SearchDropDown
                              items={zonePayload}
                              selectedItem={userSelectedZone}
                              dropBtn='ghostDropdownHeader'
                              dropBody='ghostDropdownBody'
                              handleItemClick={(item) => handleZoneChange(item)}
                            />
                          )}
                        </div>
                      </div>
                      <div className={styles.searchIcons}>
                        {/* Internal links selector */}
                        {routerSlug == 'sale' && (
                          <div onClick={() => setInterLinkOpen(!interLinkOpen)} className={styles.breadcrumbIcon}>
                            {!countryPayload.length && <IconTripleDots bgColor={'#fff'} />}
                          </div>
                        )}
                        {/* Mobile Filter */}
                        <div
                          className={`${styles.mobileFilterIcon} ${lang === 'ar' ? styles.rtl : ''}`}
                          onClick={() => {
                            mobileChildRef.current.setFromOutside()
                          }}
                        >
                          <IconoGraphy
                            iconClass={'icon-filter'}
                            iconColor={'color_gray'}
                            fontSize={'f_15'}
                          ></IconoGraphy>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {interLinkOpen && (
                  <div className={styles.breadcrumbsMobile}>
                    <Breadcrumbs
                      internalLinks={getInternalLinks}
                      breadcrumbsLinks={getBreadcrumbsLinks}
                      lang={lang}
                      handleClose={handleBreadCrumbClick}
                      isMapView={mapView}
                      isOpen={interLinkOpen}
                    />
                  </div>
                )}
                <div className={styles.thinFilterMobile}>
                  <Filter
                    onChangeState={onChangeState}
                    apply={applyFilter}
                    SideNavFilter={sideNavFilter}
                    payload={payload}
                    ref={mobileChildRef}
                    routerParams={routerParams}
                    mapView={mapView}
                    customId={'mobileSidenav'}
                    changePropertyforType={changePropertyforType}
                    forsaleInternationType={isInternationListing}
                    cityProp={userSelectedCity?.label}
                    zoneProp={userSelectedZone?.label}
                  ></Filter>
                </div>
              </div>
            )}

            {/* search container mobile */}
            <div className={styles.mobileBottomContainer}>
              {!process.env.NEXT_PUBLIC_DISABLE_AUCTION_FLOW
                ? routerSlug == 'sale' &&
                  showAuctionBannerPopup && (
                    <div className={styles.mapContainerDivpopup} onClick={handleAuctionBannerRedirection}>
                      <img src='/images/QuickBid.png' />
                      <label>{t('common.AUCTIONBANNER_MOBILE_POPUP')}</label>
                      <div onClick={handleCloseAuctionBanner} className={styles.closeButton}>
                        <IconCross width='10' height='10' strokeColor='#510C76' />
                      </div>
                    </div>
                  )
                : null}

              {
                // Map on Card visible on mobile (need to show upside of drawer)
                handleCardOnMapStatus && handleSelectedPropertyData && isMobileOnly && (
                  <div className={showAuctionBannerPopup ? styles.mapOverCardMobile : styles.mapOverCardMobile2}>
                    {
                      <RenderCardOnMap
                        selectedProperty={handleSelectedPropertyData}
                        router={router}
                        onCalendarClick={searchChildRef.current.onCalendarClick}
                        contactDetails={searchChildRef.current.contactDetails}
                        t={t}
                        lang={lang}
                        handleOverlayClick={searchChildRef.current.handleOverlayClick}
                        closeCardOnMap={searchChildRef.current.closeCardOnMap}
                        onWhatsAppClick={searchChildRef.current.onWhatsAppClick}
                      />
                    }
                  </div>
                )
              }

              <div className={styles.swipeUpButton} {...handlers}>
                <div>
                  <span>
                    {t('Search.SWIPE_UP')} {filterResults.count} {t('Search.PROPERTIES_LIST')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      </Layout>
    )
  }

  return (
    <Layout
      title={pageTitle}
      keywords={metaData && metaData.meta_keyword}
      description={metaData && metaData.meta_description}
      headerCities={headerMenuLinks}
      footerLinks={getFooterLinks}
      locale={locale}
      metaData={metaData}
      customClass={headerReachedTop ? 'headerRemove' : ''}
      slugQueries={slugQueries}
      pageType='SRP List'
    >
      {schedulePropertyTour && (
        <SchedulePropertyTour
          pageType={mapView ? (listView && !isDesktop ? 'SRP-List' : 'SRP-Map') : 'SRP-List'}
          isCompound={propertyDetails.isCompound}
          propertyDetails={propertyDetails}
          onClickPositive={() => onCalendarClick()}
          onClickNegative={() => onCalendarClick()}
        />
      )}
      <div className={styles.searchPageContainer}>
        {/* start for desktop without map */}
        {commonNewFilter()}
        {/* end for desktop without map */}
        {/* start for mobile view without map */}
        <div className={`${styles.forMobile}`}>{mobileViewFilter()}</div>
        {/* end for mobile view without map */}
        <div className={styles.listViewSec}>
          {filterResults?.properties?.length ? (
            <GridView
              pageTitle={pageTitle}
              isMobile={isMobile}
              swipeHandler={swipeHandler}
              isTablet={isTablet}
              switchView={switchView}
              totalCount={filterResults.count}
              filterResults={filterResults}
              onSortBySelection={(selectedItem) => onSortBySelection(selectedItem)}
              locale={locale}
              reqHeaders={reqHeaders}
              mapView={mapView}
              searchParams={searchParams}
              filterPayload={filterPayload}
              reference_url={metaData ? metaData.reference_url : null}
              onCalendarClick={onCalendarClick}
              updateSearchParams={(params) => {
                setSearchParams({ ...searchParams, ...params, timestamp: new Date().getTime() })
              }}
              cityId={payload?.cityId || null}
              listView={listView}
              metaData={metaData}
              userSelectedCity={userSelectedCity}
              userSelectedZone={userSelectedZone}
              scrollPosition={scrollPosition}
              onCardClick={onCardClick}
              slugQueries={slugQueries}
            />
          ) : routerParams?.countryId == 1 ? (
            <Error404
              selectedValue={userSelectedCity}
              image='/images/404-image.svg'
              heading='ContentErrorPage.CANT_FIND_PAGE'
              alt='ContentErrorPage.NOT_FOUND'
              cityOptions={cityPayload}
              handleItemClick={(item) => handleCityChange(item)}
              inputId='error-input-view-list'
            />
          ) : (
            <PageNotFound
              imgType={'imgNotFound'}
              heading={t('PageNotFound.NO_RESULT')}
              subscript={t('PageNotFound.SUB_SCRIPT')}
              text1={t('PageNotFound.TEXT1')}
              text2={t('PageNotFound.TEXT2')}
              clearSearchUrl={onClearClick}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SearchPage
