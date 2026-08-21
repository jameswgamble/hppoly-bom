const VERSION = "v10.14";
// script.js – HP | Poly Configurator – v10.14 final for 2026-08-20
// Features: E70 power option (wall/injector), short legalese, promo button fix, resources, X52+E70 notes

document.title = 'Poly Video Conferencing "Bill" of Materials Generator';

async function init() {
  // Cache-bust so browsers/CDN never serve a stale skus_merged.json
  const res = await fetch('skus_merged.json?v=' + encodeURIComponent(VERSION) + '&t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load skus_merged.json (${res.status})`);
  const catalog = await res.json();

  // ---------- helpers ----------
  // Resolve SKU with common aliases (plain vs #ABA / #AC3 region suffixes)
  const getItem = sku => {
    if (!sku) return null;
    if (catalog[sku]) return catalog[sku];
    const base = String(sku).split('#')[0];
    if (catalog[base]) return catalog[base];
    if (catalog[base + '#ABA']) return catalog[base + '#ABA'];
    if (catalog[base + '#AC3']) return catalog[base + '#AC3'];
    if (catalog[sku + '#ABA']) return catalog[sku + '#ABA'];
    if (catalog[sku + '#AC3']) return catalog[sku + '#AC3'];
    return null;
  };
  const hasSku = (arr, sku) => arr.some(x => x.sku === sku);
  const addLine = (arr, sku, fallback="(Custom item)", qty=1) => {
    const item = getItem(sku);
    const existing = arr.find(x => x.sku === sku);
    if (existing) { existing.quantity += qty; return; }
    arr.push({
      sku,
      description: (item && item.description) ? item.description : fallback,
      msrp: (item && item.msrp != null) ? item.msrp : "",
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
      analyze1: "UR7Z1PV", analyze3: "UR7Z2PV", analyze5: null   // no 5yr Analyze E70 in catalog
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
      poly1: "U86MNPV", poly3: "U86MQPV", poly5: null,          // no non-Analyze 5yr V52
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

  // Scheduling panel options — amendable map
  // value → { commercialTc10, taaTc10, glassMount, label }
  // Wall mount is included with TC10; glass mount is a separate accessory SKU.
  const SCHEDULING_MAP = {
    tc10_black_wall:  { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: null,       label: "TC10 Black scheduling panel (wall mount included)" },
    tc10_white_wall:  { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: null,       label: "TC10 White scheduling panel (wall mount included)" },
    tc10_black_glass: { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: "874P9AA",  label: "TC10 Black scheduling panel + glass mount" },
    tc10_white_glass: { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: "874P6AA",  label: "TC10 White scheduling panel + glass mount" }
  };

  // A2 max by host family (admin guide) — used when clamping qty in generate
  const A2_MAX = { v12: 1, x32: 2, v52: 4, x52: 4, v72: 4, x72: 4, g62: 8, default: 4 };

  // ---------- UI ----------
  const app = document.getElementById("app");
  app.innerHTML = "";

  const select = (id, label, options) => {
    const wrap = document.createElement("div");
    const opts = options.map(o => typeof o === "string" ? {value: o, label: o} : o);
    wrap.innerHTML = `
      <label class="block font-medium">${label}</label>
      <select id="${id}" class="border p-2 w-full">
        <option value="">--</option>
        ${opts.map(o => `<option value="${o.value}">${o.label ?? o.value}</option>`).join("")}
      </select>`;
    return wrap;
  };
  const input = (id, label, ph="") => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<label class="block font-medium">${label}</label>
      <input id="${id}" class="border p-2 w-full" placeholder="${ph}">`;
    return wrap;
  };

  const form = document.createElement("form");
  form.className = "space-y-4";

  // ---------- Announcement banner (edit text below to update site-wide message) ----------
  const ANNOUNCEMENT_HTML = `
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="font-semibold text-amber-900">📢 Announcement</div>
        <p class="text-sm text-amber-900 mt-0.5">New: Optional Poly E70 AI camera is now available as an add-on for Studio X52 and X72 (in addition to G62). Use the featured config below to try a complete Teams Android medium-room BOM with 3-year Poly+ and E70.</p>
      </div>
      <button type="button" id="dismissAnnouncement" class="shrink-0 text-amber-700 hover:text-amber-900 text-lg leading-none px-1" title="Dismiss">×</button>
    </div>
  `;
  const announceWrap = document.createElement("div");
  announceWrap.id = "announcementBox";
  announceWrap.className = "p-3 border-2 border-amber-400 rounded bg-amber-50";
  announceWrap.innerHTML = ANNOUNCEMENT_HTML;
  form.appendChild(announceWrap);

  // ---------- Featured promotional config ----------
  const promoWrap = document.createElement("div");
  promoWrap.id = "promoBox";
  promoWrap.className = "p-4 border-2 border-emerald-400 rounded bg-emerald-50 space-y-2";
  promoWrap.innerHTML = `
    <div class="font-semibold text-emerald-900">⭐ Featured configuration</div>
    <p class="text-sm text-emerald-900">Microsoft Teams · Android appliance · Medium room · 3yr Poly+ · Poly E70 AI camera (auto-tracking / camera switching)</p>
    <p class="text-xs text-emerald-800">Kit only · works with Microsoft Teams, Zoom, or Google Meet · <a href="https://youtu.be/2AX-8x6CWN0?si=8O1Vp7uUVrohw1j1" target="_blank" rel="noopener" class="underline font-medium">X52 + E70 reference video</a></p>
    <button type="button" id="applyPromoBtn" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded shadow-sm">
      Apply this config & generate BOM
    </button>
  `;
  form.appendChild(promoWrap);

  // TAA / JITC compliance toggle (includes note on No Radio variants)
  const taaWrap = document.createElement("div");
  taaWrap.className = "p-3 border-2 border-blue-300 rounded bg-blue-50 space-y-1";
  taaWrap.innerHTML = `
    <label class="inline-flex items-center gap-2 cursor-pointer">
      <input id="taaJitc" type="checkbox" class="w-4 h-4 border">
      <span class="font-semibold text-blue-900">TAA / JITC compliant configuration only</span>
    </label>
    <p class="text-xs text-blue-800 ml-6">When checked, only TAA/JITC-compliant SKUs are used. Standard commercial hardware is excluded. Support terms still apply. No Radio (Wi‑Fi/Bluetooth disabled) TAA variants exist for TC10, Studio X, Studio V, and G62 for restricted RF environments; Room Compute TAA units are already No Radio.</p>
  `;
  form.appendChild(taaWrap);

  form.appendChild(select("typeOfSystem","Select System Type",[
    "BYOD USB Bar only",
    "Windows PC based solution",
    "Android appliance based solution"
  ]));
  form.appendChild(select("platform","Select Primary Platform",["Zoom","Microsoft Teams","Google Meet"]));
  form.appendChild(select("roomSize","Select Room Size",[
    {value:"Small",  label:"Small — Up to 12' from front of room to furthest person to cover"},
    {value:"Medium", label:"Medium — Up to 16' from front of room to furthest person to cover"},
    {value:"Large",  label:"Large — Up to 25' from front of room to furthest person to cover"},
    {value:"Very large", label:"Very Large room. Distance of > 25' from front of room to furthest person to cover"}
  ]));
  const roomSizeHint = document.createElement("div");
  roomSizeHint.id = "roomSizeHint";
  roomSizeHint.className = "text-xs text-gray-600 mt-1";
  roomSizeHint.textContent = "";
  form.appendChild(roomSizeHint);
  form.appendChild(select("mounting","Select Mounting option",["None","Wall","VESA style display mount","Table"]));

  // Expansion mics
  const exp = select("expansionMic","Include Expansion Mic?",[
    "None",
    "Single Analog Exp mic",
    "Existing IP table mics",
    "Existing IP Ceiling mics",
    "New White A2 table mic pod(s) ",
    "New Black A2 table mic pod(s) "
  ]);
  form.appendChild(exp);

  const expansionInfo = document.createElement("div");
  expansionInfo.id="expansionInfo";
  expansionInfo.className="hidden text-sm mt-1 p-2 border-l-4 border-amber-400 bg-amber-50 text-amber-900 rounded";
  expansionInfo.textContent = "Note: IP table/ceiling mics are not supported with V12, X32, X52, or V52. Use Analog or A2 mics.";
  form.appendChild(expansionInfo);

  const a2QtyWrap = document.createElement("div");
  a2QtyWrap.id = "a2QtyWrapper";
  a2QtyWrap.className = "hidden";
  a2QtyWrap.innerHTML = `
    <label class="block font-medium">Number of A2 mic pods</label>
    <select id="a2Qty" class="border p-2 w-full"></select>
    <p id="a2QtyHint" class="text-xs text-gray-600 mt-1"></p>`;

  // Home location for A2 qty control (we may move this under other UI blocks when needed)
  const a2QtyHome = document.createElement("div");
  a2QtyHome.id = "a2QtyHome";
  a2QtyHome.appendChild(a2QtyWrap);
  form.appendChild(a2QtyHome);

  // Optional camera add-on (E70 AI Director / E60) — shown for Android Medium (X52), Large (X72), Very large (G62)
  const camWrap = document.createElement("div");
  camWrap.id = "cameraWrap";
  camWrap.className = "hidden";
  camWrap.innerHTML = `
    <label class="block font-medium">Optional Camera add-on</label>
    <select id="cameraChoice" class="border p-2 w-full">
      <option value="None">None (use built-in camera)</option>
      <option value="E70">Poly E70 (842F8AA) — AI Director auto-tracking / camera switching</option>
      <option value="E60">Poly E60 (9W1A6AA#AC3)</option>
    </select>
    <p class="text-xs text-gray-600 mt-1">E70 recommended for AI camera switching / speaker tracking on X52, X72, or G62. <strong>Kit only</strong> · works with Microsoft Teams, Zoom, or Google Meet. <a href="https://youtu.be/2AX-8x6CWN0?si=8O1Vp7uUVrohw1j1" target="_blank" rel="noopener" class="text-blue-600 underline">X52 + E70 top reference video</a>. E70 requires PoE+ (30W / Class 4) or an external power supply.</p>`;
  form.appendChild(camWrap);

  // E70 power option (wall PSU vs PoE injector) — shown when E70 is selected
  const e70PowerWrap = document.createElement("div");
  e70PowerWrap.id = "e70PowerWrap";
  e70PowerWrap.className = "hidden";
  e70PowerWrap.innerHTML = `
    <label class="block font-medium">E70 power option</label>
    <select id="e70Power" class="border p-2 w-full">
      <option value="None">None — using existing PoE+ switch / infrastructure</option>
      <option value="Wall">Wall power supply (875K6AA)</option>
      <option value="Injector">PoE midspan injector kit (85X03AA#ABA)</option>
    </select>
    <p class="text-xs text-gray-600 mt-1">E70 needs PoE+ (IEEE 802.3at / ~30W) or the optional external wall PSU. Choose injector only if you do not already have a PoE+ capable switch port.</p>`;
  form.appendChild(e70PowerWrap);

  // Modular / Custom rooms (multi-camera + audio options)
  const modularWrap = document.createElement("div");
  modularWrap.id = "modularWrap";
  modularWrap.className = "hidden border rounded p-3 bg-gray-50 space-y-3";
  modularWrap.innerHTML = `
    <div class="font-medium">Custom/Modular room options</div>

    <div>
      <label class="block font-medium">Poly E70 quantity (0–3)</label>
      <div class="text-xs text-gray-600 mb-1">Poly E70 (842F8AA)</div>
      <input id="e70Qty" type="number" min="0" max="3" value="0" class="border p-2 w-full">
    </div>

    <div>
      <label class="block font-medium">Poly E60 quantity (0–3)</label>
      <div class="text-xs text-gray-600 mb-1">Poly E60 (9W1A6AA#AC3)</div>
      <input id="e60Qty" type="number" min="0" max="3" value="0" class="border p-2 w-full">
    </div>

    <div>
      <label class="block font-medium">Audio option</label>
      <select id="audioOption" class="border p-2 w-full">
        <option value="None">None</option>
        <option value="3rd party Audio">3rd party Audio</option>
        <option value="Existing audio">Existing audio</option>
        <option value="Poly Microphones">Poly Microphones</option>
      </select>
      <div class="text-xs text-gray-600 mt-1">Audio options are informational lines in the BOM (no SKU).</div>

    <div id="polyMicWrap" class="hidden">
      <label class="block font-medium">Poly microphone option</label>
      <select id="polyMicOption" class="border p-2 w-full">
        <option value="None">None</option>
        <option value="Existing IP table mics">Existing IP table mics</option>
        <option value="Existing IP Ceiling mics">Existing IP Ceiling mics</option>
        <option value="New White A2 table mic pod(s) ">New White A2 table mic pod(s)</option>
        <option value="New Black A2 table mic pod(s) ">New Black A2 table mic pod(s)</option>
      </select>
      <div class="text-xs text-gray-600 mt-1">Only shown for Android + Custom/Modular when Audio option is “Poly Microphones”.</div>
    </div>
    </div>
  `;
  form.appendChild(modularWrap);


  form.appendChild(select("schedulingPanel","Scheduling panel (additional TC10 outside room)",[
    {value:"None", label:"None"},
    {value:"tc10_black_wall", label:"TC10 Black — wall mount (included)"},
    {value:"tc10_white_wall", label:"TC10 White — wall mount (included)"},
    {value:"tc10_black_glass", label:"TC10 Black — glass mount"},
    {value:"tc10_white_glass", label:"TC10 White — glass mount"}
  ]));
  form.appendChild(select("supportTerm","Select Support term",[
  {value:"poly1",label:"1yr - Poly+"},
  {value:"poly3",label:"3yr - Poly+"},
  {value:"poly5",label:"5yr - Poly+"},
  {value:"analyze1",label:"1yr - Poly+ Analyze"},
  {value:"analyze3",label:"3yr - Poly+ Analyze"},
  {value:"analyze5",label:"5yr - Poly+ Analyze"}
]));

  // Brief overview of Poly+ vs Poly+ Analyze
  const supportInfo = document.createElement("div");
  supportInfo.className = "text-xs text-gray-700 mt-1 p-2 border-l-4 border-blue-400 bg-blue-50 rounded";
  supportInfo.innerHTML = `
    <strong>Poly+</strong> — Essential support: unlimited 24/7 priority technical support, next-business-day advance hardware replacement, and ecosystem cloud partner support.<br>
    <strong>Poly+ Analyze</strong> — Premium tier that includes everything in Poly+ <em>plus</em> coverage for your entire HP Poly estate, HP Poly Lens Pro for Rooms (advanced insights), and enterprise integration / IT tools.<br>
    <a href="https://info.lens.poly.com/docs/premium-Poly-Lens/poly-plus-enterprise#hp-poly-analyze" target="_blank" rel="noopener" class="text-blue-700 underline">Learn more about Poly+ and Poly+ Analyze</a>
  `;
  form.appendChild(supportInfo);

  // Expandable Poly+ vs Poly+ Analyze comparison (Lens Premium features map to Analyze)
  const featuresDetails = document.createElement("details");
  featuresDetails.className = "text-xs mt-2 border border-blue-200 rounded bg-white";
  featuresDetails.innerHTML = `
    <summary class="cursor-pointer select-none px-3 py-2 font-medium text-blue-900 hover:bg-blue-50 rounded">
      Poly+ vs Poly+ Analyze feature comparison — click to expand
    </summary>
    <div class="px-3 pb-3 overflow-x-auto">
      <p class="text-gray-600 mb-2">
        Poly+ Analyze includes everything in Poly+ plus Poly Lens Pro for Rooms / Premium analytics.
        <a href="https://info.lens.poly.com/docs/premium-Poly-Lens/poly-plus-features" target="_blank" rel="noopener" class="text-blue-700 underline">Source</a>
        ·
        <a href="https://info.lens.poly.com/docs/premium-Poly-Lens/poly-plus-enterprise#hp-poly-analyze" target="_blank" rel="noopener" class="text-blue-700 underline">Poly+ Analyze overview</a>
      </p>
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="bg-blue-50">
            <th class="border border-blue-100 px-2 py-1">Feature</th>
            <th class="border border-blue-100 px-2 py-1">Description</th>
            <th class="border border-blue-100 px-2 py-1 text-center whitespace-nowrap">Poly+</th>
            <th class="border border-blue-100 px-2 py-1 text-center whitespace-nowrap">Poly+ Analyze</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">24/7 priority technical support</td>
            <td class="border border-blue-100 px-2 py-1">Unlimited global support via phone, chat, web, and video.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="border border-blue-100 px-2 py-1 font-medium">Advance hardware replacement</td>
            <td class="border border-blue-100 px-2 py-1">Next-business-day replacement before returning the failed unit.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">Ecosystem cloud partner support</td>
            <td class="border border-blue-100 px-2 py-1">Faster resolution with Teams, Zoom, and other cloud partners.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="border border-blue-100 px-2 py-1 font-medium">Coverage for entire HP Poly estate</td>
            <td class="border border-blue-100 px-2 py-1">Unified entitlement across your Poly inventory (not device-by-device only).</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">Office 365 Calendar</td>
            <td class="border border-blue-100 px-2 py-1">Integrate Microsoft 365 calendars with Poly Lens for room schedule insights and utilization.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="border border-blue-100 px-2 py-1 font-medium">Room Analytics</td>
            <td class="border border-blue-100 px-2 py-1">Customizable reports on room utilization and meeting behavior trends.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">Room Insights Dashboard</td>
            <td class="border border-blue-100 px-2 py-1">Interactive dashboard for trends, utilization, and KPIs across your Poly estate.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="border border-blue-100 px-2 py-1 font-medium">Room Insights Feed</td>
            <td class="border border-blue-100 px-2 py-1">Curated feed of significant room utilization and meeting metrics.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">Remote Access (TC8 / TC10)</td>
            <td class="border border-blue-100 px-2 py-1">Remotely access and control touch controllers from Poly Lens.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="border border-blue-100 px-2 py-1 font-medium">Visual Analytics with Power BI</td>
            <td class="border border-blue-100 px-2 py-1">Visualize Poly inventory and combine with other UC datasets in Power BI.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">Zoom Device Management</td>
            <td class="border border-blue-100 px-2 py-1">Monitor Zoom device/room health and manage Poly devices in Poly Lens.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr class="bg-gray-50">
            <td class="border border-blue-100 px-2 py-1 font-medium">API Access to Premium Features</td>
            <td class="border border-blue-100 px-2 py-1">Poly Lens Premium APIs (requires Premium entitlement). Core APIs remain free.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
          <tr>
            <td class="border border-blue-100 px-2 py-1 font-medium">Enterprise integration & IT tools</td>
            <td class="border border-blue-100 px-2 py-1">Broader estate tooling and integration for IT success.</td>
            <td class="border border-blue-100 px-2 py-1 text-center">—</td>
            <td class="border border-blue-100 px-2 py-1 text-center">✓</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  form.appendChild(featuresDetails);

  form.appendChild(select("implementationHelp","Implementation Help",["None","Remote Implementation help","Onsite Implementation help"]));
  form.appendChild(input("accessories","Optional: any additional accessories (comma-separated SKUs)","e.g. 3rd party powered speakers, existing audio, 3rd party DSP, extra cameras, cables"));

  const priceWrap = document.createElement("label");
  priceWrap.className = "inline-flex items-center gap-2";
  priceWrap.innerHTML = `<input id="includePrices" type="checkbox" class="border"> Include Prices (MSRP)`;
  form.appendChild(priceWrap);

  const platformInfo = document.createElement("div");
  platformInfo.id="platformInfo";
  platformInfo.className="hidden text-sm mt-1 p-2 border-l-4 border-amber-400 bg-amber-50 text-amber-900 rounded";
  platformInfo.textContent = "HP Poly does not currently offer a Google Meets imaged PC, but you can use the Poly USB bars along with your own BYOD PC running the regular Meets app, or consider using a Poly Studio X which has the native Google Meets app.";
  form.appendChild(platformInfo);

  const btn = document.createElement("button");
  btn.type="button";
  btn.id="generateBtn";
  btn.className="px-4 py-2 bg-blue-600 text-white rounded";
  btn.textContent="Generate BOM";
  form.appendChild(btn);

  const resultDiv = document.createElement("div");
  resultDiv.id="result";
  resultDiv.className="mt-6 space-y-4";

  app.appendChild(form);
  app.appendChild(resultDiv);

  // Persistent short legalese at bottom of page
  const legalFooter = document.createElement("p");
  legalFooter.className = "mt-8 text-xs text-gray-500 border-t border-gray-300 pt-3 leading-relaxed";
  legalFooter.innerHTML = `<strong>Estimate only.</strong> SKUs, pricing, availability, and configurations are subject to change. Confirm with your HP Poly representative and authorized distributor before quoting or ordering.`;
  app.appendChild(legalFooter);

  // dynamic UI
  function updatePlatformInfo(){
    const p = document.getElementById("platform").value;
    const s = document.getElementById("typeOfSystem").value;
    platformInfo.classList.toggle("hidden", !(s==="Windows PC based solution" && p==="Google Meet"));
  }
  function canShowCameraAddOn(){
    const t = document.getElementById("typeOfSystem")?.value || "";
    const r = document.getElementById("roomSize")?.value || "";
    // X52 (Medium), X72 (Large), G62 (Very large) — Android only
    return t === "Android appliance based solution" && (r === "Medium" || r === "Large" || r === "Very large");
  }
  function updateCameraVisibility(){
    // modular UI may further hide this; base rule is Android Medium/Large/Very large
    const modularActive = (document.getElementById("roomSize")?.value === "Custom/Modular");
    camWrap.classList.toggle("hidden", modularActive || !canShowCameraAddOn());
    updateE70PowerVisibility();
  }
  function updateE70PowerVisibility(){
    const cam = document.getElementById("cameraChoice")?.value || "None";
    const e70Qty = parseInt(document.getElementById("e70Qty")?.value || "0", 10) || 0;
    const modularActive = (document.getElementById("roomSize")?.value === "Custom/Modular");
    const show = (!modularActive && cam === "E70") || (modularActive && e70Qty > 0);
    const wrap = document.getElementById("e70PowerWrap");
    if (wrap) wrap.classList.toggle("hidden", !show);
  }
  // Max A2 table mics per host (HP Poly Studio A2 admin guide)
  // V12: 1 | X32: 2 | X52/V52: 4 | X72/V72: 4 | G62: 8
  function a2MaxForSelection(){
    const t = document.getElementById("typeOfSystem")?.value || "";
    const r = document.getElementById("roomSize")?.value || "";
    const isUSB = (t==="BYOD USB Bar only" || t==="Windows PC based solution");
    if (r==="Very large" || (t==="Android appliance based solution" && r==="Very large")) return 8; // G62
    if (r==="Large") return 4; // V72 / X72
    if (r==="Medium") return 4; // V52 / X52
    if (r==="Small") {
      if (isUSB) return 1; // V12
      return 2; // X32
    }
    if (r==="Custom/Modular") return 8; // modular often G62-class
    return 4;
  }

  function refreshA2QtyOptions(){
    const sel = document.getElementById("a2Qty");
    const hint = document.getElementById("a2QtyHint");
    if (!sel) return;
    const max = a2MaxForSelection();
    const prev = parseInt(sel.value || "1", 10) || 1;
    sel.innerHTML = "";
    for (let n = 1; n <= 8; n++){
      const opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = String(n);
      if (n > max) {
        opt.disabled = true;
        opt.textContent = n + " (exceeds max for this system)";
      }
      sel.appendChild(opt);
    }
    sel.value = String(Math.min(prev, max));
    if (hint) {
      const t = document.getElementById("typeOfSystem")?.value || "";
      const r = document.getElementById("roomSize")?.value || "";
      const isUSB = (t==="BYOD USB Bar only" || t==="Windows PC based solution");
      let host = "selected system";
      if (r==="Small" && isUSB) host = "V12 (max 1)";
      else if (r==="Small") host = "X32 (max 2)";
      else if (r==="Medium") host = "X52 / V52 (max 4)";
      else if (r==="Large") host = "X72 / V72 (max 4)";
      else if (r==="Very large") host = "G62 (max 8)";
      else if (r==="Custom/Modular") host = "modular / G62-class (max 8)";
      hint.textContent = "Per HP Poly Studio A2 admin guide: " + host + ".";
    }
  }

  function updateExpansionMicUI(){
    const t = document.getElementById("typeOfSystem").value;
    const r = document.getElementById("roomSize").value;
    const expSel = document.getElementById("expansionMic");

    const restrict =
      ((t==="BYOD USB Bar only" || t==="Windows PC based solution") && (r==="Small" || r==="Medium")) ||
      (t==="Android appliance based solution" && (r==="Small" || r==="Medium"));

    const all = [
      "None",
      "Single Analog Exp mic",
      "Existing IP table mics",
      "Existing IP Ceiling mics",
      "New White A2 table mic pod(s) ",
      "New Black A2 table mic pod(s) "
    ];

    // Hide IP options in smaller rooms; for Very large, hide analog option entirely
    let allowed = restrict
      ? ["None","Single Analog Exp mic","New White A2 table mic pod(s) ","New Black A2 table mic pod(s) "]
      : all;

    if (r === "Very large") {
      allowed = allowed.filter(o => o !== "Single Analog Exp mic");
    }

    const current = expSel.value;
    expSel.innerHTML = `<option value="">--</option>${allowed.map(o=>`<option value="${o}">${o}</option>`).join("")}`;
    expSel.value = allowed.includes(current) ? current : "None";
    expansionInfo.classList.toggle("hidden", !restrict);

    const showA2 = expSel.value.includes("A2 table mic pod");
    a2QtyWrap.classList.toggle("hidden", !showA2);
    if (showA2) refreshA2QtyOptions();
  }


  function updateRoomSizeHint(){
    const r = document.getElementById("roomSize").value;
    const map = {
      "Small":  "Up to 12' from front of room to furthest person to cover",
      "Medium": "Up to 16' from front of room to furthest person to cover",
      "Large":  "Up to 25' from front of room to furthest person to cover",
      "Very large": "Distance of > 25' from front of room to furthest person to cover"
    };
    const el = document.getElementById("roomSizeHint");
    if (!el) return;
    el.textContent = map[r] ? map[r] : "";
  }



  function updateCustomRoomSizeOption(){
    const t = document.getElementById("typeOfSystem").value;
    const p = document.getElementById("platform").value;
    const roomSel = document.getElementById("roomSize");
    const allow = ((t==="Windows PC based solution" || t==="Android appliance based solution") && (p==="Zoom" || p==="Microsoft Teams"));

    // Find existing custom option
    const existing = Array.from(roomSel.options).find(o => o.value === "Custom/Modular");
    if (allow && !existing){
      const opt = document.createElement("option");
      opt.value = "Custom/Modular";
      opt.textContent = "Custom/Modular room, multi-camera, 3rd party audio options, i.e multi-purpose rooms.";
      roomSel.appendChild(opt);
    }
    if (!allow && existing){
      const wasSelected = (roomSel.value === "Custom/Modular");
      existing.remove();
      if (wasSelected) roomSel.value = "";
    }
  }

  function updateModularUI(){
    const t = document.getElementById("typeOfSystem").value;
    const p = document.getElementById("platform").value;
    const r = document.getElementById("roomSize").value;

    const allow = ((t==="Windows PC based solution" || t==="Android appliance based solution") && (p==="Zoom" || p==="Microsoft Teams"));
    const active = allow && r === "Custom/Modular";

    modularWrap.classList.toggle("hidden", !active);

    // Hide expansion mic controls when modular room is selected (audio handled separately)
    const expSel = document.getElementById("expansionMic");
    if (expSel && expSel.parentElement) expSel.parentElement.classList.toggle("hidden", active);
    expansionInfo.classList.toggle("hidden", active);
    if (active) a2QtyWrap.classList.toggle("hidden", true);
    if (active && expSel) expSel.value = "None";

    // Android-only: allow "Poly Microphones" audio path with mic options
    const audioSel = document.getElementById("audioOption");
    const polyOptWrap = document.getElementById("polyMicWrap");
    const polyMicSel = document.getElementById("polyMicOption");

    const isAndroidModular = active && (t==="Android appliance based solution");

    // If not Android modular, force-remove Poly Microphones selection
    if (audioSel){
      const polyOption = [...audioSel.options].find(o => o.value==="Poly Microphones");
      if (polyOption){
        // Keep option present but disable for non-Android modular (simple + reliable)
        polyOption.disabled = !isAndroidModular;
      }
      if (!isAndroidModular && audioSel.value==="Poly Microphones"){
        audioSel.value = "None";
      }
    }

    // Show the Poly mic dropdown only when Android modular + Poly Microphones selected
    const showPolyWrap = isAndroidModular && audioSel && audioSel.value==="Poly Microphones";
    if (polyOptWrap) polyOptWrap.classList.toggle("hidden", !showPolyWrap);

    // If we're in the Android modular + Poly Microphones path, move the A2 qty control directly
    // under the Poly mic dropdown so it's obvious (reuses the same input id="a2Qty").
    const a2Home = document.getElementById("a2QtyHome");
    if (showPolyWrap && polyOptWrap && a2Home){
      if (a2QtyWrap.parentElement !== polyOptWrap) polyOptWrap.appendChild(a2QtyWrap);
    } else if (a2Home){
      if (a2QtyWrap.parentElement !== a2Home) a2Home.appendChild(a2QtyWrap);
    }

// A2 quantity shown when A2 pods selected in the poly mic dropdown
    // IMPORTANT: Only manage A2 qty visibility here when modular is active.
    // For non-modular flows (e.g., Android "Very large" + Expansion Mic = A2),
    // updateExpansionMicUI() controls the A2 qty prompt.
    if (active){
      if (showPolyWrap && polyMicSel){
        const wantsA2 = (polyMicSel.value || "").includes("A2");
        a2QtyWrap.classList.toggle("hidden", !wantsA2);
      } else {
        a2QtyWrap.classList.toggle("hidden", true);
      }
    }
    // Hide single-camera picker if modular is active; otherwise show for Android Medium/Large/Very large
    camWrap.classList.toggle("hidden", active ? true : !canShowCameraAddOn());
  }
  document.getElementById("platform").addEventListener("change", ()=>{updatePlatformInfo();updateCustomRoomSizeOption();updateCameraVisibility();updateExpansionMicUI();updateModularUI();});
  document.getElementById("typeOfSystem").addEventListener("change", ()=>{updatePlatformInfo();updateCustomRoomSizeOption();updateCameraVisibility();updateExpansionMicUI();updateModularUI();});
  document.getElementById("roomSize").addEventListener("change", ()=>{updateCustomRoomSizeOption();updateCameraVisibility();updateExpansionMicUI();updateRoomSizeHint();updateModularUI();});
  document.getElementById("expansionMic").addEventListener("change", ()=>{updateExpansionMicUI();updateModularUI();});
  document.getElementById("audioOption").addEventListener("change", ()=>{updateModularUI();});
  document.getElementById("polyMicOption").addEventListener("change", ()=>{updateModularUI();});
  document.getElementById("cameraChoice")?.addEventListener("change", ()=>{updateE70PowerVisibility();});
  document.getElementById("e70Qty")?.addEventListener("input", ()=>{updateE70PowerVisibility();});
  document.getElementById("e70Qty")?.addEventListener("change", ()=>{updateE70PowerVisibility();});
  updateCustomRoomSizeOption(); updatePlatformInfo(); updateCameraVisibility(); updateExpansionMicUI(); updateRoomSizeHint(); updateModularUI();

  // ---------- Announcement dismiss (session) ----------
  const dismissBtn = document.getElementById("dismissAnnouncement");
  if (dismissBtn) {
    if (sessionStorage.getItem("polyBomAnnounceDismissed") === "1") {
      announceWrap.classList.add("hidden");
    }
    dismissBtn.addEventListener("click", () => {
      announceWrap.classList.add("hidden");
      sessionStorage.setItem("polyBomAnnounceDismissed", "1");
    });
  }

  // ---------- Featured promo: auto-fill Teams Android Medium + 3yr Poly+ + E70 ----------
  const applyPromoBtn = document.getElementById("applyPromoBtn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", () => {
      // Clear TAA so commercial path is used (promo is commercial)
      const taaCb = document.getElementById("taaJitc");
      if (taaCb) taaCb.checked = false;

      document.getElementById("typeOfSystem").value = "Android appliance based solution";
      document.getElementById("platform").value = "Microsoft Teams";
      document.getElementById("roomSize").value = "Medium";
      document.getElementById("mounting").value = "None";
      document.getElementById("expansionMic").value = "None";
      document.getElementById("schedulingPanel").value = "None";
      document.getElementById("supportTerm").value = "poly3";
      document.getElementById("implementationHelp").value = "None";
      const acc = document.getElementById("accessories");
      if (acc) acc.value = "";

      // Fire change handlers so camera picker becomes visible
      document.getElementById("typeOfSystem").dispatchEvent(new Event("change"));
      document.getElementById("platform").dispatchEvent(new Event("change"));
      document.getElementById("roomSize").dispatchEvent(new Event("change"));

      // Set E70 after visibility updates
      const camSel = document.getElementById("cameraChoice");
      if (camSel) camSel.value = "E70";

      // Generate immediately
      generate();
    });
  }

  // ---------- core generate ----------
  btn.addEventListener("click", () => generate());

  function generate(){
    const typeOfSystem = document.getElementById("typeOfSystem").value;
    const platform     = document.getElementById("platform").value;
    const roomSize     = document.getElementById("roomSize").value;
    const mounting     = document.getElementById("mounting").value;
    const expansionMic = document.getElementById("expansionMic").value;
    const scheduling   = document.getElementById("schedulingPanel").value;
    const supportTerm  = document.getElementById("supportTerm").value;
    const implHelp     = document.getElementById("implementationHelp").value;
    const accessories  = (document.getElementById("accessories").value || "").split(",").map(s=>s.trim()).filter(Boolean);
    const includePrices= document.getElementById("includePrices").checked;
    const taaJitc      = document.getElementById("taaJitc")?.checked || false;

    if (!typeOfSystem || !platform || !roomSize){
      resultDiv.innerHTML = `<div class="text-red-700 bg-red-50 border border-red-200 p-3 rounded">Please select System type, Platform, and Room size.</div>`;
      return;
    }

    const results = [];
    const isUSBorPC = (typeOfSystem==="BYOD USB Bar only" || typeOfSystem==="Windows PC based solution");

    // ========== TAA / JITC MODE ==========
    // Prefer JITC variant when available; fall back to TAA-only (radio variants).
    if (taaJitc) {
      const pick = (jitcSku, taaSku) => jitcSku || taaSku;
      const tc10Sku = () => pick("973F9AA", "977L6AA"); // Black TC10 TAA JITC / TAA

      if (isUSBorPC) {
        // USB / PC based → V-series bars
        if (roomSize === "Small") {
          addLine(results, "B95SPAA"); // V12 TAA
          addSupport(results, "v12", supportTerm);
        } else if (roomSize === "Medium") {
          addLine(results, pick("A09D6AA", "A09D5AA")); // V52
          addSupport(results, "v52", supportTerm);
        } else {
          addLine(results, pick("AV1E4AA", null)); // V72
          addSupport(results, "v72", supportTerm);
        }
        if (typeOfSystem === "Windows PC based solution") {
          if (platform === "Microsoft Teams") {
            if (roomSize === "Small" || roomSize === "Medium") {
              addLine(results, "DS1R6AW"); // Studio 5 Room Compute TAA (already No Radio)
            } else {
              addLine(results, "DS0W9AW"); // Studio 7 Room Compute TAA (already No Radio)
            }
            addSupport(results, "g9plus_mtr", supportTerm);
            addLine(results, tc10Sku());
            addSupport(results, "tc10", supportTerm);
          } else {
            addLine(results, tc10Sku());
            addSupport(results, "tc10", supportTerm);
          }
        }
      } else {
        // Android appliance → X-series / G62
        if (roomSize === "Small") {
          addLine(results, pick("A3SW0AA", "A3SV9AA")); // X32
          addSupport(results, "x32", supportTerm);
          addLine(results, tc10Sku());
          addSupport(results, "tc10", supportTerm);
        } else if (roomSize === "Medium") {
          addLine(results, pick("8D8K4AA", "8D8K3AA")); // X52
          addSupport(results, "x52", supportTerm);
          addLine(results, tc10Sku());
          addSupport(results, "tc10", supportTerm);
        } else if (roomSize === "Large") {
          addLine(results, pick("A4MA2AA", "A4MA1AA")); // X72
          addSupport(results, "x72", supportTerm);
          addLine(results, tc10Sku());
          addSupport(results, "tc10", supportTerm);
        } else {
          addLine(results, pick("99T11AA", "99T10AA")); // G62
          addSupport(results, "g62", supportTerm);
          addLine(results, tc10Sku());
          addSupport(results, "tc10", supportTerm);
        }
      }

      // Scheduling panel TC10 (TAA path)
      if (scheduling && scheduling !== "None" && SCHEDULING_MAP[scheduling]) {
        const sch = SCHEDULING_MAP[scheduling];
        addLine(results, sch.taaTc10 || tc10Sku(), sch.label);
        addSupport(results, "tc10", supportTerm);
        if (sch.glassMount) addLine(results, sch.glassMount);
      }

      // Expansion / A2 mics (TAA versions) — qty clamped per admin guide
      const wantsA2White = (expansionMic || "").includes("New White A2");
      const wantsA2Black = (expansionMic || "").includes("New Black A2");
      if (wantsA2White || wantsA2Black) {
        let qty = parseInt(document.getElementById("a2Qty")?.value || "1", 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        const maxA2 = a2MaxForSelection();
        if (qty > maxA2) qty = maxA2;
        const podSku = wantsA2White ? "B22X5AA" : "B22X7AA"; // TAA White / Black
        addLine(results, podSku, "(A2 mic pod TAA)", qty);
        addSupport(results, "a2_mic", supportTerm, qty);
        addLine(results, "B22X3AA"); // A2 Bridge TAA
        addSupport(results, "a2_bridge", supportTerm);
      }

      // Camera add-ons (TAA) for G62 / X52 / X72
      {
        const isG62 = hasSku(results, "99T11AA") || hasSku(results, "99T10AA") || hasSku(results, "99T12AA") || hasSku(results, "99T13AA");
        const isX52 = hasSku(results, "8D8K4AA") || hasSku(results, "8D8K3AA");
        const isX72 = hasSku(results, "A4MA2AA") || hasSku(results, "A4MA1AA") || hasSku(results, "A4MA6AA") || hasSku(results, "A4MA4AA");
        if (isG62 || isX52 || isX72) {
          const cam = document.getElementById("cameraChoice")?.value;
          if (cam === "E60") {
            addLine(results, "9W1A7AA"); // E60 TAA
            addSupport(results, "e60", supportTerm);
          } else if (cam === "E70") {
            addLine(results, pick("886C9AA", "886C8AA")); // E70 TAA JITC / TAA
            addSupport(results, "e70", supportTerm);
            const e70Pwr = document.getElementById("e70Power")?.value || "None";
            if (e70Pwr === "Wall") {
              if (!hasSku(results,"875K6AA")) addLine(results,"875K6AA","Poly E70 wall / external power supply (12V 5A)");
            } else if (e70Pwr === "Injector") {
              if (!hasSku(results,"85X03AA#ABA")) addLine(results,"85X03AA#ABA","Poly E70 / Trio PoE midspan injector kit");
            }
          }
        }
      }

      // Mounting – reuse commercial mount kits (same physical mounts)
      (function addTaaMounting() {
        if (!mounting || mounting === "None") return;
        const isV12 = hasSku(results, "B95SPAA") || hasSku(results, "B95SNAA");
        const isV52 = hasSku(results, "A09D6AA") || hasSku(results, "A09D5AA") || hasSku(results, "A09D9AA") || hasSku(results, "A09D8AA");
        const isV72 = hasSku(results, "AV1E4AA") || hasSku(results, "AV1E6AA");
        const isX32 = hasSku(results, "A3SW0AA") || hasSku(results, "A3SV9AA") || hasSku(results, "A3SW2AA") || hasSku(results, "A3SW1AA");
        const isX52 = hasSku(results, "8D8K4AA") || hasSku(results, "8D8K3AA");
        const isX72 = hasSku(results, "A4MA2AA") || hasSku(results, "A4MA1AA") || hasSku(results, "A4MA6AA") || hasSku(results, "A4MA4AA");
        if (isV12 || isX32) {
          if (mounting === "Table") addLine(results, "875L5AA");
          else addLine(results, "875L6AA");
        } else if (isX52 || isV52) {
          if (mounting === "Wall") addLine(results, "875L8AA");
          else if (mounting === "VESA style display mount") addLine(results, "875L9AA");
          else if (mounting === "Table") addLine(results, "875M0AA");
        } else if (isX72 || isV72) {
          if (mounting === "VESA style display mount") addLine(results, "875L2AA");
          else if (mounting === "Table") addLine(results, "875L3AA");
        }
      })();
    }
    // ========== END TAA / JITC MODE ==========

    // ---- base devices (standard commercial path – skipped in TAA/JITC mode)
    if (!taaJitc && roomSize==="Custom/Modular"){
      // Custom/Modular rooms (multi-camera + 3rd party/existing audio options)
      const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
      const e70Qty = clamp(parseInt((document.getElementById("e70Qty")||{value:"0"}).value || "0",10) || 0, 0, 3);
      const e60Qty = clamp(parseInt((document.getElementById("e60Qty")||{value:"0"}).value || "0",10) || 0, 0, 3);
      const audio  = ((document.getElementById("audioOption")||{value:"None"}).value || "None");

      if (typeOfSystem==="Windows PC based solution"){
        // Base: Windows PC + TC10
        // Special case: Zoom platform uses Zoom Rooms PC (not MTR PC)
        if (platform==="Zoom"){
          addLine(results,"9C422AW#ABA");
          addSupport(results, "zoom_pc", supportTerm);
        } else {
          addLine(results,"A1ZB6AW#ABA");
          addSupport(results, "g9plus_mtr", supportTerm);
        }

        addLine(results,"875K5AA");
        addSupport(results, "tc10", supportTerm);
      } else if (typeOfSystem==="Android appliance based solution"){
        // Base: G62 + TC10
        addLine(results,"A01KCAA#AC3");
        addSupport(results, "g62", supportTerm);

        addLine(results,"875K5AA");
        addSupport(results, "tc10", supportTerm);
      }

      // Cameras (quantities)
      if (e70Qty>0){
        addLine(results,"842F8AA","Poly E70",e70Qty);
        addSupport(results, "e70", supportTerm, e70Qty);
        // E70 power accessory (one per system is typical; scale only if needed)
        const e70Pwr = document.getElementById("e70Power")?.value || "None";
        if (e70Pwr === "Wall") {
          if (!hasSku(results,"875K6AA")) addLine(results,"875K6AA","Poly E70 wall / external power supply (12V 5A)", Math.min(e70Qty, 1));
        } else if (e70Pwr === "Injector") {
          if (!hasSku(results,"85X03AA#ABA")) addLine(results,"85X03AA#ABA","Poly E70 / Trio PoE midspan injector kit", Math.min(e70Qty, 1));
        }
      }
      if (e60Qty>0){
        addLine(results,"9W1A6AA#AC3","Poly E60",e60Qty);
        addSupport(results, "e60", supportTerm, e60Qty);
      }

      // Audio handling
      if (typeOfSystem==="Android appliance based solution" && audio==="Poly Microphones"){
        const micChoice = (document.getElementById("polyMicOption")?.value) || "None";

        // Apply the same mic add logic used elsewhere (A2 + IP options), without requiring Expansion Mic selection.
        const wantsA2White = micChoice.includes("New White A2");
        const wantsA2Black = micChoice.includes("New Black A2");

        if (wantsA2White || wantsA2Black){
          let qty = parseInt(document.getElementById("a2Qty").value || "1",10);
          if (isNaN(qty) || qty<1) qty=1;
          const maxA2 = a2MaxForSelection();
          if (qty > maxA2) qty = maxA2;

          const podSku = wantsA2White ? "B22X4AA#AC3" : "B22X6AA#AC3";
          addLine(results,podSku,"(A2 mic pod)",qty);

          // PolyPlus support for A2 table mic pods (per mic pod)
          addSupport(results, "a2_mic", supportTerm, qty);

          // A2 Bridge + support
          addLine(results,"B22X2AA#AC3");
          addSupport(results, "a2_bridge", supportTerm);

          // Add required PoE for A2 bridge
          if (!hasSku(results,"A02F9AA")) addLine(results,"A02F9AA");
        }

        if (micChoice==="Existing IP table mics"){
          addLine(results,"874R3AA");
          addLine(results,"GSM4210PD M4250 or any from https://support.hp.com/ro-en/document/ish_13031025-13026020-16","3rd party Netgear AV PoE switch with PTP (needed with multiple Poly IP mic arrays)");
        } else if (micChoice==="Existing IP Ceiling mics"){
          addLine(results,"875S1AA");
          addLine(results,"GSM4210PD M4250 or any from https://support.hp.com/ro-en/document/ish_13031025-13026020-16","3rd party Netgear AV PoE switch with PTP (needed with multiple Poly IP mic arrays)");
        } else if (micChoice==="None"){
          // nothing to add
        }

      } else {
        // Audio line (informational, no SKU)
        const audioDesc = (audio==="None") ? "Audio: None selected" : ("Audio: " + audio);
        results.push({ sku:"", description: audioDesc, msrp:"", quantity:1 });
      }

    } else if (!taaJitc) {

    if (isUSBorPC){
      if (roomSize==="Small"){
        addLine(results,"A9DD8AA#ABA"); // V12
        addSupport(results, "v12", supportTerm);
      } else if (roomSize==="Medium"){
        addLine(results,"A09D4AA#ABA"); // V52
        addSupport(results, "v52", supportTerm);
      } else { // Large or Very large -> V72
        addLine(results,"AV1E3AA#ABA");
        addSupport(results, "v72", supportTerm);
      }

      if (typeOfSystem==="Windows PC based solution"){
        if (platform==="Zoom"){
          addLine(results,"9C422AW#ABA","HP Mini Conf G9 wZR i7-12700T 16GB Zoom Room PC only (must add TC10, Camera, Audio)");
          addSupport(results, "zoom_pc", supportTerm);
          addLine(results,"875K5AA");
          addSupport(results, "tc10", supportTerm);
        } else if (platform==="Microsoft Teams"){
          addLine(results,"A1ZB6AW#ABA"); // G9Plus MTR PC only
          addSupport(results, "g9plus_mtr", supportTerm);
          addLine(results,"875K5AA");
          addSupport(results, "tc10", supportTerm);
        } else if (platform==="Google Meet"){
          addLine(results,"9C422AW#ABA");
          addSupport(results, "zoom_pc", supportTerm);
        }
      }
    } else {
      // Android
      if (roomSize==="Small"){
        addLine(results,"A3SV5AA#ABA"); // X32
        addSupport(results, "x32", supportTerm);
      } else if (roomSize==="Medium"){
        addLine(results,"8D8K2AA#ABA"); // X52
        addSupport(results, "x52", supportTerm);
        addLine(results,"875K5AA");
        addSupport(results, "tc10", supportTerm);
      } else if (roomSize==="Large"){
        addLine(results,"A4LZ8AA#ABA"); // X72
        addSupport(results, "x72", supportTerm);
        addLine(results,"875K5AA");
        addSupport(results, "tc10", supportTerm);
      } else {
        addLine(results,"A01KCAA#AC3"); // G62
        addSupport(results, "g62", supportTerm);
      }
    }
    }

    // --- Standard commercial-only blocks (skipped in TAA/JITC mode) ---
    if (!taaJitc) {

    // Guard: Android Very Large must be G62 (remove X72 if present)
    if (typeOfSystem==="Android appliance based solution" && roomSize==="Very large"){
      for (let i=results.length-1;i>=0;i--){
        if (["A4MA7AA#ABA","U98SXPV","U98SYPV","A4LZ8AA#ABA"].includes(results[i].sku)) results.splice(i,1);
      }
      if (!hasSku(results,"A01KCAA#AC3")) addLine(results,"A01KCAA#AC3");
    }

    // Optional camera add-ons (E70 / E60) for X52, X72, G62
    (function(){
      const isG62 = hasSku(results,"A01KCAA#AC3");
      const isX52 = hasSku(results,"8D8K2AA#ABA");
      const isX72 = hasSku(results,"A4LZ8AA#ABA");
      if (!isG62 && !isX52 && !isX72) return;
      const cam = document.getElementById("cameraChoice")?.value;
      if (cam==="E60"){
        if (!hasSku(results,"9W1A6AA#AC3")) addLine(results,"9W1A6AA#AC3");
        addSupport(results, "e60", supportTerm);
      } else if (cam==="E70"){
        if (!hasSku(results,"842F8AA")) addLine(results,"842F8AA");
        addSupport(results, "e70", supportTerm);
        // E70 power accessory
        const e70Pwr = document.getElementById("e70Power")?.value || "None";
        if (e70Pwr === "Wall") {
          if (!hasSku(results,"875K6AA")) addLine(results,"875K6AA","Poly E70 wall / external power supply (12V 5A)");
        } else if (e70Pwr === "Injector") {
          if (!hasSku(results,"85X03AA#ABA")) addLine(results,"85X03AA#ABA","Poly E70 / Trio PoE midspan injector kit");
        }
      }
      // G62 path historically ensured TC10 here
      if (isG62 && !hasSku(results,"875K5AA")){
        addLine(results,"875K5AA");
        addSupport(results, "tc10", supportTerm);
      }
    })();

    // X32 extras: PoE + TC10 (+ PolyPlus)
    if (hasSku(results,"A3SV5AA#ABA")){
      if (!hasSku(results,"B5NH6AA#ABA")) addLine(results,"B5NH6AA#ABA");
      if (!hasSku(results,"875K5AA")) addLine(results,"875K5AA");
      addSupport(results, "tc10", supportTerm);
    }

    // V12 needs same PoE injector as X32
    if (hasSku(results,"A9DD8AA#ABA") && !hasSku(results,"B5NH6AA#ABA")) addLine(results,"B5NH6AA#ABA");

    // Scheduling panel = TC10 (+ optional glass mount)
    if (scheduling && scheduling !== "None" && SCHEDULING_MAP[scheduling]) {
      const sch = SCHEDULING_MAP[scheduling];
      addLine(results, sch.commercialTc10, sch.label);
      addSupport(results, "tc10", supportTerm);
      if (sch.glassMount) addLine(results, sch.glassMount);
    }

    // Expansion mic logic
    if ((roomSize==="Medium" || roomSize==="Large") && expansionMic==="Single Analog Exp mic") {
      if (!hasSku(results,"875M6AA")) addLine(results,"875M6AA");
      if (!hasSku(results,"875M4AA")) addLine(results,"875M4AA");
    }
    const wantsA2White = expansionMic.includes("New White A2");
    const wantsA2Black = expansionMic.includes("New Black A2");
    if (wantsA2White || wantsA2Black){
      let qty = parseInt(document.getElementById("a2Qty").value || "1",10);
      if (isNaN(qty) || qty<1) qty=1;
      const maxA2 = a2MaxForSelection();
      if (qty > maxA2) qty = maxA2;
      const v12InBOM = hasSku(results,"A9DD8AA#ABA");
      if (v12InBOM) qty = Math.min(qty, 1);
      const podSku = wantsA2White ? "B22X4AA#AC3" : "B22X6AA#AC3";
      addLine(results,podSku,"(A2 mic pod)",qty);
      addSupport(results, "a2_mic", supportTerm, qty);

      if (!v12InBOM){
        addLine(results,"B22X2AA#AC3");
        addSupport(results, "a2_bridge", supportTerm);
      }
      if (hasSku(results,"B22X2AA#AC3") && !hasSku(results,"A02F9AA")) addLine(results,"A02F9AA");
      if ((hasSku(results,"A3SV5AA#ABA") || hasSku(results,"8D8K2AA#ABA") || hasSku(results,"8D8L1AA#ABA") || hasSku(results,"A09D4AA#ABA")) && !hasSku(results,"4Z7Z7AA")){
        addLine(results,"4Z7Z7AA");
      }
    }
    if (expansionMic==="Existing IP table mics"){
      addLine(results,"874R3AA");
      addLine(results,"GSM4210PD M4250 or any from https://support.hp.com/ro-en/document/ish_13031025-13026020-16","3rd party Netgear AV PoE switch with PTP (needed with multiple Poly IP mic arrays)");
    } else if (expansionMic==="Existing IP Ceiling mics"){
      addLine(results,"875S1AA");
      addLine(results,"GSM4210PD M4250 or any from https://support.hp.com/ro-en/document/ish_13031025-13026020-16","3rd party Netgear AV PoE switch with PTP (needed with multiple Poly IP mic arrays)");
    }

    } // end if (!taaJitc) — standard commercial product blocks

    // Accessories passthrough (allowed in both modes)
    accessories.forEach(sku => addLine(results, sku, sku));

    
    // Implementation help (works for both commercial and TAA SKUs)
    if (implHelp && implHelp!=="None"){
      let remoteSku = "";
      // Windows PC based OR BYOD USB Bar only -> PROECOSYS02
      if (typeOfSystem==="Windows PC based solution" || typeOfSystem==="BYOD USB Bar only") remoteSku = "PROECOSYS02";
      // G62 path (commercial or TAA) -> PROG7500RE2
      else if (hasSku(results,"A01KCAA#AC3") || hasSku(results,"99T11AA") || hasSku(results,"99T10AA") || hasSku(results,"99T13AA") || hasSku(results,"99T12AA")) remoteSku = "PROG7500RE2";
      // Android X-series (commercial or TAA) -> PROSTDIOXR2
      else if (
        hasSku(results,"A3SV5AA#ABA") || hasSku(results,"8D8K2AA#ABA") || hasSku(results,"A4LZ8AA#ABA") ||
        hasSku(results,"A3SW0AA") || hasSku(results,"A3SV9AA") || hasSku(results,"A3SW2AA") || hasSku(results,"A3SW1AA") ||
        hasSku(results,"8D8K4AA") || hasSku(results,"8D8K3AA") ||
        hasSku(results,"A4MA2AA") || hasSku(results,"A4MA1AA") || hasSku(results,"A4MA6AA") || hasSku(results,"A4MA4AA")
      ) remoteSku = "PROSTDIOXR2";

      if (implHelp==="Remote Implementation help" && remoteSku) addLine(results, remoteSku);
      if (implHelp==="Onsite Implementation help"){
        if (remoteSku) addLine(results, remoteSku);
        addLine(results,"PROSMTHND04");
      }
    }
    // Mounting logic (real SKUs)
    (function addMounting(){
      if (!mounting || mounting==="None") return;

      const isV12 = hasSku(results,"A9DD8AA#ABA") || hasSku(results,"B95SNAA") || hasSku(results,"B95SPAA");
      const isV52 = hasSku(results,"A09D4AA#ABA") || hasSku(results,"A09D8AA") || hasSku(results,"A09D5AA") || hasSku(results,"A09D6AA") || hasSku(results,"A09D9AA");
      const isV72 = hasSku(results,"AV1E3AA#ABA") || hasSku(results,"AV1E6AA") || hasSku(results,"AV1E4AA");
      const isX32 = hasSku(results,"A3SV5AA#ABA") || hasSku(results,"A3SW1AA") || hasSku(results,"A3SW2AA") || hasSku(results,"A3SV9AA") || hasSku(results,"A3SW0AA");
      const isX52 = hasSku(results,"8D8K2AA#ABA") || hasSku(results,"8D8L1AA#ABA") || hasSku(results,"8D8K3AA") || hasSku(results,"8D8K4AA");
      const isX72 = hasSku(results,"A4LZ8AA#ABA") || hasSku(results,"A4MA7AA#ABA") || hasSku(results,"A4MA4AA") || hasSku(results,"A4MA1AA") || hasSku(results,"A4MA2AA") || hasSku(results,"A4MA6AA");

      // V12 / X32
      if (isV12 || isX32){
        if (mounting==="Table") addLine(results,"875L5AA");
        else /* Wall or VESA */ addLine(results,"875L6AA");
        return;
      }
      // X50/X52/V52
      if (isX52 || isV52){
        if (mounting==="Wall") addLine(results,"875L8AA");
        else if (mounting==="VESA style display mount") addLine(results,"875L9AA");
        else if (mounting==="Table") addLine(results,"875M0AA");
        return;
      }
      // X70/X72/V72
      if (isX72 || isV72){
        if (mounting==="VESA style display mount") addLine(results,"875L2AA");
        else if (mounting==="Table") addLine(results,"875L3AA");
        else if (mounting==="Wall"){
          // Insert a NOTE row (no SKU)
          addLine(results, "NOTE-WALL-X70X72V72", "Wall mounting not supported for X70/X72/V72 — choose VESA or Table.", 1);
        }
      }
    })();

    // Note row for Windows PC + Google Meet
    const noteRow = (typeOfSystem==="Windows PC based solution" && platform==="Google Meet")
      ? `<tr class='bg-amber-50 text-amber-900'>
           <td class='border px-4 py-2 align-top italic'>NOTE</td>
           <td class='border px-4 py-2 align-top' colspan='2'>HP Poly does not currently offer a Google Meets imaged PC, but you can use the Poly USB bars along with your own BYOD PC running the regular Meets app, or consider using a Poly Studio X which has the native Google Meets app.</td>
           ${includePrices ? `<td class='border px-4 py-2 align-top'>—</td>` : ``}
         </tr>`
      : "";

    // Render table
    let html = `
<p class="text-xs text-gray-500 mb-1">Build ${VERSION} — generated ${new Date().toLocaleDateString()}</p>
<p class="text-sm mb-2"><a class="text-blue-600 underline" target="_blank" href="https://hpdigitalroom.sales.ext.hp.com/ls/220d4a87-7110-4c75-83aa-53af74106f7b/Yv7NSgCbYloyQ79p">Quoting Guide</a>&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;<a class="text-blue-600 underline" target="_blank" href="https://www.hp.com/us-en/poly/spaces.html">Poly Spaces</a></p>
<p class="text-sm mb-4"><a class="text-blue-600 underline" target="_blank" href="https://hpdigitalroom.sales.ext.hp.com/ls/220d4a87-7110-4c75-83aa-53af74106f7b/Yv7NSgCbYloyQ79p">Glen Bevcar's Collab Reference Excel cheat sheet</a>&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;<a class="text-blue-600 underline" target="_blank" href="https://h30434.www3.hp.com/t5/Meeting-Room-Solutions/Dimensional-Drawings-for-Poly-Products-and-accessories/td-p/8738366">Dimensional Drawings for Poly Products</a></p>
<h2 class="font-semibold mb-2">Your BOM:</h2>
<table class="w-full border-collapse text-sm">
  <thead>
    <tr>
      <th class="border px-4 py-2 text-left">Qty</th>
      <th class="border px-4 py-2 text-left">SKU</th>
      <th class="border px-4 py-2 text-left">Description</th>
      ${includePrices?`<th class="border px-4 py-2 text-left">MSRP</th>`:""}
    </tr>
  </thead>
  <tbody>
    ${noteRow}
`;

    let grandTotal = 0;
    let pricedLines = 0;
    let unpricedLines = 0;

    results.forEach(r=>{
      // hide the synthetic NOTE row SKU
      const sku = (r.sku && String(r.sku).startsWith("NOTE-")) ? "—" : (r.sku ? r.sku : "—");
      const qty = Number(r.quantity) || 0;
      const unit = (typeof r.msrp === "number") ? r.msrp : null;
      const lineTotal = (unit != null) ? unit * qty : null;
      if (lineTotal != null) {
        grandTotal += lineTotal;
        pricedLines += 1;
      } else if (r.sku && !String(r.sku).startsWith("NOTE-")) {
        unpricedLines += 1;
      }

      html += `<tr>
        <td class="border px-4 py-2 align-top">${r.quantity}</td>
        <td class="border px-4 py-2 align-top">${sku}</td>
        <td class="border px-4 py-2 align-top">${r.description}</td>
        ${includePrices?`<td class="border px-4 py-2 align-top">${fmtCurrency(r.msrp)}</td>`:""}
      </tr>`;
    });

    if (includePrices) {
      html += `<tr class="bg-blue-50 font-semibold">
        <td class="border px-4 py-2" colspan="3">Estimated MSRP Total</td>
        <td class="border px-4 py-2">${fmtCurrency(grandTotal)}</td>
      </tr>`;
    }

    html += `</tbody></table>`;

    if (includePrices) {
      html += `<p class="text-xs text-gray-600 mt-2">Total is Qty × unit MSRP for lines with a known price (${pricedLines} priced line${pricedLines===1?"":"s"}).`;
      if (unpricedLines > 0) {
        html += ` ${unpricedLines} line${unpricedLines===1?"":"s"} have no MSRP in the catalog and are excluded from the total.`;
      }
      html += ` Prices are list MSRP and may not reflect final quote.</p>`;
    }

    // Conversational Show Mic Options (with analog hidden for Very large)
    function micList(items){
      return `<ul class="list-disc ml-6">${items.map(i=>`<li><code>${i.sku}</code> — ${getItem(i.sku)?.description || i.desc || ""}</li>`).join("")}</ul>`;
    }
    function micOptionsBlock(){
      if (!expansionMic || expansionMic==="None") return "";
      const t = typeOfSystem, r = roomSize;
      const a2Set = [
        {sku:"B22X4AA#AC3", desc:"New A2 white table mic pod"},
        {sku:"B22X6AA#AC3", desc:"New A2 black table mic pod"},
        {sku:"B22X2AA#AC3", desc:"A2 Bridge (required unless V12 Small)"},
        {sku:"A02F9AA", desc:"PoE power injector for G62 or A2 Audio bridge"},
      ];
      const ipSet = [
        {sku:"874R3AA", desc:"Existing IP table mics"},
        {sku:"875S1AA", desc:"Existing IP ceiling mics"},
      ];
      const triSet = [
        {sku:"849B6AA#ABA", desc:"Poly Trio C60 Preconfigured for Teams"},
        {sku:"85X02AA", desc:"Trio C60 expansion mic kit (includes 2 mics)"},
      ];
      const analog = [
        {sku:"875M6AA", desc:"Single Analog Expansion mic"},
        {sku:"875M4AA", desc:"Dongle kit convert to CAT5/6 for Analog expansion mic of Studio USB/X50/X52/V52/X70/X72/V72"}
      ];
      const a2Dongle = [{sku:"4Z7Z7AA", desc:"HP USB to Ethernet dongle when using Poly A2 mics+Bridge with X32/X52"}];

      // Helper blocks
      const or = `<p class="my-2 italic">OR</p>`;

      let out = `<details class="mt-3"><summary class="cursor-pointer text-blue-600 hover:underline">Show Mic Options</summary><div class="mt-2 text-sm">`;

      function addSection(items){ out += micList(items); }

      // Android
      if (t==="Android appliance based solution"){
        if (r==="Small"){ // X32
          addSection(a2Set.concat(a2Dongle));
          out += or;
          out += `<p>Pair Trio(s) over the network</p>`;
          addSection(triSet);
        } else if (r==="Medium"){ // X52
          addSection(analog);
          out += or;
          addSection(a2Set.concat(a2Dongle));
          out += or;
          out += `<p>Pair Trio(s) over the network</p>`;
          addSection(triSet);
        } else if (r==="Large"){ // X72
          addSection(analog);
          out += or;
          addSection(ipSet);
          out += or;
          addSection(a2Set.concat(a2Dongle));
          out += or;
          out += `<p>Pair Trio(s) over the network</p>`;
          addSection(triSet);
        } else { // Very large -> G62 (NO ANALOG)
          addSection(ipSet);
          out += or;
          addSection(a2Set.concat(a2Dongle));
          out += or;
          out += `<p>Pair Trio(s) over the network</p>`;
          addSection(triSet);
        }
      } else {
        // USB or Windows PC (V series)
        if (r==="Small"){ // V12
          addSection([{sku:"B22X4AA#AC3"},{sku:"B22X6AA#AC3"}]);
        } else if (r==="Medium"){ // V52
          addSection(analog);
          out += or;
          addSection(a2Set.concat(a2Dongle));
        } else if (r==="Large"){ // V72
          addSection(analog);
          out += or;
          addSection(ipSet.concat(a2Set).concat(a2Dongle));
        } else { // Very large (V72 path) — NO ANALOG
          addSection(ipSet);
          out += or;
          addSection(a2Set.concat(a2Dongle));
        }
      }

      out += `</div></details>`;
      return out;
    }

    html += micOptionsBlock();

    // Short legalese at bottom of every generated BOM
    html += `
      <p class="mt-6 text-xs text-gray-600 border-t border-gray-300 pt-3 leading-relaxed">
        <strong>Estimate only.</strong> SKUs, pricing, availability, and configurations are subject to change.
        Use this as a planning aid and confirm all items, pricing, and support terms with your HP Poly representative and authorized distributor before quoting or ordering.
      </p>`;

    resultDiv.innerHTML = html;
  }
}

window.onload = init;

// Update H1 with current version
(function(){ const h1 = document.querySelector("h1"); if (h1) h1.textContent = 'Poly Video Conferencing "Bill" of Materials Generator'; })();
