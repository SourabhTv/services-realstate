import React, { useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import useTranslation from 'next-translate/useTranslation'

// Import Components
import Layout from '../Common/Layout/Layout'
import PropertyHero from '../PropertyHero'
import BreadCrumbs from '../Breadrumbs/Breadcrumbs'
import PropertyTitle from '../PropertyTitle/PropertyTitle'
import PropertyAttributes from '../PropertyAttributes/PropertyAttributes'
import ListWithIcons from '../ListWithIcons/ListWithIcons'
import SeeMoreToggle from '../SeeMoreToggle/SeeMoreToggle'

import PlaceBidDesktop from '@/hoc/components/Auction/PlaceBidDesktop'
import AuctionHistory from '@/hoc/components/Auction/AuctionHistory'
import ContactUs from '@/hoc/components/Auction/ContactUs'
import TermNCond from '@/hoc/components/Auction/TermNCond'
import PropertyInMap from '../PropertyDetails/PropertyInMap'
// import StickyPlaceBidHeader from '@/hoc/components/Auction/StickyPlaceBidHeader'

// Import Styles
import styles from './styles.module.scss'

/**
 * Auction Details Component
 * @param {*} props
 * @returns AuctionDetails Component
 */
const AuctionDetails = ({ auctionDetails, headerMenuLinks, homeFooter }) => {
  // Estract Data from props
  const { property, tag, status, onwedBy, auctionId, disclaimer } = auctionDetails
  const { propertyInfo, attributes, iconBaseURL } = property
  const { city, zone, district, propertyFor, title, propertySubType, amenities, fittings } = propertyInfo

  const [visibleAmenities, setVisibleAmenities] = useState(amenities.slice(0, 5))
  const [visibleFittings, setVisibleFittings] = useState(fittings.slice(0, 5))

  const toggleSeeMore = (e, name, currentState) => {
    e.preventDefault()
    if (!name) return
    if (name === 'amenities-and-fittings') {
      if (!currentState) {
        setVisibleAmenities(amenities)
        setVisibleFittings(fittings)
      } else {
        setVisibleAmenities(amenities.slice(0, 5))
        setVisibleFittings(fittings.slice(0, 5))
      }
      setAmenitiesAndFittingsExpanded(!currentState)
    }
    if (name === 'amenities') {
      if (!currentState) {
        setVisibleAmenities(amenities)
      } else {
        setVisibleAmenities(amenities.slice(0, 5))
      }
      setAmenitiesExpanded(!currentState)
    }
    if (name === 'fittings') {
      if (!currentState) {
        setVisibleAmenities(fittings)
      } else {
        setVisibleAmenities(fittings.slice(0, 5))
      }
      setAmenitiesExpanded(!currentState)
    }
  }

  // Translation
  const { t, lang } = useTranslation('translations')

  // Check for MediaQuery
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 980 })
  const isMobile = useMediaQuery({ maxWidth: 640 })
  // console.log('isMobile', isMobile)
  return (
    <Layout headerCities={headerMenuLinks} footerLinks={homeFooter} currentPage='prppertyDetail'>
      <PropertyHero
        status={status}
        propertyId={property?.id}
        badge={onwedBy}
        tags={tag?.split(',')}
        propertyFiles={property?.propertyFiles}
      />

      {!isMobile && (
        <div className={styles.breadcrumbContainer}>
          {/* {console.log('issss', isMobile)} */}
          <BreadCrumbs data={breadcrumbsData({ city, zone, district, propertyFor, title })} />
        </div>
      )}

      <div className={styles.main}>
        <div className={styles.content}>
          {title && <PropertyTitle subtitle={propertySubType} title={title} />}
          {attributes && (
            <div className={styles.section}>
              <PropertyAttributes attributes={attributes} iconUrl={iconBaseURL} />
            </div>
          )}
          {/* Amenities & Fittings */}
          {(visibleAmenities.length > 0 || visibleFittings.length > 0) && (
            <div className={styles.section}>
              <h4 className={styles.section__subtitle}>WHAT THIS PLACE OFFERS</h4>
              <div className={styles.container__two_col}>
                <ListWithIcons
                  list={visibleAmenities || []}
                  title={t('Details.FEATURES_AND_AMENITIES')}
                  seeMore={isMobile && amenities?.length > 5}
                  iconUrl={iconBaseURL}
                  locale={lang}
                  handleSeeMore={toggleSeeMore}
                  seeMoreName='amenities'
                />
                <ListWithIcons
                  list={visibleFittings || []}
                  title={t('Details.FIXTURES_AND_FITTINGS')}
                  seeMore={isMobile && fittings?.length > 5}
                  iconUrl={iconBaseURL}
                  locale={lang}
                  handleSeeMore={toggleSeeMore}
                  seeMoreName='fittings'
                />
              </div>
              {!isMobile && (amenities?.length > 5 || fittings?.length > 5) && (
                <SeeMoreToggle
                  isExpanded={visibleAmenities?.length > 5 || visibleAmenities?.length > 5}
                  toggleHandler={toggleSeeMore}
                  name='amenities-and-fittings'
                />
              )}
            </div>
          )}

          <AuctionHistory auctionId={auctionId} />
          {/* <PlaceBidModal /> */}
        </div>
        <div className={styles.sideBar}>
          <PlaceBidDesktop auctionDetails={auctionDetails} />
        </div>
      </div>
      <div className={styles.mapContainer}>
        <PropertyInMap propertyDetails={property} />
      </div>
      <div className={styles.staticContent}>
        <TermNCond content={disclaimer} />
        <ContactUs />
      </div>
      {/* {isMobileView ? <PlaceBid /> : null} */}
    </Layout>
  )
}

export default AuctionDetails

const breadcrumbsData = (data) => {
  const { city, zone, district, propertyFor, title } = data
  const array = [
    {
      label: 'Home',
      url: '/',
    },
  ]
  if (city && propertyFor) {
    array.push({
      label: city,
      url: `/properties-for-${propertyFor}-in-${city}`,
    })
  }
  if (zone && propertyFor) {
    array.push({
      label: zone,
      url: `/properties-for-${propertyFor}-in-${zone}`,
    })
  }
  if (district && propertyFor) {
    array.push({
      label: district,
      url: `/properties-for-${propertyFor}-in-${district}`,
    })
  }
  if (title) array.push({ label: title })
  return array
}
