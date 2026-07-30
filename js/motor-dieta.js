/**
 * ============================================
 * LSTYLE-SENIORS-PLUS
 * Motor de dieta local (Fase 3)
 * ============================================
 *
 * Genera un menú de 2 setmanes (14 dies × 5 àpats) sense IA externa.
 * El pla comença sempre en dilluns (el proper si cal).
 * Plantilles mediterrànies + Dieta del Plat (Harvard HSPH).
 * Filtres: dieta, condicions, al·lèrgies (inclosa text lliure),
 * intoleràncies, estació, TDEE/proteïna.
 *
 * PATRÓ: IIFE — exposa window.motorDieta
 */

'use strict';

const motorDieta = (() => {

    const CAT = {
        CARN: 1, PEIX: 2, FRUITA: 3, VERDURA: 4,
        LACTIC: 5, LLEGUM: 6, CEREAL: 7, FRUIT_SEC: 8, OU: 9
    };

    const APATS = ['esmorzar', 'migMatinar', 'dinar', 'berenar', 'sopar'];

    const NOMS_APATS = {
        esmorzar: 'Esmorzar',
        migMatinar: 'Mig matí',
        dinar: 'Dinar',
        berenar: 'Berenar',
        sopar: 'Sopar'
    };

    const DISTRIBUCIO_KCAL = {
        esmorzar: 0.25,
        migMatinar: 0.10,
        dinar: 0.35,
        berenar: 0.10,
        sopar: 0.20
    };

    const AIGUA_APAT = {
        esmorzar: 200,
        migMatinar: 150,
        dinar: 250,
        berenar: 150,
        sopar: 200
    };

    const DURADA_PLA = 14; // 2 setmanes completes (Dilluns–Diumenge)

    const DIES_SETMANA = [
        'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'
    ];

    /**
     * Cereals per àpat (Dieta del Plat / mediterrània seniors):
     * Esmorzar = pa/civada · Dinar = arròs/pasta/quinoa/patata · Sopar = lleuger
     */
    const CEREALS_ESMORZAR = ['pa ', 'pa integral', 'pa blanc', 'pa de', 'civada', 'flocs'];
    const CEREALS_DINAR = ['arròs', 'pasta', 'quinoa', 'cuscús', 'cous', 'patata', 'moniato'];
    const CEREALS_SOPAR = ['arròs', 'patata', 'quinoa', 'moniato'];

    const PARAULES_MARISC = ['gamb', 'cloïss', 'muscl', 'calamar', 'pop', 'marisc', 'llagost', 'cranc'];

    const PORCIONS = {
        [CAT.CARN]: 120,
        [CAT.PEIX]: 130,
        [CAT.FRUITA]: 130,
        [CAT.VERDURA]: 180,
        [CAT.LACTIC]: 150,
        [CAT.LLEGUM]: 180,
        [CAT.CEREAL]: 100,
        [CAT.FRUIT_SEC]: 25,
        [CAT.OU]: 60
    };

    const PARAULES_GLUTEN = ['pa ', 'pasta', 'civada', 'sègol', 'blat', 'cuscús', 'cous'];

    /** Ordre de categories a la llista de la compra */
    const ORDRE_COMPRA = [
        CAT.PEIX, CAT.CARN, CAT.LLEGUM, CAT.OU,
        CAT.LACTIC, CAT.VERDURA, CAT.FRUITA, CAT.CEREAL, CAT.FRUIT_SEC
    ];

    const NOMS_CATEGORIES = {
        [CAT.PEIX]: 'Peix i marisc',
        [CAT.CARN]: 'Carns',
        [CAT.LLEGUM]: 'Llegums',
        [CAT.OU]: 'Ous',
        [CAT.LACTIC]: 'Làctics',
        [CAT.VERDURA]: 'Verdures',
        [CAT.FRUITA]: 'Fruites',
        [CAT.CEREAL]: 'Cereals i guarnicions',
        [CAT.FRUIT_SEC]: 'Fruits secs'
    };

    // ============================================
    // GENERACIÓ PRINCIPAL
    // ============================================

    function generarMenuSetmanal(dadesUsuari, resultats, dadesApp, opcions = {}) {
        const estacioId = obtenirEstacioId(dadesApp);
        const estacio = (dadesApp.estacions || []).find((e) => e.id === estacioId);
        const pools = crearPools(dadesApp.aliments || [], dadesUsuari, estacioId);
        // seedOffset: canvia amb «Nou menú» per obtenir combinacions diferents
        const seedOffset = Number.isFinite(opcions.seedOffset)
            ? opcions.seedOffset
            : (Date.now() % 9973);

        const objectius = {
            kcalDiaries: resultats.tdee,
            proteinaDiaria: resultats.proteina,
            hidratacio: resultats.hidratacio
        };

        const menuSetmana = [];
        const historialProteines = [];

        for (let dia = 0; dia < DURADA_PLA; dia++) {
            const diaMenu = generarDia(dia, pools, objectius, dadesUsuari, historialProteines, seedOffset);
            menuSetmana.push(diaMenu);

            const protDinar = diaMenu.dinar.ingredients.find((i) =>
                [CAT.CARN, CAT.PEIX, CAT.LLEGUM, CAT.OU].includes(i.categoriaId)
            );
            if (protDinar) {
                historialProteines.push(protDinar.id);
                if (historialProteines.length > 3) historialProteines.shift();
            }
        }

        return {
            menuSetmana,
            llistaCompra: generarLlistaCompra(menuSetmana),
            resum: calcularResumSetmanal(menuSetmana, objectius),
            estacio: estacio?.nombre_ca || 'Temporada actual',
            objectius,
            seedOffset
        };
    }

    // ============================================
    // FILTRATGE
    // ============================================

    function crearPools(totsAliments, dadesUsuari, estacioId) {
        const filtrats = totsAliments.filter((a) => esAlimentPermes(a, dadesUsuari));
        const pools = {};
        Object.values(CAT).forEach((catId) => {
            const delaCategoria = filtrats.filter((a) => a.categoria_id === catId);
            const deTemporada = delaCategoria.filter((a) => a.estacion_id === estacioId);
            const base = deTemporada.length >= 3 ? deTemporada : delaCategoria;
            // Un sol aliment per nom (evita "Ou sencer" × 4 estacions a la compra)
            pools[catId] = deduplicarAliments(base);
        });
        return pools;
    }

    /** Clau única per nom (sense accents ni sufix estacional) */
    function clauCompra(nom) {
        return normalitzarText(nom)
            .replace(/\s+(hivern|primavera|estiu|tardor)$/i, '')
            .trim();
    }

    function deduplicarAliments(llista) {
        const mapa = new Map();
        (llista || []).forEach((a) => {
            const k = clauCompra(a.nombre_ca);
            if (k && !mapa.has(k)) mapa.set(k, a);
        });
        return [...mapa.values()];
    }

    function esAlimentPermes(aliment, dades) {
        const codis = dades.condicionsCodis || [];
        const dieta = dades.dieta || 'omnivora';
        const intolerancies = dades.intolerancies || [];
        const alergies = dades.alergies || [];
        const alergiesAltres = dades.alergiesAltres || [];
        const nom = (aliment.nombre_ca || '').toLowerCase();

        if ((codis.includes('DIABETES') || codis.includes('AZUCAR')) && aliment.evitar_diabetes) return false;
        if (codis.includes('HIPERTENSION') && aliment.evitar_hipertension) return false;
        if (codis.includes('COLESTEROL') && aliment.evitar_colesterol) return false;

        if (dieta === 'vegetariana' || dieta === 'vegana') {
            if (!aliment.apto_vegetariano) return false;
            if ([CAT.CARN, CAT.PEIX].includes(aliment.categoria_id)) return false;
        }
        if (dieta === 'vegana' && [CAT.LACTIC, CAT.OU].includes(aliment.categoria_id)) return false;

        if (alergies.includes('ou') && aliment.categoria_id === CAT.OU) return false;
        if (alergies.includes('peix') && esPeix(aliment)) return false;
        if (alergies.includes('marisc') && esMarisc(aliment)) return false;
        if (alergies.includes('lactics') && aliment.categoria_id === CAT.LACTIC) return false;
        if (alergies.includes('fruits-secs') && aliment.categoria_id === CAT.FRUIT_SEC) return false;
        if (alergies.includes('soja') && (nom.includes('soja') || nom.includes('tofu'))) return false;
        if (alergies.includes('cacauet') && nom.includes('cacauet')) return false;
        if (alergies.includes('sesam') && (nom.includes('sèsam') || nom.includes('sesam'))) return false;

        if (alergiesAltres.some((terme) => coincideixAlergiaPersonalitzada(aliment.nombre_ca, terme))) {
            return false;
        }

        if (intolerancies.includes('lactosa') && aliment.categoria_id === CAT.LACTIC) {
            if (!nom.includes('sense lactosa')) return false;
        }
        if (intolerancies.includes('gluten') && aliment.categoria_id === CAT.CEREAL) {
            if (PARAULES_GLUTEN.some((p) => nom.includes(p))) return false;
        }
        if (intolerancies.includes('fruits-secs') && aliment.categoria_id === CAT.FRUIT_SEC) return false;

        return true;
    }

    function normalitzarText(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Coincideix "maduixes"→Maduixa, "carbaço"→Carbassó, etc. */
    function coincideixAlergiaPersonalitzada(nomAliment, termeUsuari) {
        const alimentN = normalitzarText(nomAliment);
        let terme = normalitzarText(termeUsuari);
        if (!terme || terme.length < 2) return false;

        const sinonims = {
            maduixes: 'maduixa', maduixa: 'maduixa',
            carbaco: 'carbass', carbasso: 'carbass', carbassos: 'carbass',
            carabassa: 'carabass', carabasses: 'carabass',
            cols: 'col',
            tomates: 'tomaquet', tomata: 'tomaquet', tomaquets: 'tomaquet',
            ous: 'ou', peixos: 'peix'
        };
        if (sinonims[terme]) terme = sinonims[terme];

        if (alimentN.includes(terme)) return true;
        if (terme.length <= 3) return alimentN.split(' ').includes(terme);
        return alimentN.includes(terme.slice(0, Math.min(6, terme.length)));
    }

    function esPeix(aliment) {
        return aliment.categoria_id === CAT.PEIX && !esMarisc(aliment);
    }

    function esMarisc(aliment) {
        if (aliment.categoria_id !== CAT.PEIX) return false;
        const nom = (aliment.nombre_ca || '').toLowerCase();
        return PARAULES_MARISC.some((p) => nom.includes(p));
    }

    function esAlimentAdequatPerApat(aliment, tipusApat) {
        const cat = aliment.categoria_id;
        const nom = (aliment.nombre_ca || '').toLowerCase();

        switch (tipusApat) {
            case 'esmorzar':
                if ([CAT.CARN, CAT.PEIX, CAT.LLEGUM, CAT.VERDURA].includes(cat)) return false;
                if (cat === CAT.CEREAL) return CEREALS_ESMORZAR.some((p) => nom.includes(p));
                return [CAT.FRUITA, CAT.LACTIC, CAT.OU, CAT.FRUIT_SEC].includes(cat);
            case 'migMatinar':
                return [CAT.FRUITA, CAT.LACTIC, CAT.FRUIT_SEC].includes(cat);
            case 'dinar':
                if (cat === CAT.FRUIT_SEC) return false;
                if (cat === CAT.CEREAL) return CEREALS_DINAR.some((p) => nom.includes(p));
                return [CAT.CARN, CAT.PEIX, CAT.LLEGUM, CAT.OU, CAT.VERDURA].includes(cat);
            case 'berenar':
                return [CAT.FRUITA, CAT.LACTIC, CAT.FRUIT_SEC].includes(cat);
            case 'sopar':
                if ([CAT.CARN, CAT.FRUIT_SEC, CAT.FRUITA].includes(cat)) return false;
                if (cat === CAT.CEREAL) return CEREALS_SOPAR.some((p) => nom.includes(p));
                return [CAT.PEIX, CAT.LLEGUM, CAT.OU, CAT.LACTIC, CAT.VERDURA].includes(cat);
            default:
                return true;
        }
    }

    function triarPerApat(pool, seed, tipusApat, exclosos = [], usats = null) {
        if (!pool || pool.length === 0) return null;
        const adequats = pool.filter(
            (a) => esAlimentAdequatPerApat(a, tipusApat)
                && !exclosos.includes(a.id)
                && !estaUsat(a, usats)
                && !esAlimentExclosMenu(a)
        );
        if (adequats.length === 0) return null;
        return adequats[seed % adequats.length];
    }

    function triarPreferit(pool, seed, tipusApat, regex, exclosos = [], usats = null) {
        if (!pool || pool.length === 0) return null;
        const adequats = pool.filter(
            (a) => esAlimentAdequatPerApat(a, tipusApat)
                && !exclosos.includes(a.id)
                && !estaUsat(a, usats)
                && !esAlimentExclosMenu(a)
        );
        const preferits = adequats.filter((a) => regex.test(a.nombre_ca || ''));
        const base = preferits.length > 0 ? preferits : adequats;
        if (base.length === 0) return null;
        return base[seed % base.length];
    }

    function estaUsat(aliment, usats) {
        if (!usats || !aliment) return false;
        if (usats.ids.has(aliment.id)) return true;
        return usats.claus.has(clauCompra(aliment.nombre_ca));
    }

    function marcarUsat(usats, aliment) {
        if (!usats || !aliment) return;
        usats.ids.add(aliment.id);
        usats.claus.add(clauCompra(aliment.nombre_ca));
    }

    function marcarProteinaPrincipal(usats, aliment) {
        if (!usats || !aliment) return;
        if ([CAT.CARN, CAT.PEIX, CAT.LLEGUM, CAT.OU].includes(aliment.categoria_id)) {
            usats.catsProt.add(aliment.categoria_id);
        }
    }

    /** Aliments que no formen part de plats habituals (p. ex. clara d'ou). */
    function esAlimentExclosMenu(aliment) {
        const nom = (aliment.nombre_ca || '').toLowerCase();
        return nom.includes('clara') && nom.includes('ou');
    }

    /**
     * Plats mediterranis complets per a seniors (Dieta del Plat / Harvard HSPH).
     * Cada plat té una descripció culturalment realista i ingredients coherents.
     */
    const PLATS_ESMORZAR = [
        {
            descripcio: 'Pa integral amb tomàquet i oli d\'oliva, i iogurt natural amb fruita',
            picks: [
                { cat: CAT.CEREAL, prefer: /pa integral/, grams: 45 },
                { cat: CAT.LACTIC, prefer: /iogurt natural/, grams: 125 },
                { cat: CAT.FRUITA, grams: 120 }
            ]
        },
        {
            descripcio: 'Flocs de civada amb llet semidesnatada i fruita fresca',
            picks: [
                { cat: CAT.CEREAL, prefer: /civada|flocs/, grams: 40 },
                { cat: CAT.LACTIC, prefer: /llet semidesnatada|llet desnatada/, grams: 200 },
                { cat: CAT.FRUITA, grams: 100 }
            ]
        },
        {
            descripcio: 'Torrades de pa amb formatge fresc i taronja',
            picks: [
                { cat: CAT.CEREAL, prefer: /pa /, grams: 50 },
                { cat: CAT.LACTIC, prefer: /formatge fresc|formatge mató|mató/, grams: 60 },
                { cat: CAT.FRUITA, prefer: /taronja|mandarina|poma/, grams: 150 }
            ]
        },
        {
            descripcio: 'Ou escalfat amb torrades de pa integral',
            picks: [
                { cat: CAT.OU, prefer: /ou sencer/, grams: 60, exclude: /clara/ },
                { cat: CAT.CEREAL, prefer: /pa integral|pa blanc/, grams: 45 }
            ]
        },
        {
            descripcio: 'Iogurt grec amb fruita de temporada i un grapat de nous',
            picks: [
                { cat: CAT.LACTIC, prefer: /iogurt grec|iogurt natural/, grams: 150 },
                { cat: CAT.FRUITA, grams: 120 },
                { cat: CAT.FRUIT_SEC, prefer: /nous/, grams: 15 }
            ]
        }
    ];

    const PLATS_MIGMATINAR = [
        {
            descripcio: 'Peça de fruita de temporada',
            picks: [{ cat: CAT.FRUITA, grams: 130 }]
        },
        {
            descripcio: 'Maduixa amb un grapat d\'ametlles',
            picks: [
                { cat: CAT.FRUITA, prefer: /maduixa|préssec|nectarina/, grams: 130 },
                { cat: CAT.FRUIT_SEC, prefer: /ametl/, grams: 12 }
            ]
        },
        {
            descripcio: 'Iogurt natural desnatat',
            picks: [{ cat: CAT.LACTIC, prefer: /iogurt/, grams: 125 }]
        }
    ];

    const PLATS_BERENAR = [
        {
            descripcio: 'Iogurt natural amb fruita de temporada',
            picks: [
                { cat: CAT.LACTIC, prefer: /iogurt/, grams: 125 },
                { cat: CAT.FRUITA, grams: 100 }
            ]
        },
        {
            descripcio: 'Formatge fresc amb pera',
            picks: [
                { cat: CAT.LACTIC, prefer: /formatge fresc|mató/, grams: 80 },
                { cat: CAT.FRUITA, prefer: /pera|poma/, grams: 120 }
            ]
        },
        {
            descripcio: 'Fruita fresca amb un grapat de nous',
            picks: [
                { cat: CAT.FRUITA, grams: 120 },
                { cat: CAT.FRUIT_SEC, prefer: /nous/, grams: 15 }
            ]
        },
        {
            descripcio: 'Taronja i un grapat d\'ametlles',
            picks: [
                { cat: CAT.FRUITA, prefer: /taronja|mandarina/, grams: 150 },
                { cat: CAT.FRUIT_SEC, prefer: /ametl/, grams: 12 }
            ]
        }
    ];

    /** dietes: omnivora/flexitariana per defecte; vegetariana/vegana sense carn ni peix */
    const PLATS_DINAR = [
        {
            descripcio: 'Llenguado al forn amb amanida verda i arròs integral',
            dietes: ['omnivora', 'flexitariana'],
            picks: [
                { cat: CAT.PEIX, prefer: /llenguado|rap|moll/, grams: 130 },
                { cat: CAT.VERDURA, prefer: /enciam|escarola|rúcula|espinac/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /arròs integral|arròs blanc/, grams: 100 }
            ]
        },
        {
            descripcio: 'Pollastre a la planxa amb espàrrecs i patata al forn',
            dietes: ['omnivora', 'flexitariana'],
            picks: [
                { cat: CAT.CARN, prefer: /pollastre|gall dindi/, grams: 120 },
                { cat: CAT.VERDURA, prefer: /espàrrec|bròquil|carbass/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /patata|moniato/, grams: 150 }
            ]
        },
        {
            descripcio: 'Sardina a la planxa amb amanida de tomàquet i pebrot',
            dietes: ['omnivora', 'flexitariana'],
            picks: [
                { cat: CAT.PEIX, prefer: /sardina|verat|sorell/, grams: 130 },
                { cat: CAT.VERDURA, prefer: /tomàquet|pebrot/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /pa integral|arròs/, grams: 50 }
            ]
        },
        {
            descripcio: 'Cigrons amb espinacs i quinoa',
            dietes: ['omnivora', 'flexitariana', 'vegetariana', 'vegana'],
            picks: [
                { cat: CAT.LLEGUM, prefer: /cigr/i, grams: 180 },
                { cat: CAT.VERDURA, prefer: /espinac|bleda/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /quinoa|arròs/, grams: 80 }
            ]
        },
        {
            descripcio: 'Llenties amb pastanaga i arròs integral',
            dietes: ['omnivora', 'flexitariana', 'vegetariana', 'vegana'],
            picks: [
                { cat: CAT.LLEGUM, prefer: /llent/i, grams: 180 },
                { cat: CAT.VERDURA, prefer: /pastanaga|api|porro/, grams: 120 },
                { cat: CAT.CEREAL, prefer: /arròs integral/, grams: 100 }
            ]
        },
        {
            descripcio: 'Ou dur amb amanida variada i pa integral',
            dietes: ['omnivora', 'flexitariana', 'vegetariana'],
            picks: [
                { cat: CAT.OU, prefer: /ou sencer/, grams: 120, exclude: /clara/ },
                { cat: CAT.VERDURA, prefer: /enciam|tomàquet|enciam/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /pa integral/, grams: 45 }
            ]
        },
        {
            descripcio: 'Tonyina a la planxa amb amanida i patata',
            dietes: ['omnivora', 'flexitariana'],
            picks: [
                { cat: CAT.PEIX, prefer: /tonyina|llobarro|salmó/, grams: 130 },
                { cat: CAT.VERDURA, prefer: /enciam|tomàquet|pebrot/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /patata|arròs/, grams: 120 }
            ]
        },
        {
            descripcio: 'Mongetes seques amb verdures de temporada i pa integral',
            dietes: ['omnivora', 'flexitariana', 'vegetariana', 'vegana'],
            picks: [
                { cat: CAT.LLEGUM, prefer: /mongeta/, grams: 180 },
                { cat: CAT.VERDURA, prefer: /carbass|pastanaga|porro/, grams: 150 },
                { cat: CAT.CEREAL, prefer: /pa integral/, grams: 40 }
            ]
        }
    ];

    const PLATS_SOPAR = [
        {
            descripcio: 'Crema de carbassó amb ou escalfat i pa integral',
            dietes: ['omnivora', 'flexitariana', 'vegetariana'],
            picks: [
                { cat: CAT.VERDURA, prefer: /carbass/, grams: 200 },
                { cat: CAT.OU, prefer: /ou sencer/, grams: 60, exclude: /clara/ },
                { cat: CAT.CEREAL, prefer: /pa integral/, grams: 35 }
            ]
        },
        {
            descripcio: 'Peix blanc al vapor amb verdures al vapor',
            dietes: ['omnivora', 'flexitariana'],
            picks: [
                { cat: CAT.PEIX, prefer: /llenguado|rap|moll|bacall/, grams: 120 },
                { cat: CAT.VERDURA, prefer: /bròquil|coliflor|pastanaga/, grams: 180 }
            ]
        },
        {
            descripcio: 'Truita de carbassó amb amanida d\'enciam',
            dietes: ['omnivora', 'flexitariana', 'vegetariana'],
            picks: [
                { cat: CAT.OU, prefer: /ou sencer/, grams: 120, exclude: /clara/ },
                { cat: CAT.VERDURA, prefer: /carbass/, grams: 150 },
                { cat: CAT.VERDURA, prefer: /enciam|escarola/, grams: 80 }
            ]
        },
        {
            descripcio: 'Iogurt natural amb fruita (sopar lleuger)',
            dietes: ['omnivora', 'flexitariana', 'vegetariana'],
            picks: [
                { cat: CAT.LACTIC, prefer: /iogurt/, grams: 150 },
                { cat: CAT.FRUITA, grams: 120 }
            ]
        },
        {
            descripcio: 'Llenties en crema amb verdures de temporada',
            dietes: ['omnivora', 'flexitariana', 'vegetariana', 'vegana'],
            picks: [
                { cat: CAT.LLEGUM, prefer: /llentia/, grams: 160 },
                { cat: CAT.VERDURA, prefer: /pastanaga|api|porro|carbass/, grams: 150 }
            ]
        },
        {
            descripcio: 'Formatge tendre amb amanida i pa integral',
            dietes: ['omnivora', 'flexitariana', 'vegetariana'],
            picks: [
                { cat: CAT.LACTIC, prefer: /formatge tendre|formatge fresc|mató/, grams: 80 },
                { cat: CAT.VERDURA, prefer: /enciam|tomàquet/, grams: 120 },
                { cat: CAT.CEREAL, prefer: /pa integral/, grams: 35 }
            ]
        }
    ];

    /** Resol un ingredient d'un plat segons pools i restriccions. */
    function triarIngredient(pools, pick, seed, tipusApat, usats) {
        const pool = pools[pick.cat] || [];
        let candidats = pool.filter((a) => !estaUsat(a, usats) && !esAlimentExclosMenu(a));

        if (pick.prefer) {
            const preferits = candidats.filter((a) => pick.prefer.test(a.nombre_ca || ''));
            if (preferits.length) candidats = preferits;
        }
        if (pick.exclude) {
            candidats = candidats.filter((a) => !pick.exclude.test(a.nombre_ca || ''));
        }
        if (!pick.skipApatFilter) {
            candidats = candidats.filter((a) => esAlimentAdequatPerApat(a, tipusApat));
        }
        if (!candidats.length) return null;
        return candidats[seed % candidats.length];
    }

    /** Aplica un plat complet: descripció fixa + ingredients resolts. */
    function resoldrePlat(plat, pools, seed, tipusApat, usats) {
        const ings = [];
        plat.picks.forEach((pick, i) => {
            const aliment = triarIngredient(pools, pick, seed + i * 3, tipusApat, usats);
            if (aliment) {
                marcarUsat(usats, aliment);
                ings.push({ aliment, grams: pick.grams || PORCIONS[aliment.categoria_id] || 100 });
            }
        });
        if (!ings.length) {
            return { ingredients: [], descripcio: plat.descripcio };
        }
        return { ingredients: ings, descripcio: plat.descripcio };
    }

    /** Filtra plats compatibles amb el tipus de dieta. */
    function platsPerDieta(plats, dieta) {
        const d = dieta || 'omnivora';
        return plats.filter((p) => !p.dietes || p.dietes.includes(d));
    }

    function plantillaEsmorzar(pools, seed, usats) {
        const plats = PLATS_ESMORZAR;
        return resoldrePlat(plats[seed % plats.length], pools, seed, 'esmorzar', usats);
    }

    function plantillaMigMatinar(pools, seed, usats) {
        const plats = PLATS_MIGMATINAR;
        return resoldrePlat(plats[seed % plats.length], pools, seed, 'migMatinar', usats);
    }

    function plantillaBerenar(pools, seed, usats) {
        const plats = PLATS_BERENAR;
        return resoldrePlat(plats[seed % plats.length], pools, seed, 'berenar', usats);
    }

    function plantillaDinar(pools, seed, diaIndex, dieta, historial, usats) {
        const plats = platsPerDieta(PLATS_DINAR, dieta);
        if (!plats.length) {
            return { ingredients: [], descripcio: 'Dinar mediterrani equilibrat' };
        }
        const plat = plats[(seed + diaIndex) % plats.length];
        const resultat = resoldrePlat(plat, pools, seed + diaIndex, 'dinar', usats);
        // Marca proteïna principal per evitar repetició
        const prot = resultat.ingredients.find((i) =>
            [CAT.CARN, CAT.PEIX, CAT.LLEGUM, CAT.OU].includes(i.aliment.categoria_id)
        );
        if (prot) marcarProteinaPrincipal(usats, prot.aliment);
        return resultat;
    }

    function plantillaSopar(pools, seed, diaIndex, dieta, historial, usats) {
        const plats = platsPerDieta(PLATS_SOPAR, dieta);
        if (!plats.length) {
            return { ingredients: [], descripcio: 'Sopar lleuger mediterrani' };
        }
        const plat = plats[(seed + diaIndex + 2) % plats.length];
        const resultat = resoldrePlat(plat, pools, seed + diaIndex, 'sopar', usats);
        const prot = resultat.ingredients.find((i) =>
            [CAT.PEIX, CAT.LLEGUM, CAT.OU, CAT.LACTIC].includes(i.aliment.categoria_id)
        );
        if (prot) marcarProteinaPrincipal(usats, prot.aliment);
        return resultat;
    }

    // ============================================
    // GENERACIÓ DE DIES I ÀPATS
    // ============================================

    function generarDia(diaIndex, pools, objectius, dadesUsuari, historialProteines, seedOffset = 0) {
        const data = obtenirDataDia(diaIndex);
        const dataObj = new Date(`${data}T12:00:00`);
        const dia = {
            dia: diaIndex + 1,
            nom: DIES_SETMANA[dataObj.getDay() === 0 ? 6 : dataObj.getDay() - 1],
            data,
            esmorzar: null,
            migMatinar: null,
            dinar: null,
            berenar: null,
            sopar: null,
            totals: {}
        };

        const usats = {
            ids: new Set(),
            claus: new Set(),
            catsProt: new Set()
        };

        APATS.forEach((tipusApat) => {
            dia[tipusApat] = crearApat(
                tipusApat,
                pools,
                Math.round(objectius.kcalDiaries * DISTRIBUCIO_KCAL[tipusApat]),
                Math.round(objectius.proteinaDiaria * DISTRIBUCIO_KCAL[tipusApat]),
                diaIndex,
                dadesUsuari,
                historialProteines,
                usats,
                seedOffset
            );
        });

        dia.totals = calcularTotalsDia(dia);
        return dia;
    }

    function crearApat(tipus, pools, kcalObjectiu, protObjectiu, diaIndex, dadesUsuari, historial, usats, seedOffset = 0) {
        const seed = seedOffset + diaIndex * 10 + APATS.indexOf(tipus);
        const dieta = dadesUsuari.dieta || 'omnivora';

        let resultat;
        switch (tipus) {
            case 'esmorzar': resultat = plantillaEsmorzar(pools, seed, usats); break;
            case 'migMatinar': resultat = plantillaMigMatinar(pools, seed, usats); break;
            case 'dinar': resultat = plantillaDinar(pools, seed, seed, dieta, historial, usats); break;
            case 'berenar': resultat = plantillaBerenar(pools, seed, usats); break;
            case 'sopar': resultat = plantillaSopar(pools, seed, seed, dieta, historial, usats); break;
            default: resultat = { ingredients: [], descripcio: '' };
        }

        const nets = (resultat.ingredients || []).filter(Boolean);
        const items = nets.map((entrada) => {
            if (entrada.grams != null) return crearIngredient(entrada.aliment, entrada.grams);
            return crearIngredient(entrada, PORCIONS[entrada.categoria_id] || 100);
        });
        const nutrients = sumarNutrients(items);

        return {
            nom: NOMS_APATS[tipus],
            ingredients: items,
            plats: [resultat.descripcio].filter(Boolean),
            descripcio: resultat.descripcio,
            calories: nutrients.calories,
            proteina: nutrients.proteina,
            hc: nutrients.hc,
            greixos: nutrients.greixos,
            fibra: nutrients.fibra,
            sodi: nutrients.sodi,
            aigua_ml: AIGUA_APAT[tipus],
            objectiuKcal: kcalObjectiu,
            objectiuProteina: protObjectiu
        };
    }

    function curt(aliment) {
        if (!aliment) return '';
        return String(aliment.nombre_ca || '')
            .replace(/\s*\(.*?\)\s*/g, '')
            .trim()
            .toLowerCase();
    }

    function triarProteina(pools, diaIndex, dieta, historial, usats) {
        const esFlexitaria = dieta === 'flexitariana';
        const esOmnivora = dieta === 'omnivora' || esFlexitaria;
        const catsBloq = usats?.catsProt || new Set();

        const provar = (pool) => triarPerApat(pool, diaIndex, 'dinar', historial, usats);

        if (esFlexitaria) {
            const mod = diaIndex % 5;
            if (mod <= 1 && !catsBloq.has(CAT.PEIX)) {
                const peix = provar(pools[CAT.PEIX]);
                if (peix) return peix;
            }
            if ((mod === 2 || mod === 4) && !catsBloq.has(CAT.CARN)) {
                const carn = provar(pools[CAT.CARN]);
                if (carn) return carn;
            }
            return provar(pools[CAT.LLEGUM]) || provar(pools[CAT.OU]);
        }

        if (esOmnivora) {
            const rotacio = [
                CAT.PEIX, CAT.LLEGUM, CAT.CARN,
                CAT.PEIX, CAT.LLEGUM, CAT.PEIX, CAT.LLEGUM
            ];
            const preferida = rotacio[diaIndex % 7];
            if (!catsBloq.has(preferida)) {
                const triat = provar(pools[preferida]);
                if (triat) return triat;
            }
            for (const cat of [CAT.PEIX, CAT.LLEGUM, CAT.CARN, CAT.OU]) {
                if (catsBloq.has(cat)) continue;
                const t = provar(pools[cat]);
                if (t) return t;
            }
        }

        return provar(pools[CAT.LLEGUM])
            || provar(pools[CAT.OU])
            || triarPerApat(pools[CAT.LACTIC], diaIndex, 'dinar', historial, usats);
    }

    function triarProteinaLleugera(pools, diaIndex, dieta, historial, usats) {
        const catsBloq = usats?.catsProt || new Set();
        const provar = (pool) => triarPerApat(pool, diaIndex + 5, 'sopar', historial, usats);

        // No repetir la mateixa categoria de proteïna del dinar (ex.: peix + peix)
        if ((dieta === 'omnivora' || dieta === 'flexitariana') && !catsBloq.has(CAT.PEIX)) {
            const peix = provar(pools[CAT.PEIX]);
            if (peix) return peix;
        }

        const opcions = [CAT.LLEGUM, CAT.OU, CAT.LACTIC, CAT.PEIX];
        for (const cat of opcions) {
            if (catsBloq.has(cat)) continue;
            const t = triarPerApat(pools[cat], diaIndex + 3, 'sopar', historial, usats);
            if (t) return t;
        }
        // Fallback si tot està bloquejat
        return provar(pools[CAT.LLEGUM])
            || provar(pools[CAT.OU])
            || provar(pools[CAT.LACTIC]);
    }

    // ============================================
    // NUTRICIÓ I LLISTA DE COMPRA
    // ============================================

    function crearIngredient(aliment, grams) {
        const factor = grams / 100;
        return {
            id: aliment.id,
            nom: aliment.nombre_ca,
            categoriaId: aliment.categoria_id,
            grams,
            calories: Math.round((parseFloat(aliment.calorias_100g) || 0) * factor),
            proteina: arrodonir((parseFloat(aliment.proteinas_100g) || 0) * factor),
            hc: arrodonir((parseFloat(aliment.carbohidratos_100g) || 0) * factor),
            greixos: arrodonir((parseFloat(aliment.grasas_100g) || 0) * factor),
            fibra: arrodonir((parseFloat(aliment.fibra_100g) || 0) * factor),
            sodi: Math.round((parseFloat(aliment.sodio_100g) || 0) * factor)
        };
    }

    function sumarNutrients(items) {
        return items.reduce((acc, i) => ({
            calories: acc.calories + i.calories,
            proteina: arrodonir(acc.proteina + i.proteina),
            hc: arrodonir(acc.hc + i.hc),
            greixos: arrodonir(acc.greixos + i.greixos),
            fibra: arrodonir(acc.fibra + i.fibra),
            sodi: acc.sodi + i.sodi
        }), { calories: 0, proteina: 0, hc: 0, greixos: 0, fibra: 0, sodi: 0 });
    }

    function calcularTotalsDia(dia) {
        const items = APATS.flatMap((a) => dia[a]?.ingredients || []);
        const nutrients = sumarNutrients(items);
        const aigua = APATS.reduce((sum, a) => sum + (dia[a]?.aigua_ml || 0), 0);
        return { ...nutrients, aigua_ml: aigua };
    }

    function calcularResumSetmanal(menuSetmana, objectius) {
        const numDies = menuSetmana.length || 1;
        const totals = menuSetmana.reduce((acc, dia) => ({
            calories: acc.calories + dia.totals.calories,
            proteina: acc.proteina + dia.totals.proteina,
            fibra: acc.fibra + dia.totals.fibra,
            aigua_ml: acc.aigua_ml + dia.totals.aigua_ml
        }), { calories: 0, proteina: 0, fibra: 0, aigua_ml: 0 });

        return {
            kcalMitjana: Math.round(totals.calories / numDies),
            proteinaMitjana: arrodonir(totals.proteina / numDies),
            fibraMitjana: arrodonir(totals.fibra / numDies),
            aiguaMitjana: Math.round(totals.aigua_ml / numDies),
            objectiuKcal: objectius.kcalDiaries,
            objectiuProteina: objectius.proteinaDiaria
        };
    }

    function generarLlistaCompra(menuSetmana) {
        const mapa = new Map();
        menuSetmana.forEach((dia) => {
            APATS.forEach((tipus) => {
                (dia[tipus]?.ingredients || []).forEach((ing) => {
                    const clau = clauCompra(ing.nom);
                    const existent = mapa.get(clau);
                    if (existent) {
                        existent.gramsTotal += ing.grams;
                    } else {
                        // Nom net (sense sufix estacional duplicat)
                        const nomNet = String(ing.nom || '')
                            .replace(/\s+hivern$/i, '')
                            .trim();
                        mapa.set(clau, {
                            id: ing.id,
                            nom: nomNet,
                            gramsTotal: ing.grams,
                            categoriaId: ing.categoriaId
                        });
                    }
                });
            });
        });
        return [...mapa.values()]
            .sort((a, b) => {
                const ordreA = ORDRE_COMPRA.indexOf(a.categoriaId);
                const ordreB = ORDRE_COMPRA.indexOf(b.categoriaId);
                const oa = ordreA === -1 ? 99 : ordreA;
                const ob = ordreB === -1 ? 99 : ordreB;
                return oa - ob || a.nom.localeCompare(b.nom, 'ca');
            });
    }

    function arrodonir(val) {
        return Math.round(val * 10) / 10;
    }

    function obtenirEstacioId(dadesApp) {
        if (window.app?.obtenirEstacioActual) {
            const est = window.app.obtenirEstacioActual();
            if (est?.id) return est.id;
        }
        const mes = new Date().getMonth() + 1;
        if (mes >= 3 && mes <= 5) return 1;
        if (mes >= 6 && mes <= 8) return 2;
        if (mes >= 9 && mes <= 11) return 3;
        return 4;
    }

    /** Primer dilluns del pla (avui si és dilluns; si no, el proper). */
    function obtenirDataIniciPla() {
        const data = new Date();
        data.setHours(12, 0, 0, 0);
        const diaSetmana = data.getDay(); // 0=Dg … 1=Dl
        const diesFinsDilluns = diaSetmana === 0 ? 1 : (diaSetmana === 1 ? 0 : (8 - diaSetmana));
        data.setDate(data.getDate() + diesFinsDilluns);
        return data;
    }

    /** Data local YYYY-MM-DD (evita desfasament UTC de toISOString). */
    function formatDataLocal(data) {
        const y = data.getFullYear();
        const m = String(data.getMonth() + 1).padStart(2, '0');
        const d = String(data.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function obtenirDataDia(diaIndex) {
        const data = obtenirDataIniciPla();
        data.setDate(data.getDate() + diaIndex);
        return formatDataLocal(data);
    }

    return {
        generarMenuSetmanal,
        generarLlistaCompra,
        CAT,
        APATS,
        NOMS_APATS,
        DIES_SETMANA,
        DURADA_PLA,
        ORDRE_COMPRA,
        NOMS_CATEGORIES,
        esAlimentAdequatPerApat,
        coincideixAlergiaPersonalitzada
    };

})();

window.motorDieta = motorDieta;
