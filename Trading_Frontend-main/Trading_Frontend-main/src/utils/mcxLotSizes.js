import api from './api';

export const MCX_LOT_SIZES = {
    'GOLD': 100, 'GOLDM': 10, 'MGOLD': 10, 'GOLDGUINEA': 8, 'GOLDPETAL': 1,
    'SILVER': 30, 'SILVERM': 5, 'MSILVER': 5, 'SILVERMIC': 1,
    'CRUDEOIL': 100, 'CRUDEOILM': 10, 'MCRUDEOIL': 10,
    'NATURALGAS': 1250, 'NATURALGASM': 125, 'MNATURALGAS': 125, 'NATGASMINI': 250,
    'COPPER': 2500, 'COPPERM': 250, 'MCOPPER': 250,
    'ZINC': 5000, 'ZINCMINI': 1000, 'MZINC': 1000,
    'LEAD': 5000, 'LEADMINI': 1000, 'MLEAD': 1000,
    'NICKEL': 1500, 'NICKELMINI': 100, 'MNICKEL': 100,
    'ALUMINIUM': 5000, 'ALUMINI': 1000, 'ALUMINIUMM': 1000, 'MALUMINIUM': 1000,
    'MENTHAOIL': 360, 'COTTON': 25, 'BULLDEX': 1,
};

export const getMcxBaseScrip = (symbol) => {
    if (!symbol) return '';
    const s = String(symbol).split(':').pop().toUpperCase().trim();
    const mcxBases = [
        'GOLDGUINEA', 'GOLDPETAL', 'GOLDM', 'GOLD', 'MGOLD',
        'SILVERMIC', 'SILVERM', 'SILVER', 'MSILVER',
        'CRUDEOILM', 'CRUDEOIL', 'MCRUDEOIL',
        'NATGASMINI', 'NATURALGAS', 'MNATURALGAS',
        'COPPERM', 'COPPER', 'MCOPPER',
        'ZINCMINI', 'ZINC', 'MZINC',
        'LEADMINI', 'LEAD', 'MLEAD',
        'NICKELMINI', 'NICKEL',
        'ALUMINI', 'ALUMINIUM', 'MALUMINIUM',
        'MENTHAOIL', 'COTTONCNDY', 'COTTON',
        'MCXBULLDEX', 'BULLDEX'
    ];
    for (const base of mcxBases) {
        if (s.startsWith(base)) return base;
    }
    return s.replace(/\d+.*/, '').trim();
};

export const getMcxLotSize = (symbol) => {
    const base = getMcxBaseScrip(symbol);
    return MCX_LOT_SIZES[base] || null;
};

export const fetchMcxLotSizesFromApi = async () => {
    try {
        const res = await api.get('/system/mcx-lot-sizes');
        if (res.data && res.data.lotSizes) {
            Object.assign(MCX_LOT_SIZES, res.data.lotSizes);
        }
    } catch (err) {
        // Soft fallback to hardcoded MCX_LOT_SIZES if API call fails
    }
    return MCX_LOT_SIZES;
};

// Initial sync fetch on module load
fetchMcxLotSizesFromApi();
