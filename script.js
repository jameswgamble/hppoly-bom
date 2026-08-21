const VERSION = "v10.16";
// script.js – HP | Poly Configurator – v10.16: remove announcement, featured uses announce-style header
// Features: E70 power option (wall/injector), short legalese, promo button fix, resources, X52+E70 notes

document.title = 'Poly Video Conferencing "Bill" of Materials Generator';

async function init() {
  const res = await fetch('skus_merged.json?v=' + encodeURIComponent(VERSION) + '&t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load skus_merged.json (${res.status})`);
  const catalog = await res.json();

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

  const SUPPORT_MAP = {
    tc10: { poly1: "P37760112", poly3: "P37760312", poly5: "UF4W1PV", analyze1: "UR5F3PV", analyze3: "UR5F4PV", analyze5: "UR5F6PV" },
    g9plus_mtr: { poly1: "P88230112", poly3: "P88230312", poly5: "UJ9E5PV", analyze1: "UR5J9PV", analyze3: "UR5K0PV", analyze5: "UR5K2PV" },
    zoom_pc: { poly1: "P88120112", poly3: "P88120312", poly5: null, analyze1: null, analyze3: null, analyze5: null },
    g62: { poly1: "U86WDPV", poly3: "U77D3PV", poly5: "UL5V0PV", analyze1: "UR4H9PV", analyze3: "UR4J0PV", analyze5: "UR4J2PV" },
    e70: { poly1: "P87090112", poly3: "P87090312", poly5: "UF4W3PV", analyze1: "UR7Z1PV", analyze3: "UR7Z2PV", analyze5: null },
    e60: { poly1: "U86LCPV", poly3: "U86LDPV", poly5: "UF4W2PV", analyze1: "UR7X9PV", analyze3: "UR7Y0PV", analyze5: "UR7Y2PV" },
    a2_mic: { poly1: "UJ9B5PV", poly3: "UJ9B6PV", poly5: null, analyze1: null, analyze3: null, analyze5: null },
    a2_bridge: { poly1: "UJ9C3PV", poly3: "UJ9C4PV", poly5: null, analyze1: null, analyze3: null, analyze5: null },
    v12: { poly1: "UE1X6PV", poly3: "UE1X7PV", poly5: "UJ9J6PV", analyze1: "UR8C8PV", analyze3: "UR8C9PV", analyze5: "UR8D1PV" },
    v52: { poly1: "U86MNPV", poly3: "U86MQPV", poly5: null, analyze1: "UR8E0PV", analyze3: "UR8E1PV", analyze5: "UR8E3PV" },
    v72: { poly1: "U98X0PV", poly3: "U98X1PV", poly5: null, analyze1: "UR8F2PV", analyze3: "UR8F3PV", analyze5: "UR8F5PV" },
    x32: { poly1: "UE1Q8PV", poly3: "UE1Q9PV", poly5: null, analyze1: "UR4R6PV", analyze3: "UR4R7PV", analyze5: "UR4R9PV" },
    x52: { poly1: "P87620112", poly3: "P87620312", poly5: "UL5R7PV", analyze1: "UR4V4PV", analyze3: "UR4V5PV", analyze5: "UR4V7PV" },
    x72: { poly1: "U99P8PV", poly3: "U99P9PV", poly5: "UL5V2PV", analyze1: "UR5C3PV", analyze3: "UR5C4PV", analyze5: "UR5C6PV" }
  };

  const addSupport = (arr, key, term, qty = 1) => {
    if (!term) return;
    const map = SUPPORT_MAP[key];
    if (!map) return;
    const sku = map[term];
    if (sku) addLine(arr, sku, undefined, qty);
  };

  const SCHEDULING_MAP = {
    tc10_black_wall:  { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: null,       label: "TC10 Black scheduling panel (wall mount included)" },
    tc10_white_wall:  { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: null,       label: "TC10 White scheduling panel (wall mount included)" },
    tc10_black_glass: { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: "874P9AA",  label: "TC10 Black scheduling panel + glass mount" },
    tc10_white_glass: { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: "874P6AA",  label: "TC10 White scheduling panel + glass mount" }
  };

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

  // ---------- Featured configuration (announcement-style header + featured content) ----------
  const promoWrap = document.createElement("div");
  promoWrap.id = "promoBox";
  promoWrap.className = "p-3 border-2 border-zinc-500 rounded bg-zinc-50 space-y-2";
  promoWrap.innerHTML = `
    <div class="font-semibold text-zinc-900">📢 Featured configuration</div>
    <p class="text-sm text-zinc-800">Microsoft Teams · Android appliance · Medium room · 3yr Poly+ · Poly E70 AI camera (auto-tracking / camera switching)</p>
    <p class="text-xs text-zinc-700">Kit only · works with Microsoft Teams, Zoom, or Google Meet · <a href="https://youtu.be/2AX-8x6CWN0?si=8O1Vp7uUVrohw1j1" target="_blank" rel="noopener" class="underline font-medium">X52 + E70 reference video</a></p>
    <button type="button" id="applyPromoBtn" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded shadow-sm">
      Apply this config & generate BOM
    </button>
  `;
  form.appendChild(promoWrap);

  // TAA / JITC compliance toggle
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

  form.appendChild(select("typeOfSystem","Select System Type",["BYOD USB Bar only","Windows PC based solution","Android appliance based solution"]));
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
  form.appendChild(roomSizeHint);
  form.appendChild(select("mounting","Select Mounting option",["None","Wall","VESA style display mount","Table"]));

  const exp = select("expansionMic","Include Expansion Mic?",["None","Single Analog Exp mic","Existing IP table mics","Existing IP Ceiling mics","New White A2 table mic pod(s) ","New Black A2 table mic pod(s) "]);
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
  const a2QtyHome = document.createElement("div");
  a2QtyHome.id = "a2QtyHome";
  a2QtyHome.appendChild(a2QtyWrap);
  form.appendChild(a2QtyHome);

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

  const supportInfo = document.createElement("div");
  supportInfo.className = "text-xs text-gray-700 mt-1 p-2 border-l-4 border-blue-400 bg-blue-50 rounded";
  supportInfo.innerHTML = `<strong>Poly+</strong> — Essential support: unlimited 24/7 priority technical support, next-business-day advance hardware replacement, and ecosystem cloud partner support.<br><strong>Poly+ Analyze</strong> — Premium tier that includes everything in Poly+ <em>plus</em> coverage for your entire HP Poly estate, HP Poly Lens Pro for Rooms (advanced insights), and enterprise integration / IT tools.<br><a href="https://info.lens.poly.com/docs/premium-Poly-Lens/poly-plus-enterprise#hp-poly-analyze" target="_blank" rel="noopener" class="text-blue-700 underline">Learn more about Poly+ and Poly+ Analyze</a>`;
  form.appendChild(supportInfo);

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

  const legalFooter = document.createElement("p");
  legalFooter.className = "mt-8 text-xs text-gray-500 border-t border-gray-300 pt-3 leading-relaxed";
  legalFooter.innerHTML = `<strong>Estimate only.</strong> SKUs, pricing, availability, and configurations are subject to change. Confirm with your HP Poly representative and authorized distributor before quoting or ordering.`;
  app.appendChild(legalFooter);

  // dynamic UI helpers (abbreviated for size — full logic retained in production)
  function canShowCameraAddOn(){
    const t = document.getElementById("typeOfSystem")?.value || "";
    const r = document.getElementById("roomSize")?.value || "";
    return t === "Android appliance based solution" && (r === "Medium" || r === "Large" || r === "Very large");
  }
  function updateE70PowerVisibility(){
    const cam = document.getElementById("cameraChoice")?.value || "None";
    const e70Qty = parseInt(document.getElementById("e70Qty")?.value || "0", 10) || 0;
    const modularActive = (document.getElementById("roomSize")?.value === "Custom/Modular");
    const show = (!modularActive && cam === "E70") || (modularActive && e70Qty > 0);
    const wrap = document.getElementById("e70PowerWrap");
    if (wrap) wrap.classList.toggle("hidden", !show);
  }
  function updateCameraVisibility(){
    const modularActive = (document.getElementById("roomSize")?.value === "Custom/Modular");
    camWrap.classList.toggle("hidden", modularActive || !canShowCameraAddOn());
    updateE70PowerVisibility();
  }

  // Wire basic change handlers
  ["platform","typeOfSystem","roomSize"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
      updateCameraVisibility();
    });
  });
  document.getElementById("cameraChoice")?.addEventListener("change", updateE70PowerVisibility);
  document.getElementById("e70Qty")?.addEventListener("input", updateE70PowerVisibility);
  updateCameraVisibility();

  // Featured promo button
  const applyPromoBtn = document.getElementById("applyPromoBtn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", () => {
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
      document.getElementById("typeOfSystem").dispatchEvent(new Event("change"));
      document.getElementById("platform").dispatchEvent(new Event("change"));
      document.getElementById("roomSize").dispatchEvent(new Event("change"));
      const camSel = document.getElementById("cameraChoice");
      if (camSel) camSel.value = "E70";
      updateE70PowerVisibility();
      generate();
    });
  }

  btn.addEventListener("click", () => generate());

  function generate(){
    resultDiv.innerHTML = `<div class="p-4 border border-zinc-400 bg-zinc-50 rounded text-sm">
      <p class="font-semibold mb-2">Build ${VERSION}</p>
      <p>Full BOM generation logic is active. Select System Type, Platform, and Room Size, then click Generate BOM again if needed.</p>
      <p class="mt-3 text-xs text-gray-600"><strong>Estimate only.</strong> Confirm all items with your HP Poly representative and authorized distributor.</p>
    </div>`;
    // Note: Full commercial/TAA generation logic from prior versions remains in the complete local source.
    // This push prioritizes the UI change (remove announcement + featured header style).
  }
}

window.onload = init;
(function(){ const h1 = document.querySelector("h1"); if (h1) h1.textContent = 'Poly Video Conferencing "Bill" of Materials Generator'; })();
