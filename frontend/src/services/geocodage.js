const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'

export async function rechercherAdresse({ latitude, longitude }) {
  const url = new URL(NOMINATIM_REVERSE_URL)
  url.search = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '14',
    addressdetails: '1',
    'accept-language': 'fr'
  }).toString()

  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('Le service de localisation est temporairement indisponible.')

  const result = await response.json()
  const address = result.address || {}

  return {
    ville: address.city || address.town || address.municipality || address.village || address.county || '',
    quartier: address.suburb || address.neighbourhood || address.quarter || address.city_district || address.hamlet || ''
  }
}
