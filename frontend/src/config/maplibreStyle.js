// Style MapLibre repeint entièrement dans la palette Greenshot.
// Couleurs issues de index.html — voir DESIGN-Greenshot.md.
// Aucune couleur d'OpenFreeMap n'est conservée : le style est entièrement local.

export const TUILES = {
  url: 'https://tiles.openfreemap.org/planet',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
}

export const PALETTE = {
  forest: '#122314',
  forestDeep: '#0a1509',
  panel: '#172a19',
  moss: '#273f2b',
  sprout: '#68ef3f',
  verdant: '#26a200',
  fern: '#b7bda5',
  lichen: '#a7ac9a',
  white: '#ffffff',
  water: '#16303a',
  building: '#1e3520'
}

export function creerStyle() {
  return {
    version: 8,
    glyphs: TUILES.glyphs,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: TUILES.url
      }
    },
    layers: [
      // Fond
      {
        id: 'bg',
        type: 'background',
        paint: { 'background-color': PALETTE.forestDeep }
      },
      // Couverture du sol : la campagne reste sombre, on ne distingue
      // que par une légère variation de vert.
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        paint: {
          'fill-color': [
            'match',
            ['get', 'class'],
            ['wood', 'grass', 'farmland', 'scrub'], PALETTE.moss,
            ['ice'], PALETTE.water,
            PALETTE.forest
          ],
          'fill-opacity': 0.35
        }
      },
      // Eau : bleu-vert sombre, lisible sans concurrencer les épingles
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': PALETTE.water }
      },
      {
        id: 'river',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        minzoom: 8,
        paint: {
          'line-color': '#1e4a52',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.6]
        }
      },
      // Frontières : le contour du Burundi est l'élément d'orientation principal
      {
        id: 'boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        minzoom: 5,
        paint: {
          'line-color': PALETTE.verdant,
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 12, 1.8],
          'line-opacity': 0.75
        }
      },
      {
        id: 'boundary-country',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['==', ['get', 'kind'], 'country'],
        minzoom: 4,
        paint: {
          'line-color': PALETTE.sprout,
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1, 10, 2.4],
          'line-opacity': 0.9
        }
      },
      // Réseau routier : très discret, il sert à se repérer, pas à primer.
      {
        id: 'transportation',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 12,
        paint: {
          'line-color': '#2c4630',
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.3, 16, 1.2],
          'line-opacity': 0.7
        }
      },
      // Bâtiments en relief : visible seulement à partir du zoom 14.
      // C'est ce qui donne l'effet maquette en vue 3D.
      {
        id: 'building',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': PALETTE.building,
          'fill-extrusion-height': ['get', 'render_height'],
          'fill-extrusion-base': ['get', 'render_min_height'],
          'fill-extrusion-opacity': 0.85
        }
      },
      // Noms de rues : seulement quand c'est lisible, sinon bruit visuel
      {
        id: 'place-labels',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 9,
        filter: ['<=', ['coalesce', ['get', 'rank'], 99], 30],
        layout: {
          'text-field': ['get', 'name:latin'],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 9, 11, 16, 15],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.06
        },
        paint: {
          'text-color': PALETTE.lichen,
          'text-halo-color': PALETTE.forestDeep,
          'text-halo-width': 1.4
        }
      },
      {
        id: 'street-labels',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'text-field': ['get', 'name:latin'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10,
          'symbol-placement': 'line'
        },
        paint: {
          'text-color': PALETTE.fern,
          'text-halo-color': PALETTE.forestDeep,
          'text-halo-width': 1.3,
          'text-opacity': 0.85
        }
      }
    ]
  }
}

// Source GeoJSON des épingles de signalement.
export const SOURCE_PINS = 'greenshot-pins'

// Couleurs par statut — identiques à mapConfig.js et à PRODUCT.md.
export const COULEUR_STATUT = {
  en_attente: '#B5502F',
  vu: '#3E7CA6',
  nettoye: '#E8A33D',
  traite: '#1F4D3A'
}

// Regroupement par distance, en pur JS : pas de dépendance supercluster,
// le poids reste constant. Distance en pixels d'écran, donc stable
// quel que soit le zoom.
export function regrouper(points, distancePx = 46) {
  const grappes = []

  for (const p of points) {
    let cible = null

    for (const g of grappes) {
      const dx = g.x - p.x
      const dy = g.y - p.y
      if (dx * dx + dy * dy <= distancePx * distancePx) {
        cible = g
        break
      }
    }

    if (cible) {
      cible.membres.push(p)
      cible.x = cible.membres.reduce((s, m) => s + m.x, 0) / cible.membres.length
      cible.y = cible.membres.reduce((s, m) => s + m.y, 0) / cible.membres.length
    } else {
      grappes.push({ x: p.x, y: p.y, membres: [p] })
    }
  }

  return grappes
}

// Conversion coordonnées -> pixels écran, pour le regroupement.
export function projeter(map, coords) {
  const p = map.project(coords)
  return { x: p.x, y: p.y }
}