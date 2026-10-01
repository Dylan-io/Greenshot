// Configuration Cartographique Greenshot (Leaflet + CARTO Basemaps)
import pinEnAttente from '../assets/map-icons/pin-en-attente.svg'
import pinVu from '../assets/map-icons/pin-vu.svg'
import pinNettoye from '../assets/map-icons/pin-nettoye.svg'
import pinTraite from '../assets/map-icons/pin-traite.svg'

export const MAP_CONFIG = {
  // Centre par défaut : Bujumbura, Burundi
  defaultCenter: [-3.3822, 29.3644],
  defaultZoom: 12,
  minZoom: 7,
  maxZoom: 19,

  // Fournisseurs de tuiles CARTO Voyager (Clair, gratuit, sans clé API)
  tileLayers: {
    voyager: {
      name: 'CARTO Voyager (Clair)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },

  // Configuration des 4 statuts Greenshot
  statusConfig: {
    'en_attente': {
      color: '#B5502F', // Terre cuite
      label: 'En attente',
      bgLight: '#FDF0EC',
      description: 'Signalement en attente de prise en charge',
      iconUrl: pinEnAttente
    },
    'vu': {
      color: '#3E7CA6', // Ciel
      label: 'Vu / Confirmé',
      bgLight: '#EBF4F9',
      description: 'Problème constaté et validé',
      iconUrl: pinVu
    },
    'nettoye': {
      color: '#E8A33D', // Ambre
      label: 'Nettoyé',
      bgLight: '#FDF6EB',
      description: 'Nettoyé par un citoyen, preuve soumise',
      iconUrl: pinNettoye
    },
    'traite': {
      color: '#1F4D3A', // Forêt
      label: 'Traité & Validé',
      bgLight: '#E8F2ED',
      description: 'Zone assainie et clôturée',
      iconUrl: pinTraite
    }
  }
}

/**
 * Normalise un statut (gère avec ou sans underscore)
 */
export function normaliserStatut(statut) {
  if (!statut) return 'en_attente'
  const s = statut.toLowerCase().replace(/[\s-]/g, '_')
  if (s === 'en_attente' || s === 'vu' || s === 'nettoye' || s === 'traite') {
    return s
  }
  return 'en_attente'
}

/**
 * Calcule la distance en mètres ou km entre 2 coordonnées GPS
 */
export function calculerDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null
  const numLat1 = Number(lat1)
  const numLon1 = Number(lon1)
  const numLat2 = Number(lat2)
  const numLon2 = Number(lon2)
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return null

  const R = 6371e3 // Rayon de la Terre en mètres
  const dLat = (numLat2 - numLat1) * Math.PI / 180
  const dLon = (numLon2 - numLon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(numLat1 * Math.PI / 180) * Math.cos(numLat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  if (distance < 1000) {
    return `${Math.round(distance)} m`
  }
  return `${(distance / 1000).toFixed(1)} km`
}
