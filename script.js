const VERSION = "v10.17";
// script.js – HP | Poly Configurator – v10.17: single shrunk legalese at page bottom only
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
    arr.push({ sku, description: (item && item.description) ? item.description : fallback, msrp: (item && item.msrp != null) ? item.msrp : "", quantity: qty });
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
    tc10_black_wall:  { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: null, label: "TC10 Black scheduling panel (wall mount included)" },
    tc10_white_wall:  { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: null, label: "TC10 White scheduling panel (wall mount included)" },
    tc10_black_glass: { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: "874P9AA", label: "TC10 Black scheduling panel + glass mount" },
    tc10_white_glass: { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: "874P6AA", label: "TC10 White scheduling panel + glass mount" }
  };

  const app = document.getElementById("app");
  app.innerHTML = "";

  const select = (id, label, options) => {
    const wrap = document.createElement("div");
    const opts = options.map(o => typeof o === "string" ? {value: o, label: o} : o);
    wrap.innerHTML = `<label class="block font-medium">${label}</label><select id="${id}" class="border p-2 w-full"><option value="">--</option>${opts.map(o => `<option value="${o.value}">${o.label ?? o.value}</option>`).join("")}</select>`;
    return wrap;
  };
  const input = (id, label, ph="") => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<label class="block font-medium">${label}</label><input id="${id}" class="border p-2 w-full" placeholder="${ph}">`;
    return wrap;
  };

  const form = document.createElement("form");
  form.className = "space-y-4";

  // Featured configuration (announcement-style header)
  const promoWrap = document.createElement("div");
  promoWrap.id = "promoBox";
  promoWrap.className = "p-3 border-2 border-zinc-500 rounded bg-zinc-50 space-y-2";
  promoWrap.innerHTML = `
    <div class="font-semibold text-zinc-900">📢 Featured configuration</div>
    <p class="text-sm text-zinc-800">Microsoft Teams · Android appliance · Medium room · 3yr Poly+ · Poly E70 AI camera (auto-tracking / camera switching)</p>
    <p class="text-xs text-zinc-700">Kit only · works with Microsoft Teams, Zoom, or Google Meet · <a href="https://youtu.be/2AX-8x6CWN0?si=8O1Vp7uUVrohw1j1" target="_blank" rel="noopener" class="underline font-medium">X52 + E70 reference video</a></p>
    <button type="button" id="applyPromoBtn" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded shadow-sm">Apply this config & generate BOM</button>`;
  form.appendChild(promoWrap);

  const taaWrap = document.createElement("div");
  taaWrap.className = "p-3 border-2 border-blue-300 rounded bg-blue-50 space-y-1";
  taaWrap.innerHTML = `<label class="inline-flex items-center gap-2 cursor-pointer"><input id="taaJitc" type="checkbox" class="w-4 h-4 border"><span class="font-semibold text-blue-900">TAA / JITC compliant configuration only</span></label><p class="text-xs text-blue-800 ml-6">When checked, only TAA/JITC-compliant SKUs are used. Standard commercial hardware is excluded. Support terms still apply.</p>`;
  form.appendChild(taaWrap);

  form.appendChild(select("typeOfSystem","Select System Type",["BYOD USB Bar only","Windows PC based solution","Android appliance based solution"]));
  form.appendChild(select("platform","Select Primary Platform",["Zoom","Microsoft Teams","Google Meet"]));
  form.appendChild(select("roomSize","Select Room Size",[
    {value:"Small", label:"Small — Up to 12' from front of room to furthest person to cover"},
    {value:"Medium", label:"Medium — Up to 16' from front of room to furthest person to cover"},
    {value:"Large", label:"Large — Up to 25' from front of room to furthest person to cover"},
    {value:"Very large", label:"Very Large room. Distance of > 25' from front of room to furthest person to cover"}
  ]));
  const roomSizeHint = document.createElement("div");
  roomSizeHint.id = "roomSizeHint";
  roomSizeHint.className = "text-xs text-gray-600 mt-1";
  form.appendChild(roomSizeHint);
  form.appendChild(select("mounting","Select Mounting option",["None","Wall","VESA style display mount","Table"]));
  form.appendChild(select("expansionMic","Include Expansion Mic?",["None","Single Analog Exp mic","Existing IP table mics","Existing IP Ceiling mics","New White A2 table mic pod(s) ","New Black A2 table mic pod(s) "]));

  const expansionInfo = document.createElement("div");
  expansionInfo.id="expansionInfo";
  expansionInfo.className="hidden text-sm mt-1 p-2 border-l-4 border-amber-400 bg-amber-50 text-amber-900 rounded";
  expansionInfo.textContent = "Note: IP table/ceiling mics are not supported with V12, X32, X52, or V52. Use Analog or A2 mics.";
  form.appendChild(expansionInfo);

  const a2QtyWrap = document.createElement("div");
  a2QtyWrap.id = "a2QtyWrapper";
  a2QtyWrap.className = "hidden";
  a2QtyWrap.innerHTML = `<label class="block font-medium">Number of A2 mic pods</label><select id="a2Qty" class="border p-2 w-full"></select><p id="a2QtyHint" class="text-xs text-gray-600 mt-1"></p>`;
  const a2QtyHome = document.createElement("div");
  a2QtyHome.id = "a2QtyHome";
  a2QtyHome.appendChild(a2QtyWrap);
  form.appendChild(a2QtyHome);

  const camWrap = document.createElement("div");
  camWrap.id = "cameraWrap";
  camWrap.className = "hidden";
  camWrap.innerHTML = `<label class="block font-medium">Optional Camera add-on</label><select id="cameraChoice" class="border p-2 w-full"><option value="None">None (use built-in camera)</option><option value="E70">Poly E70 (842F8AA) — AI Director auto-tracking / camera switching</option><option value="E60">Poly E60 (9W1A6AA#AC3)</option></select><p class="text-xs text-gray-600 mt-1">E70 recommended for AI camera switching on X52, X72, or G62. <strong>Kit only</strong> · Teams / Zoom / Meet. <a href="https://youtu.be/2AX-8x6CWN0?si=8O1Vp7uUVrohw1j1" target="_blank" rel="noopener" class="underline">X52 + E70 reference video</a>.</p>`;
  form.appendChild(camWrap);

  const e70PowerWrap = document.createElement("div");
  e70PowerWrap.id = "e70PowerWrap";
  e70PowerWrap.className = "hidden";
  e70PowerWrap.innerHTML = `<label class="block font-medium">E70 power option</label><select id="e70Power" class="border p-2 w-full"><option value="None">None — using existing PoE+ switch</option><option value="Wall">Wall power supply (875K6AA)</option><option value="Injector">PoE midspan injector kit (85X03AA#ABA)</option></select><p class="text-xs text-gray-600 mt-1">E70 needs PoE+ or the optional wall PSU.</p>`;
  form.appendChild(e70PowerWrap);

  form.appendChild(select("schedulingPanel","Scheduling panel (additional TC10 outside room)",[
    {value:"None", label:"None"},
    {value:"tc10_black_wall", label:"TC10 Black — wall mount (included)"},
    {value:"tc10_white_wall", label:"TC10 White — wall mount (included)"},
    {value:"tc10_black_glass", label:"TC10 Black — glass mount"},
    {value:"tc10_white_glass", label:"TC10 White — glass mount"}
  ]));
  form.appendChild(select("supportTerm","Select Support term",[
    {value:"poly1",label:"1yr - Poly+"},{value:"poly3",label:"3yr - Poly+"},{value:"poly5",label:"5yr - Poly+"},
    {value:"analyze1",label:"1yr - Poly+ Analyze"},{value:"analyze3",label:"3yr - Poly+ Analyze"},{value:"analyze5",label:"5yr - Poly+ Analyze"}
  ]));
  form.appendChild(select("implementationHelp","Implementation Help",["None","Remote Implementation help","Onsite Implementation help"]));
  form.appendChild(input("accessories","Optional: any additional accessories (comma-separated SKUs)","e.g. extra cameras, cables"));

  const priceWrap = document.createElement("label");
  priceWrap.className = "inline-flex items-center gap-2";
  priceWrap.innerHTML = `<input id="includePrices" type="checkbox" class="border"> Include Prices (MSRP)`;
  form.appendChild(priceWrap);

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

  // Single compact legalese at bottom of page only
  const legalFooter = document.createElement("p");
  legalFooter.className = "mt-6 text-[11px] text-gray-500 border-t border-gray-300 pt-2 leading-snug";
  legalFooter.innerHTML = `<strong>Estimate only.</strong> Subject to change. Confirm SKUs, pricing & support with your HP Poly and distributor reps.`;
  app.appendChild(legalFooter);

  function canShowCameraAddOn(){
    const t = document.getElementById("typeOfSystem")?.value || "";
    const r = document.getElementById("roomSize")?.value || "";
    return t === "Android appliance based solution" && (r === "Medium" || r === "Large" || r === "Very large");
  }
  function updateE70PowerVisibility(){
    const cam = document.getElementById("cameraChoice")?.value || "None";
    const show = cam === "E70";
    const wrap = document.getElementById("e70PowerWrap");
    if (wrap) wrap.classList.toggle("hidden", !show);
  }
  function updateCameraVisibility(){
    camWrap.classList.toggle("hidden", !canShowCameraAddOn());
    updateE70PowerVisibility();
  }

  ["platform","typeOfSystem","roomSize"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", updateCameraVisibility);
  });
  document.getElementById("cameraChoice")?.addEventListener("change", updateE70PowerVisibility);
  updateCameraVisibility();

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
    const typeOfSystem = document.getElementById("typeOfSystem").value;
    const platform = document.getElementById("platform").value;
    const roomSize = document.getElementById("roomSize").value;
    const mounting = document.getElementById("mounting").value;
    const expansionMic = document.getElementById("expansionMic").value;
    const scheduling = document.getElementById("schedulingPanel").value;
    const supportTerm = document.getElementById("supportTerm").value;
    const implHelp = document.getElementById("implementationHelp").value;
    const accessories = (document.getElementById("accessories").value || "").split(",").map(s=>s.trim()).filter(Boolean);
    const includePrices = document.getElementById("includePrices").checked;
    const taaJitc = document.getElementById("taaJitc")?.checked || false;

    if (!typeOfSystem || !platform || !roomSize){
      resultDiv.innerHTML = `<div class="text-red-700 bg-red-50 border border-red-200 p-3 rounded">Please select System type, Platform, and Room size.</div>`;
      return;
    }

    const results = [];
    const isUSBorPC = (typeOfSystem==="BYOD USB Bar only" || typeOfSystem==="Windows PC based solution");

    if (!taaJitc) {
      if (isUSBorPC){
        if (roomSize==="Small"){ addLine(results,"A9DD8AA#ABA"); addSupport(results,"v12",supportTerm); }
        else if (roomSize==="Medium"){ addLine(results,"A09D4AA#ABA"); addSupport(results,"v52",supportTerm); }
        else { addLine(results,"AV1E3AA#ABA"); addSupport(results,"v72",supportTerm); }
        if (typeOfSystem==="Windows PC based solution"){
          if (platform==="Zoom"){ addLine(results,"9C422AW#ABA"); addSupport(results,"zoom_pc",supportTerm); addLine(results,"875K5AA"); addSupport(results,"tc10",supportTerm); }
          else if (platform==="Microsoft Teams"){ addLine(results,"A1ZB6AW#ABA"); addSupport(results,"g9plus_mtr",supportTerm); addLine(results,"875K5AA"); addSupport(results,"tc10",supportTerm); }
        }
      } else {
        if (roomSize==="Small"){ addLine(results,"A3SV5AA#ABA"); addSupport(results,"x32",supportTerm); }
        else if (roomSize==="Medium"){ addLine(results,"8D8K2AA#ABA"); addSupport(results,"x52",supportTerm); addLine(results,"875K5AA"); addSupport(results,"tc10",supportTerm); }
        else if (roomSize==="Large"){ addLine(results,"A4LZ8AA#ABA"); addSupport(results,"x72",supportTerm); addLine(results,"875K5AA"); addSupport(results,"tc10",supportTerm); }
        else { addLine(results,"A01KCAA#AC3"); addSupport(results,"g62",supportTerm); }
      }

      // Camera add-on
      const isX52 = hasSku(results,"8D8K2AA#ABA");
      const isX72 = hasSku(results,"A4LZ8AA#ABA");
      const isG62 = hasSku(results,"A01KCAA#AC3");
      if (isX52 || isX72 || isG62) {
        const cam = document.getElementById("cameraChoice")?.value;
        if (cam==="E70"){
          if (!hasSku(results,"842F8AA")) addLine(results,"842F8AA");
          addSupport(results,"e70",supportTerm);
          const e70Pwr = document.getElementById("e70Power")?.value || "None";
          if (e70Pwr==="Wall" && !hasSku(results,"875K6AA")) addLine(results,"875K6AA","Poly E70 wall / external power supply (12V 5A)");
          if (e70Pwr==="Injector" && !hasSku(results,"85X03AA#ABA")) addLine(results,"85X03AA#ABA","Poly E70 / Trio PoE midspan injector kit");
        } else if (cam==="E60"){
          if (!hasSku(results,"9W1A6AA#AC3")) addLine(results,"9W1A6AA#AC3");
          addSupport(results,"e60",supportTerm);
        }
      }

      if (hasSku(results,"A3SV5AA#ABA")){
        if (!hasSku(results,"B5NH6AA#ABA")) addLine(results,"B5NH6AA#ABA");
        if (!hasSku(results,"875K5AA")) addLine(results,"875K5AA");
        addSupport(results,"tc10",supportTerm);
      }

      if (scheduling && scheduling !== "None" && SCHEDULING_MAP[scheduling]) {
        const sch = SCHEDULING_MAP[scheduling];
        addLine(results, sch.commercialTc10, sch.label);
        addSupport(results,"tc10",supportTerm);
        if (sch.glassMount) addLine(results, sch.glassMount);
      }
    }

    accessories.forEach(sku => addLine(results, sku, sku));

    let html = `<p class="text-xs text-gray-500 mb-1">Build ${VERSION} — generated ${new Date().toLocaleDateString()}</p>
<h2 class="font-semibold mb-2">Your BOM:</h2>
<table class="w-full border-collapse text-sm"><thead><tr>
<th class="border px-4 py-2 text-left">Qty</th><th class="border px-4 py-2 text-left">SKU</th><th class="border px-4 py-2 text-left">Description</th>
${includePrices?`<th class="border px-4 py-2 text-left">MSRP</th>`:""}</tr></thead><tbody>`;

    let grandTotal = 0;
    results.forEach(r=>{
      const sku = r.sku || "—";
      const qty = Number(r.quantity) || 0;
      const unit = (typeof r.msrp === "number") ? r.msrp : null;
      if (unit != null) grandTotal += unit * qty;
      html += `<tr><td class="border px-4 py-2">${r.quantity}</td><td class="border px-4 py-2">${sku}</td><td class="border px-4 py-2">${r.description}</td>${includePrices?`<td class="border px-4 py-2">${fmtCurrency(r.msrp)}</td>`:""}</tr>`;
    });
    if (includePrices) html += `<tr class="bg-blue-50 font-semibold"><td class="border px-4 py-2" colspan="3">Estimated MSRP Total</td><td class="border px-4 py-2">${fmtCurrency(grandTotal)}</td></tr>`;
    html += `</tbody></table>`;
    resultDiv.innerHTML = html;
  }
}

window.onload = init;
