// SEARCH LOGIC - Loads translations and provides search functions
// This file fetches translations from JSON and provides search functionality

let frTranslations = {};
let kabTranslations = {};
let translationsLoaded = false;

// ProductNameKey enum
const ProductNameKey = {
    Cream: 'Cream', Yogurt: 'yogurt', CremeDessert: 'DessertCream', Flan: 'Flan',
    LaitFermente: 'ayefkifermente', Ighi: 'ayefkiEcreme', DrinkYogurt: 'aBoireYogu',
    Fromage: 'cheese', Camambert: 'camembert', Mascarpone: 'mascarpone',
    FromagePortions: 'vacheKiRit', FromageRouge: 'afermajeAzeggagh', Cheddar: 'cheddar',
    Gruyere: 'fromageTrous', CandiCho: 'candiaChoc', Beure: 'beure',
    Margarine: 'margarine', Cereals: 'cereals', Biscuits: 'biscuit',
    Biscotte: 'biscotte', PainDeMie: 'painMie', Confiture: 'confittura',
    ChocolatPoudre: 'chocolatPowder', ChocolatTartiner: 'tartinerChocolat',
    Coffee: 'coffee', TeaVert: 'teaAzeg', TeaNoir: 'teaNwar',
    Lait: 'aceffay', PouletEntier: 'tazazit', PommeDeTerre: 'ybatata',
    NotFound: 'pasTrouvé'
};

// Normalize text
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['\"-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Variant rules
const LANGUAGE_SPECIFIC_VARIANT_RULES = {
    fr: [
        { find: /œ/g, replace: ['oe'] },
        { find: /ph/g, replace: ['f'] },
        { find: /ck/g, replace: ['k'] },
        { find: /au/g, replace: ['o'] },
        { find: /courgette/g, replace: ['gourgette'] },
        { find: /epinar/g, replace: ['Blette'] },
        { find: /(.)\1/g, replace: ['$1'] }
    ],
    kab: [
        { find: /ɣ/g, replace: ['gh'] },
        { find: /čč/g, replace: ['tch'] },
        { find: /ḍ/g, replace: ['dh'] },
        { find: /ẓ/g, replace: ['zz'] },
        { find: /ţ/g, replace: ['tt', 'ts', 'ss'] },
        { find: /ṭ/g, replace: ['t'] },
        { find: /cc/g, replace: ['ch'] },
        { find: /c/g, replace: ['ch'] },
        { find: /u/g, replace: ['o'] },
        { find: /ou/g, replace: ['u'] },
        { find: /ṣ/g, replace: ['s'] },
        { find: /ṛ/g, replace: ['r'] },
        { find: /ḥ/g, replace: ['h'] },
        { find: /ɛ/g, replace: ['3'] },
        { find: /eɛ/g, replace: ['aa'] },
        { find: /dj/g, replace: ['ǧ'] },
        { find: /gʷ/g, replace: ['gg'] },
        { find: /x/g, replace: ['kh'] },
        { find: /t/g, replace: ['th'] },
        { find: /l/g, replace: ['y'] },
        { find: /(.)\1/g, replace: ['$1'] }
    ]
};

// Generate variants
function getLanguageSpecificSearchVariants(text, lang) {
    const finalVariants = new Set();
    const initialNormalizedText = normalizeText(text);

    if (!initialNormalizedText.trim()) return finalVariants;

    finalVariants.add(initialNormalizedText);

    const rules = LANGUAGE_SPECIFIC_VARIANT_RULES[lang] || [];

    for (const rule of rules) {
        const replacements = Array.isArray(rule.replace) ? rule.replace : [rule.replace];
        for (const replacementOption of replacements) {
            const newVariant = initialNormalizedText.replace(rule.find, replacementOption);
            const normalizedNewVariant = normalizeText(newVariant);
            if (normalizedNewVariant !== initialNormalizedText && normalizedNewVariant.trim()) {
                finalVariants.add(normalizedNewVariant);
            }
        }
    }

    return finalVariants;
}

// Estimate language
function estimateInputLanguage(text) {
    const normalized = normalizeText(text);
    if (normalized.length < 2) return 'fr';

    let scoreKab = 0, scoreFr = 0;

    // Kabyle character markers
    const kabMarkers = ['ɣ', 'č', 'ḍ', 'ẓ', 'ţ', 'ṭ', 'ɛ', 'ǧ', 'ḥ', 'ṣ', 'ṛ'];
    kabMarkers.forEach(m => {
        if (text.includes(m)) scoreKab += 3;
    });

    // Check against known words
    const words = normalized.split(' ');
    words.forEach(word => {
        for (const key in ProductNameKey) {
            const pk = ProductNameKey[key];
            const frWord = normalizeText(frTranslations[pk] || '');
            const kabWord = normalizeText(kabTranslations[pk] || '');

            if (word === frWord && frWord) scoreFr += 2;
            if (word === kabWord && kabWord) scoreKab += 2;
        }
    });

    return scoreKab >= scoreFr ? 'kab' : 'fr';
}

// Get product suggestions
function getProductSuggestions(inputText, displayLanguage, limit = 10) {
    if (!inputText || !translationsLoaded) {
        console.log('No input or translations not loaded');
        return [];
    }

    const processedInput = normalizeText(inputText);
    if (!processedInput) return [];

    const allInputVariants = getLanguageSpecificSearchVariants(inputText, displayLanguage);
    const results = [];

    // Search through all products
    for (const key in ProductNameKey) {
        const productKey = ProductNameKey[key];
        if (productKey === 'pasTrouvé') continue;

        const frName = frTranslations[productKey] || '';
        const kabName = kabTranslations[productKey] || '';

        if (!frName && !kabName) continue;

        const nFr = normalizeText(frName);
        const nKab = normalizeText(kabName);

        let bestScore = 0;

        // Check all variants
        allInputVariants.forEach(v => {
            // Exact match
            if (nFr === v || nKab === v) {
                bestScore = Math.max(bestScore, 10);
            }
            // Starts with
            else if (nFr.startsWith(v) || nKab.startsWith(v)) {
                bestScore = Math.max(bestScore, 7);
            }
            // Contains
            else if (nFr.includes(v) || nKab.includes(v)) {
                bestScore = Math.max(bestScore, 4);
            }
        });

        if (bestScore > 0) {
            results.push({
                productNameKey: productKey,
                translatedName: displayLanguage === 'fr' ? frName : kabName,
                score: bestScore
            });
        }
    }

    console.log(`Found ${results.length} results for "${inputText}"`);

    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// Load translations
async function loadTranslations() {
    if (translationsLoaded) return;

    try {
        console.log('Loading translations...');

        const frResponse = await fetch('app/(main)/translations/data/fr.json');
        const kabResponse = await fetch('app/(main)/translations/data/kab.json');

        if (!frResponse.ok || !kabResponse.ok) {
            throw new Error('Failed to fetch translation files');
        }

        frTranslations = await frResponse.json();
        kabTranslations = await kabResponse.json();
        translationsLoaded = true;

        console.log('Translations loaded successfully!');
        console.log('FR translations:', Object.keys(frTranslations).length);
        console.log('KAB translations:', Object.keys(kabTranslations).length);
    } catch (error) {
        console.error('Failed to load translations:', error);
        translationsLoaded = false;
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTranslations);
} else {
    loadTranslations();
}
