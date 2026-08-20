const VERSION = "v9.92";
// script.js – HP | Poly Configurator – v9.92 (full Poly+ + Analyze 1/3/5yr support)

document.title = 'Poly Video Conferencing "Bill" of Materials Generator';

async function init() {
  const res = await fetch('skus_merged.json');
  if (!res.ok) throw new Error(`Failed to load skus_merged.json (${res.status})`);
  const catalog = await res.json();

  // ---------- helpers ----------
  const getItem = sku => catalog[sku] || null;
  const hasSku = (arr, sku) => arr.some(x => x.sku === sku);
  const addLine = (arr, sku, fallback="(Custom item)", qty=1) => {
    const item = getItem(sku);
    const existing = arr.find(x => x.sku === sku);
    if (existing) { existing.quantity += qty; return; }
    arr.push({
      sku,
      description: item?.description || fallback,
      msrp: item?.msrp ?? "",
      quantity: qty
    });
  };
  const fmtCurrency = v => {
    if (v === "" || v === null || v === undefined) return "—";
    if (typeof v !== "number") return String(v);
    return `$${v.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
  };

  // Support map: productKey → { poly1, poly3, poly5, analyze1, analyze3, analyze5 }
  // Values match the <select> option values already on the live site.
  const SUPPORT_MAP = {
    tc10: {
      poly1: "P37760112", poly3: "P37760312", poly5: "UF4W1PV",
      analyze1: "UR5F3PV", analyze3: "UR5F4PV", analyze5: "UR5F6PV"
    },
    g9plus_mtr: {
      poly1: "P88230112", poly3: "P88230312", poly5: "UJ9E5PV",
      analyze1: "UR5J9PV", analyze3: "UR5K0PV", analyze5: "UR5K2PV"
    },
    zoom_pc: {
      poly1: "P88120112", poly3: "P88120312", poly5: null,
      analyze1: null, analyze3: null, analyze5: null
    },
    g62: {
      poly1: "U86WDPV", poly3: "U77D3PV", poly5: "UL5V0PV",
      analyze1: "UR4H9PV", analyze3: "UR4J0PV", analyze5: "UR4J2PV"
    },
    e70: {
      poly1: "P87090112", poly3: "P87090312", poly5: "UF4W3PV",
      analyze1: "UR7Z1PV", analyze3: "UR7Z2PV", analyze5: null
    },
    e60: {
      poly1: "U86LCPV", poly3: "U86LDPV", poly5: "UF4W2PV",
      analyze1: "UR7X9PV", analyze3: "UR7Y0PV", analyze5: "UR7Y2PV"
    },
    a2_mic: {
      poly1: "UJ9B5PV", poly3: "UJ9B6PV", poly5: null,
      analyze1: null, analyze3: null, analyze5: null
    },
    a2_bridge: {
      poly1: "UJ9C3PV", poly3: "UJ9C4PV", poly5: null,
      analyze1: null, analyze3: null, analyze5: null
    },
    v12: {
      poly1: "UE1X6PV", poly3: "UE1X7PV", poly5: "UJ9J6PV",
      analyze1: "UR8C8PV", analyze3: "UR8C9PV", analyze5: "UR8D1PV"
    },
    v52: {
      poly1: "U86MNPV", poly3: "U86MQPV", poly5: null,
      analyze1: "UR8E0PV", analyze3: "UR8E1PV", analyze5: "UR8E3PV"
    },
    v72: {
      poly1: "U98X0PV", poly3: "U98X1PV", poly5: null,
      analyze1: "UR8F2PV", analyze3: "UR8F3PV", analyze5: "UR8F5PV"
    },
    x32: {
      poly1: "UE1Q8PV", poly3: "UE1Q9PV", poly5: null,
      analyze1: "UR4R6PV", analyze3: "UR4R7PV", analyze5: "UR4R9PV"
    },
    x52: {
      poly1: "P87620112", poly3: "P87620312", poly5: "UL5R7PV",
      analyze1: "UR4V4PV", analyze3: "UR4V5PV", analyze5: "UR4V7PV"
    },
    x72: {
      poly1: "U99P8PV", poly3: "U99P9PV", poly5: "UL5V2PV",
      analyze1: "UR5C3PV", analyze3: "UR5C4PV", analyze5: "UR5C6PV"
    }
  };

  // Call as: addSupport(results, "tc10", supportTerm, qty)
  const addSupport = (arr, key, term, qty = 1) => {
    if (!term) return;
    const map = SUPPORT_MAP[key];
    if (!map) return;
    const sku = map[term];
    if (sku) addLine(arr, sku, undefined, qty);
  };

  // ---------- UI ----------
  // NOTE: Full script body continues from the live version with all addSupport replacements applied.
  // (truncated for this message - real full file will be re-pushed properly)
