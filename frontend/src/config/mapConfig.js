// Configuration Cartographique Greenshot (Leaflet + CARTO Basemaps)
import pinEnAttente from '../assets/map-icons/pin-en-attente.svg'
import pinVu from '../assets/map-icons/pin-vu.svg'
import pinNettoye from '../assets/map-icons/pin-nettoye.svg'
import pinTraite from '../assets/map-icons/pin-traite.svg'

export const MAP_CONFIG = {
  // Centre par défaut : Bujumbura, Burundi
  defaultCenter: [-3.3822, 29.3644],
  defaultZoom: 13,
  minZoom: 7,
  maxZoom: 19,

  // Fournisseurs de tuiles CARTO gratuits (sans clé API)
  tileLayers: {
    darkMatter: {
      name: 'Sombre (Dark Matter)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    voyager: {
      name: 'Clair (Voyager)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }
  },

  // Configuration des statuts Greenshot
  statusConfig: {
    'en_attente': {
      color: '#B5502F', // Terre cuite
      label: 'En attente',
      bgLight: '#FBEBE8',
      description: 'Signalement transmis, en attente de vérification',
      iconUrl: pinEnAttente
    },
    'vu': {
      color: '#3E7CA6', // Ciel
      label: 'Vu / Confirmé',
      bgLight: '#EBF4F9',
      description: 'Problème constaté et pris en compte',
      iconUrl: pinVu
    },
    'nettoye': {
      color: '#E8A33D', // Ambre
      label: 'Nettoyé (preuve soumise)',
      bgLight: '#FDF6EB',
      description: 'Nettoyé par un citoyen, photo après fournie',
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
