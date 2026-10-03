/* ═══════════════════════════════════════════════════════════
   GREENSHOT — content.js
   ► SEUL FICHIER À MODIFIER POUR FAIRE VIVRE LE SITE.
     Tout le texte, tous les visuels, tous les chiffres.
   ► La partie « injection » en bas est le moteur de remplissage :
     elle ne se modifie JAMAIS (une seule exception documentée :
     le pied de page accepte une cible d'app au lieu d'un mailto).
   ═══════════════════════════════════════════════════════════ */

/* Adresse de l'application Greenshot.
   TODO LANCEMENT : remplacer par l'URL publique. today = dev local. */
const APP_URL = 'http://localhost:5173'

const SITE_CONTENT = {

  brand: {
    name: 'Greenshot',
    title: 'Greenshot — L'app citoyenne du Burundi',
    description: 'Une photo, une rue, un signalement géolocalisé. Greenshot transforme les déchets signalés par les citoyens en données environnementales fiables pour le Burundi.',
    kicker: 'CLIMATECH — BUJUMBURA, BURUNDI',
    copyright: '© 2026 — BUJUMBURA, BURUNDI',
    signature: 'ÉCLAIREURS DE QUARTIER',
    socials: [
      { label: 'OUVRIR L\'APPLICATION ↗', url: APP_URL }
    ]
  },

  /* 2 ancres + CTA du header — un mot chacun, CAPS */
  nav: { proof: 'MÉCANISMES', universes: '3 GESTES', cta: 'SIGNALER' },

  /* 1 · ACCROCHE — « line1 / line2a [image qui naît et devient
     plein écran] line2b ». Total line2a+line2b : court (nowrap). */
  hook: {
    line1: 'Une photo, un geste,',
    line2a: 'un quartier',
    line2b: 'qui respire.',
    image: '/images/hero.jpg',                       // 3:2 — 1800×1200
    imageAlt: 'Un Éclaireur ramasse des déchets plastiques au bord d’une rue de Bujumbura',
    floaters: [                                     // 10 visuels du pasteboard
      '/images/f01.jpg',
      '/images/f02.jpg',
      '/images/f03.jpg',
      '/images/f04.jpg',
      '/images/f05.jpg',
      '/images/f06.jpg',
      '/images/f07.jpg',
      '/images/f08.jpg',
      '/images/f09.jpg',
      '/images/f10.jpg'
    ]
  },

  /* 2 · POSITIONNEMENT — ≤ 42 caractères (affiché nowrap, en blanc
     sur l'image plein écran) */
  positioning: 'Un déchet, une rue, une preuve.',

  /* 3 · DÉMARCHE — [[…]] = ce qu'entoure l'ovale dessiné :
     2 à 3 MOTS MAXIMUM. */
  manifesto: {
    text: 'La plupart des déchets ne disparaissent pas seuls : ils restent là parce que personne ne les a vus. Greenshot transforme un regard en signalement géolocalisé, puis en [[preuve vérifiable]]. C’est de la donnée, pas de l’intention.'
  },

  /* 4 · PREUVE — bento : 4 mécanismes, tailles big / tall / tall / big */
  proof: {
    layout: 'bento',
    kicker: 'CE QUE L’APPLI FAIT',
    title: 'Quatre mécanismes, pas un programme',
    sub: 'Pas de formulaire à remplir, pas de jargon : quatre mécanismes qui rendent chaque geste vérifiable.',
    meta: 'QUATRE MÉCANISMES — V1 EN TEST À BUJUMBURA',
    features: [
      { size: 'big',  illu: '/illustrations/fe-1.svg', title: 'La photo propose, vous tranchez', meta: 'CATÉGORIE — PROPOSÉE PUIS CORRIGÉE' },
      { size: 'tall', illu: '/illustrations/fe-2.svg', title: 'La rue est géolocalisée', meta: 'CARTE — VOS QUARTIERS EN DIRECT' },
      { size: 'tall', illu: '/illustrations/fe-3.svg', title: 'Le nettoyage se prouve', meta: 'AVANT / APRÈS — DISTANCE MESURÉE' },
      { size: 'big',  illu: '/illustrations/fe-4.svg', title: 'Le score se cumule, le quartier se classe', meta: 'NIVEAUX — CLASSEMENT PAR QUARTIER' }
    ]
  },

  /* 5 · DEVISE — 3 mots (train horizontal scrubé), hint d'une ligne */
  motto: {
    kicker: 'TROIS MOTS QUI TIENNENT TOUT LE RESTE',
    words: [
      { word: 'PHOTO', hint: 'Une image vaut mieux qu’un rapport.' },
      { word: 'PREUVE', hint: 'Avant, après, et ce qui a changé.' },
      { word: 'QUARTIER', hint: 'La donnée sert ceux qui nettoient.' }
    ]
  },

  /* 6-7 · PROCESSUS — « introA introB [visuel] introC » puis les étapes.
     Scène 100 % TYPOGRAPHIQUE : la SEULE image est celle du zoom. */
  universes: {
    introA: 'Un',
    introB: 'déchet,',
    introC: '3 gestes.',
    cta: 'Créer mon compte →',
    image: '/images/universes.jpg',                   // 1800×1200
    items: [
      { name: 'Photographiez', meta: 'GESTE — 01', desc: 'Une photo, un type de déchet, une rue. Greenshot propose la catégorie, vous corrigez si elle se trompe.' },
      { name: 'Faites valider', meta: 'GESTE — 02', desc: 'Un Éclaireur vérifie sur place. Le lieu passe en « nettoyé » quand la photo le prouve, et seulement là.' },
      { name: 'Montez de niveau', meta: 'GESTE — 03', desc: 'Signalement et nettoyage rapportent des points. Le quartier entier avance dans le classement.' }
    ]
  },

  /* 8 · PREUVE SOCIALE — une Éclaireuse parle.
     INVENTÉ : à remplacer par un vrai témoignage avant publication.
     quote : UNE ou DEUX phrases, COMPLÈTES et AUTONOMES, sans guillemets. */
  testimonial: {
    kicker: 'ÉCLAIREUSE — QUARTIER GATAGARA',
    figure: '+212',
    unit: 'pts',
    quote: 'Je ne pensais pas publier mes photos. Au bout de trois semaines, j’avais 212 points et mon quartier savait quoi ramasser en premier.',
    author: 'NADIA — ÉCLAIREUSE, BUJUMBURA'
  },

  /* 9 · OBJECTIONS — 3 freins + la chute (pill = mot entouré) */
  objections: {
    items: ['Pas de formulaire à remplir.', 'Pas de signalement fantôme.', 'Pas de point sans preuve.'],
    finale: 'Juste des rues,',
    pill: 'plus propres.'
  },

  /* 10 · CONVERSION — pas d'e-mail : CTA vers l'application.
     Si un jour une boîte contact@greenshot.bi existe, remplacer
     appUrl/appLabel par `email: 'contact@greenshot.bi'`. */
  contact: {
    kicker: 'UNE PHOTO, ÇA SUFFIT',
    appUrl: APP_URL,
    appLabel: 'Ouvrir Greenshot →',
    email: '',
    reassurance: 'GRATUIT — DONNÉES GÉOLOCALISÉES — BUJUMBURA D’ABORD'
  },

  /* traînée sous la souris (finale) — 20 visuels, petits formats mixtes */
  trail: [
    '/images/t01.jpg', '/images/t02.jpg', '/images/t03.jpg', '/images/t04.jpg',
    '/images/t05.jpg', '/images/t06.jpg', '/images/t07.jpg', '/images/t08.jpg',
    '/images/t09.jpg', '/images/t10.jpg', '/images/t11.jpg', '/images/t12.jpg',
    '/images/t13.jpg', '/images/t14.jpg', '/images/t15.jpg', '/images/t16.jpg',
    '/images/t17.jpg', '/images/t18.jpg', '/images/t19.jpg', '/images/t20.jpg'
  ]
}

export default SITE_CONTENT;

/* ═══════════════════════════════════════════════════════════
   INJECTION — NE PAS MODIFIER (remplit le DOM après le montage Vue)
   Seule exception, documentée : le pied de page accepte soit une
   adresse e-mail (mailto), soit une URL d'application — le champ
   `contact.email` seul produirait un lien mailto mort.
   ═══════════════════════════════════════════════════════════ */
export function injectSiteContent(root = document) {
  const C = SITE_CONTENT;
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };

  document.title = C.brand.title;
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', C.brand.description);

  // chrome
  set('.loader-wordmark', C.brand.name);
  set('.dock-wordmark', C.brand.name);
  set('.dock-link[href="#travaux"]', C.nav.proof);
  set('.dock-link[href="#explorer"]', C.nav.universes);
  set('.dock-cta', C.nav.cta);

  // 1 · accroche
  set('#heroKicker', C.brand.kicker);
  set('#heroLine1', C.hook.line1);
  const hls = $$('#heroLine2 .hl');
  if (hls.length === 2) { hls[0].textContent = C.hook.line2a; hls[1].textContent = C.hook.line2b; }
  const g1 = $('#grow1 img');
  if (g1) { g1.src = C.hook.image; g1.alt = C.hook.imageAlt; }
  $$('.floaters .fl img').forEach((img, i) => { if (C.hook.floaters[i]) img.src = C.hook.floaters[i]; });

  // 2 · positionnement (un span par mot)
  const intro = $('#spotIntro');
  if (intro) intro.innerHTML = C.positioning.split(' ').map((w) => `<span>${w}</span>`).join(' ');

  // 3 · démarche
  const fill = $('#fillText');
  if (fill) {
    fill.innerHTML = C.manifesto.text.replace(
      /\[\[(.+?)\]\]/,
      '<span class="boxed" id="boxedPhrase">$1<svg class="box-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="boxPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>'
    );
  }

  // 4 · preuve : masonry (8 photos) ou bento (4 features big/tall/tall/big)
  const head = $$('.coll-head > *');
  if (head.length === 4) {
    head[0].textContent = C.proof.kicker;
    head[1].textContent = C.proof.title;
    head[2].textContent = C.proof.sub;
    head[3].textContent = C.proof.meta;
  }
  const grid = $('#collGrid');
  if (grid && C.proof.layout === 'bento') {
    grid.className = 'bento-grid';
    grid.innerHTML = C.proof.features.map((f) =>
      `<figure class="card${f.size ? ' b-' + f.size : ''}"><div class="card-img"><img src="${f.illu}" alt="${f.title}"></div><figcaption>${f.title}<span class="mono">${f.meta}</span></figcaption></figure>`
    ).join('');
  } else if (grid) {
    grid.className = 'coll-grid';
    const SPEEDS = [-0.05, 0.06, -0.028, 0.085];
    grid.innerHTML = SPEEDS.map((s, ci) =>
      `<div class="col" data-pspeed="${s}">` +
      C.proof.projects.slice(ci * 2, ci * 2 + 2).map((p) =>
        `<figure class="card"><div class="card-img"><img src="${p.img}" alt="${p.title} — ${p.meta}"></div><figcaption>${p.title}<span class="mono">${p.meta}</span></figcaption></figure>`
      ).join('') + '</div>'
    ).join('');
  }

  // 5 · devise (train de mots-clés)
  set('#mottoKicker', C.motto.kicker);
  const mtrack = $('#mottoTrack');
  if (mtrack) mtrack.innerHTML = C.motto.words.map((w) => `<span class="mw">${w.word}</span>`).join('');

  // 6-7 · processus immersif (visuels posés un à un)
  set('#nw1', C.universes.introA);
  set('#nw2', C.universes.introB);
  set('#nw3', C.universes.introC);
  const g2 = $('#grow2 img');
  if (g2) g2.src = C.universes.image || (C.universes.items[0] || {}).img || g2.src;
  const psteps = $('#psteps');
  if (psteps) {
    psteps.innerHTML = C.universes.items.map((u) =>
      `<div class="pstep"><span class="pstep-meta mono ash">${u.meta}</span><h3>${u.name}</h3><p>${u.desc || ''}</p></div>`
    ).join('');
  }
  const sCta = $('#stepsCtaLink');
  if (sCta) sCta.childNodes[0].textContent = C.universes.cta;

  // 8 · preuve sociale — le chiffre qui frappe
  set('#figKicker', C.testimonial.kicker || '');
  const figM = String(C.testimonial.figure || '').trim().match(/^([^0-9.,+\u2212-]*[+\u2212-]?)\s*(-?[0-9.,]+)/);
  set('#figPre', figM ? figM[1] : '');
  set('#figVal', figM ? figM[2] : '');
  set('#figUnit', C.testimonial.unit || '');
  set('#quoteText', C.testimonial.quote);
  set('#quoteAuthor', C.testimonial.author);

  // 9 · objections
  C.objections.items.forEach((t, i) => set('#fs' + (i + 1), t));
  const fs4 = $('#fs4');
  if (fs4) {
    fs4.innerHTML = `${C.objections.finale} <span class="pill" id="pillPhrase">${C.objections.pill}<svg class="pill-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="pillPath" d="M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z"/></svg></span>`;
  }
  $$('#trail img').forEach((img, i) => { if (C.trail[i % C.trail.length]) img.src = C.trail[i % C.trail.length]; });

  // 10 · conversion — cible = app si elle est fournie, sinon mailto
  set('.footer-kicker', C.contact.kicker);
  const mail = $('.footer-mail');
  if (mail) {
    const toApp = !!C.contact.appUrl;
    mail.href = toApp ? C.contact.appUrl : 'mailto:' + C.contact.email;
    const label = mail.querySelector('.footer-mail-text');
    if (label) label.textContent = toApp ? C.contact.appLabel : C.contact.email;
  }
  set('.footer-reassurance', C.contact.reassurance);
  const fname = $('#footerName');
  if (fname) { fname.textContent = C.brand.name; fname.setAttribute('aria-label', C.brand.name); }
  const bottom = $$('.footer-bottom > p');
  if (bottom.length === 3) {
    bottom[0].textContent = C.brand.copyright;
    bottom[1].innerHTML = C.brand.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('&nbsp;&nbsp;&nbsp;');
    bottom[2].textContent = C.brand.signature;
  }
}