const VERSION = "v10.22";
// script.js – HP | Poly Configurator – v10.22: A2 bridge PoE (A02F9AA), announcement, Poly+ description, A2 qty
// Features: A2 bridge power injector, Announcement, Poly+ vs Analyze, A2 qty, E60/E70 mounts + PoE, TAA

document.title = 'Poly Video Conferencing "Bill" of Materials Generator';

async function init() {
  // Cache-bust so browsers/CDN never serve a stale skus_merged.json
  const res = await fetch('skus_merged.json?v=' + encodeURIComponent(VERSION) + '&t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load skus_merged.json (' + res.status + ')');
  const catalog = await res.json();

  // ---------- helpers ----------
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
  const addLine = (arr, sku, fallback = "(Custom item)", qty = 1) => {
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
    return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Support map
  const SUPPORT_MAP = {
    tc10:       { poly1: "P37760112", poly3: "P37760312", poly5: "UF4W1PV", analyze1: "UR5F3PV", analyze3: "UR5F4PV", analyze5: "UR5F6PV" },
    g9plus_mtr: { poly1: "P88230112", poly3: "P88230312", poly5: "UJ9E5PV", analyze1: "UR5J9PV", analyze3: "UR5K0PV", analyze5: "UR5K2PV" },
    zoom_pc:    { poly1: "P88120112", poly3: "P88120312", poly5: null,     analyze1: null,     analyze3: null,     analyze5: null },
    g62:        { poly1: "U86WDPV",   poly3: "U77D3PV",   poly5: "UL5V0PV", analyze1: "UR4H9PV", analyze3: "UR4J0PV", analyze5: "UR4J2PV" },
    e70:        { poly1: "P87090112", poly3: "P87090312", poly5: "UF4W3PV", analyze1: "UR7Z1PV", analyze3: "UR7Z2PV", analyze5: null },
    e60:        { poly1: "U86LCPV",   poly3: "U86LDPV",   poly5: "UF4W2PV", analyze1: "UR7X9PV", analyze3: "UR7Y0PV", analyze5: "UR7Y2PV" },
    a2_mic:     { poly1: "UJ9B5PV",   poly3: "UJ9B6PV",   poly5: null,     analyze1: null,     analyze3: null,     analyze5: null },
    a2_bridge:  { poly1: "UJ9C3PV",   poly3: "UJ9C4PV",   poly5: null,     analyze1: null,     analyze3: null,     analyze5: null },
    v12:        { poly1: "UE1X6PV",   poly3: "UE1X7PV",   poly5: "UJ9J6PV", analyze1: "UR8C8PV", analyze3: "UR8C9PV", analyze5: "UR8D1PV" },
    v52:        { poly1: "U86MNPV",   poly3: "U86MQPV",   poly5: null,     analyze1: "UR8E0PV", analyze3: "UR8E1PV", analyze5: "UR8E3PV" },
    v72:        { poly1: "U98X0PV",   poly3: "U98X1PV",   poly5: null,     analyze1: "UR8F2PV", analyze3: "UR8F3PV", analyze5: "UR8F5PV" },
    x32:        { poly1: "UE1Q8PV",   poly3: "UE1Q9PV",   poly5: null,     analyze1: "UR4R6PV", analyze3: "UR4R7PV", analyze5: "UR4R9PV" },
    x52:        { poly1: "P87620112", poly3: "P87620312", poly5: "UL5R7PV", analyze1: "UR4V4PV", analyze3: "UR4V5PV", analyze5: "UR4V7PV" },
    x72:        { poly1: "U99P8PV",   poly3: "U99P9PV",   poly5: "UL5V2PV", analyze1: "UR5C3PV", analyze3: "UR5C4PV", analyze5: "UR5C6PV" }
  };

  const addSupport = (arr, key, term, qty = 1) => {
    if (!term) return;
    const map = SUPPORT_MAP[key];
    if (!map) return;
    const sku = map[term];
    if (sku) addLine(arr, sku, undefined, qty);
  };

  const SCHEDULING_MAP = {
    tc10_black_wall:  { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: null,      label: "TC10 Black scheduling panel (wall mount included)" },
    tc10_white_wall:  { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: null,      label: "TC10 White scheduling panel (wall mount included)" },
    tc10_black_glass: { commercialTc10: "875K5AA", taaTc10: "973F9AA", glassMount: "874P9AA", label: "TC10 Black scheduling panel + glass mount" },
    tc10_white_glass: { commercialTc10: "973G1AA", taaTc10: "973G1AA", glassMount: "874P6AA", label: "TC10 White scheduling panel + glass mount" }
  };

  // ---------- UI ----------
  const app = document.getElementById("app");
  app.innerHTML = "";

  const select = (id, label, options) => {
    const wrap = document.createElement("div");
    const opts = options.map(o => typeof o === "string" ? { value: o, label: o } : o);
    wrap.innerHTML = `
      <label class="block font-medium">${label}</label>
      <select id="${id}" class="border p-2 w-full">
        <option value="">--</option>
        ${opts.map(o => `<option value="${o.value}">${o.label ?? o.value}</option>`).join("")}
      </select>`;
    return wrap;
  };
  const input = (id, label, ph = "") => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<label class="block font-medium">${label}</label>
      <input id="${id}" class="border p-2 w-full" placeholder="${ph}">`;
    return wrap;
  };

  const form = document.createElement("form");
  form.className = "space-y-4";

  // Announcement banner (support + TC10 scheduler updates)
  const promoWrap = document.createElement("div");
  promoWrap.id = "promoBox";
  promoWrap.className = "p-3 border-2 border-amber-400 rounded bg-amber-50 space-y-2";
  promoWrap.innerHTML = `
    <div class="font-semibold text-amber-900">📢 Announcement — new support &amp; TC10 scheduler options</div>
    <ul class="text-sm text-amber-950 list-disc pl-5 space-y-1">
      <li><strong>Support additions:</strong> 1 / 3 / 5 year <strong>Poly+</strong> and <strong>Poly+ Analyze</strong> terms are now selectable for the main system, cameras (E60/E70), A2 mics, and TC10. Poly+ Analyze includes estate-wide coverage and Lens Pro insights.</li>
      <li><strong>TC10 scheduler additions:</strong> Optional outside-room TC10 scheduling panel in Black or White, with wall mount (included) or glass mount. Available in both commercial and TAA/JITC paths.</li>
    </ul>
    <p class="text-xs text-amber-800">Select Support term and Scheduling panel below to include these on the BOM.</p>`;
  form.appendChild(promoWrap);

  // TAA / JITC
  const taaWrap = document.createElement("div");
  taaWrap.className = "p-3 border-2 border-blue-300 rounded bg-blue-50 space-y-1";
  taaWrap.innerHTML = `
    <label class="inline-flex items-center gap-2 cursor-pointer">
      <input id="taaJitc" type="checkbox" class="w-4 h-4 border">
      <span class="font-semibold text-blue-900">TAA / JITC compliant configuration only</span>
    </label>
    <p class="text-xs text-blue-800 ml-6">When checked, only TAA/JITC-compliant SKUs are used. Standard commercial hardware is excluded. Support terms still apply.</p>`;
  form.appendChild(taaWrap);

  form.appendChild(select("typeOfSystem", "Select System Type", [
    "BYOD USB Bar only",
    "Windows PC based solution",
    "Android appliance based solution"
  ]));
  form.appendChild(select("platform", "Select Primary Platform", ["Zoom", "Microsoft Teams", "Google Meet"]));
  form.appendChild(select("roomSize", "Select Room Size", [
    { value: "Small",  label: "Small — Up to 12' from front of room to furthest person to cover" },
    { value: "Medium", label: "Medium — Up to 16' from front of room to furthest person to cover" },
    { value: "Large",  label: "Large — Up to 25' from front of room to furthest person to cover" },
    { value: "Very large", label: "Very Large room. Distance of > 25' from front of room to furthest person to cover" }
  ]));
  form.appendChild(select("mounting", "Select Mounting option", ["None", "Wall", "VESA style display mount", "Table"]));
  form.appendChild(select("expansionMic", "Include Expansion Mic?", [
    "None",
    "Single Analog Exp mic",
    "Existing IP table mics",
    "Existing IP Ceiling mics",
    "New White A2 table mic pod(s)",
    "New Black A2 table mic pod(s)"
  ]));

  // A2 quantity (shown only when New White/Black A2 is selected)
  const a2QtyWrap = document.createElement("div");
  a2QtyWrap.id = "a2QtyWrap";
  a2QtyWrap.className = "hidden";
  a2QtyWrap.innerHTML = `
    <label class="block font-medium">Number of A2 mic pods</label>
    <select id="a2Qty" class="border p-2 w-full"></select>
    <p id="a2QtyHint" class="text-xs text-gray-600 mt-1"></p>`;
  form.appendChild(a2QtyWrap);

  // Camera add-on (shown for Android Medium / Large / Very large)
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
    <p class="text-xs text-gray-600 mt-1">E70 recommended for AI camera switching on X52, X72, or G62. <strong>Kit only</strong>.</p>`;
  form.appendChild(camWrap);

  // Camera power option (E60 + E70) — PoE+ injector or wall PSU
  const cameraPowerWrap = document.createElement("div");
  cameraPowerWrap.id = "cameraPowerWrap";
  cameraPowerWrap.className = "hidden";
  cameraPowerWrap.innerHTML = `
    <label class="block font-medium">Camera power option</label>
    <select id="cameraPower" class="border p-2 w-full">
      <option value="None">None — using existing PoE+ switch</option>
      <option value="Wall">Wall power supply</option>
      <option value="Injector">PoE+ midspan injector kit (85X03AA#ABA)</option>
    </select>
    <p class="text-xs text-gray-600 mt-1">E60 &amp; E70 require PoE+ (Class 4 / 30W). Use injector if your switch is not PoE+.</p>`;
  form.appendChild(cameraPowerWrap);

  // Camera mount option (VESA for E70, Ceiling for E60)
  const cameraMountWrap = document.createElement("div");
  cameraMountWrap.id = "cameraMountWrap";
  cameraMountWrap.className = "hidden";
  cameraMountWrap.innerHTML = `
    <label class="block font-medium">Camera mount option</label>
    <select id="cameraMount" class="border p-2 w-full">
      <option value="None">None</option>
    </select>
    <p class="text-xs text-gray-600 mt-1" id="cameraMountHint"></p>`;
  form.appendChild(cameraMountWrap);

  form.appendChild(select("schedulingPanel", "Scheduling panel (additional TC10 outside room)", [
    { value: "None", label: "None" },
    { value: "tc10_black_wall",  label: "TC10 Black — wall mount (included)" },
    { value: "tc10_white_wall",  label: "TC10 White — wall mount (included)" },
    { value: "tc10_black_glass", label: "TC10 Black — glass mount" },
    { value: "tc10_white_glass", label: "TC10 White — glass mount" }
  ]));
  form.appendChild(select("supportTerm", "Select Support term", [
    { value: "poly1",    label: "1yr - Poly+" },
    { value: "poly3",    label: "3yr - Poly+" },
    { value: "poly5",    label: "5yr - Poly+" },
    { value: "analyze1", label: "1yr - Poly+ Analyze" },
    { value: "analyze3", label: "3yr - Poly+ Analyze" },
    { value: "analyze5", label: "5yr - Poly+ Analyze" }
  ]));

  // Brief overview of Poly+ vs Poly+ Analyze
  const supportInfo = document.createElement("div");
  supportInfo.className = "text-xs text-gray-700 mt-1 p-2 border-l-4 border-blue-400 bg-blue-50 rounded";
  supportInfo.innerHTML = `
    <strong>Poly+</strong> — Essential support: unlimited 24/7 priority technical support, next-business-day advance hardware replacement, and ecosystem cloud partner support.<br>
    <strong>Poly+ Analyze</strong> — Premium tier that includes everything in Poly+ <em>plus</em> coverage for your entire HP Poly estate, HP Poly Lens Pro for Rooms (advanced insights), and enterprise integration / IT tools.<br>
    <a href="https://info.lens.poly.com/docs/premium-Poly-Lens/poly-plus-enterprise#hp-poly-analyze" target="_blank" rel="noopener" class="text-blue-700 underline">Learn more about Poly+ and Poly+ Analyze</a>`;
  form.appendChild(supportInfo);

  form.appendChild(select("implementationHelp", "Implementation Help", [
    "None", "Remote Implementation help", "Onsite Implementation help"
  ]));
  form.appendChild(input("accessories", "Optional: any additional accessories (comma-separated SKUs)", "e.g. extra cameras, cables"));

  const priceWrap = document.createElement("label");
  priceWrap.className = "inline-flex items-center gap-2";
  priceWrap.innerHTML = `<input id="includePrices" type="checkbox" class="border"> Include Prices (MSRP)`;
  form.appendChild(priceWrap);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "generateBtn";
  btn.className = "px-4 py-2 bg-blue-600 text-white rounded";
  btn.textContent = "Generate BOM";
  form.appendChild(btn);

  const resultDiv = document.createElement("div");
  resultDiv.id = "result";
  resultDiv.className = "mt-6 space-y-4";

  app.appendChild(form);
  app.appendChild(resultDiv);

  // Single compact legalese at bottom of page only
  const legalFooter = document.createElement("p");
  legalFooter.className = "mt-6 text-[11px] text-gray-500 border-t border-gray-300 pt-2 leading-snug";
  legalFooter.innerHTML = `<strong>Estimate only.</strong> Subject to change. Confirm SKUs, pricing &amp; support with your HP Poly and distributor reps.`;
  app.appendChild(legalFooter);

  // ---------- dynamic UI helpers ----------
  // Max A2 table mics per host (HP Poly Studio A2 admin guide)
  // V12: 1 | X32: 2 | X52/V52: 4 | X72/V72: 4 | G62: 8
  function a2MaxForSelection() {
    const t = document.getElementById("typeOfSystem")?.value || "";
    const r = document.getElementById("roomSize")?.value || "";
    const isUSB = (t === "BYOD USB Bar only" || t === "Windows PC based solution");
    if (r === "Very large") return 8; // G62
    if (r === "Large") return 4;      // X72 / V72
    if (r === "Medium") return 4;     // X52 / V52
    if (r === "Small") {
      if (isUSB) return 1;            // V12
      return 2;                       // X32
    }
    return 4;
  }
  function refreshA2QtyOptions() {
    const sel = document.getElementById("a2Qty");
    const hint = document.getElementById("a2QtyHint");
    if (!sel) return;
    const max = a2MaxForSelection();
    const prev = parseInt(sel.value || "1", 10) || 1;
    sel.innerHTML = "";
    for (let n = 1; n <= 8; n++) {
      const opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = n > max ? n + " (exceeds max for this system)" : String(n);
      if (n > max) opt.disabled = true;
      sel.appendChild(opt);
    }
    sel.value = String(Math.min(prev, max));
    if (hint) {
      const t = document.getElementById("typeOfSystem")?.value || "";
      const r = document.getElementById("roomSize")?.value || "";
      const isUSB = (t === "BYOD USB Bar only" || t === "Windows PC based solution");
      let host = "selected system";
      if (r === "Small" && isUSB) host = "V12 (max 1)";
      else if (r === "Small") host = "X32 (max 2)";
      else if (r === "Medium") host = "X52 / V52 (max 4)";
      else if (r === "Large") host = "X72 / V72 (max 4)";
      else if (r === "Very large") host = "G62 (max 8)";
      hint.textContent = "Per HP Poly Studio A2 admin guide: " + host + ".";
    }
  }
  function updateA2QtyVisibility() {
    const exp = document.getElementById("expansionMic")?.value || "";
    const show = exp.includes("New White A2") || exp.includes("New Black A2");
    const wrap = document.getElementById("a2QtyWrap");
    if (wrap) wrap.classList.toggle("hidden", !show);
    if (show) refreshA2QtyOptions();
  }

  function canShowCameraAddOn() {
    const t = document.getElementById("typeOfSystem")?.value || "";
    const r = document.getElementById("roomSize")?.value || "";
    return t === "Android appliance based solution" && (r === "Medium" || r === "Large" || r === "Very large");
  }
  function updateCameraAccessoryVisibility() {
    const cam = document.getElementById("cameraChoice")?.value || "None";
    const show = cam === "E60" || cam === "E70";
    const powerWrap = document.getElementById("cameraPowerWrap");
    const mountWrap = document.getElementById("cameraMountWrap");
    if (powerWrap) powerWrap.classList.toggle("hidden", !show);
    if (mountWrap) mountWrap.classList.toggle("hidden", !show);

    // Rebuild mount options based on selected camera
    const mountSel = document.getElementById("cameraMount");
    const hint = document.getElementById("cameraMountHint");
    if (mountSel) {
      const prev = mountSel.value;
      mountSel.innerHTML = `<option value="None">None</option>`;
      if (cam === "E70") {
        mountSel.innerHTML += `<option value="VESA">VESA mount (875K7AA)</option>`;
        if (hint) hint.textContent = "Optional VESA mounting kit for Poly Studio E70.";
      } else if (cam === "E60") {
        mountSel.innerHTML += `<option value="Ceiling">Ceiling mount (9W1A8AA#AC3)</option>`;
        if (hint) hint.textContent = "Optional ceiling mount for Poly Studio E60 (wall mount is included with camera).";
      } else {
        if (hint) hint.textContent = "";
      }
      // restore previous selection if still valid
      if ([...mountSel.options].some(o => o.value === prev)) mountSel.value = prev;
    }
  }
  function updateCameraVisibility() {
    camWrap.classList.toggle("hidden", !canShowCameraAddOn());
    updateCameraAccessoryVisibility();
  }

  ["platform", "typeOfSystem", "roomSize"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", () => {
      updateCameraVisibility();
      updateA2QtyVisibility();
    });
  });
  document.getElementById("cameraChoice")?.addEventListener("change", updateCameraAccessoryVisibility);
  document.getElementById("expansionMic")?.addEventListener("change", updateA2QtyVisibility);
  updateCameraVisibility();
  updateA2QtyVisibility();

  // ---------- promo button ----------
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
      updateCameraAccessoryVisibility();
      generate();
      const res = document.getElementById("result");
      if (res) res.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ---------- core generate ----------
  btn.addEventListener("click", () => generate());

  function generate() {
    const typeOfSystem = document.getElementById("typeOfSystem").value;
    const platform     = document.getElementById("platform").value;
    const roomSize     = document.getElementById("roomSize").value;
    const mounting     = document.getElementById("mounting").value;
    const expansionMic = document.getElementById("expansionMic").value;
    const scheduling   = document.getElementById("schedulingPanel").value;
    const supportTerm  = document.getElementById("supportTerm").value;
    const implHelp     = document.getElementById("implementationHelp").value;
    const accessories  = (document.getElementById("accessories").value || "").split(",").map(s => s.trim()).filter(Boolean);
    const includePrices = document.getElementById("includePrices").checked;
    const taaJitc      = document.getElementById("taaJitc")?.checked || false;

    if (!typeOfSystem || !platform || !roomSize) {
      resultDiv.innerHTML = `<div class="text-red-700 bg-red-50 border border-red-200 p-3 rounded">Please select System type, Platform, and Room size.</div>`;
      return;
    }

    const results = [];
    const isUSBorPC = (typeOfSystem === "BYOD USB Bar only" || typeOfSystem === "Windows PC based solution");


    // ========== TAA / JITC MODE ==========
    // Prefer JITC variant when available; fall back to TAA-only.
    if (taaJitc) {
      const pick = (jitcSku, taaSku) => jitcSku || taaSku;
      const tc10Sku = () => pick("973F9AA", "977L6AA"); // Black TC10 TAA JITC / TAA

      if (isUSBorPC) {
        // USB / PC based → V-series bars (TAA)
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
              addLine(results, "DS1R6AW"); // Studio 5 Room Compute TAA
            } else {
              addLine(results, "DS0W9AW"); // Studio 7 Room Compute TAA
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
        // Android appliance → X-series / G62 (TAA)
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

      // Scheduling panel (TAA path)
      if (scheduling && scheduling !== "None" && SCHEDULING_MAP[scheduling]) {
        const sch = SCHEDULING_MAP[scheduling];
        addLine(results, sch.taaTc10 || tc10Sku(), sch.label);
        addSupport(results, "tc10", supportTerm);
        if (sch.glassMount) addLine(results, sch.glassMount);
      }

      // A2 mics (TAA versions)
      const wantsA2White = (expansionMic || "").includes("New White A2");
      const wantsA2Black = (expansionMic || "").includes("New Black A2");
      if (wantsA2White || wantsA2Black) {
        const a2Qty = Math.max(1, Math.min(8, parseInt(document.getElementById("a2Qty")?.value || "1", 10) || 1));
        const podSku = wantsA2White ? "B22X5AA" : "B22X7AA"; // TAA White / Black
        addLine(results, podSku, "(A2 mic pod TAA)", a2Qty);
        addSupport(results, "a2_mic", supportTerm, a2Qty);
        addLine(results, "B22X3AA"); // A2 Bridge TAA (one per system)
        addSupport(results, "a2_bridge", supportTerm);
        // Required PoE for A2 bridge
        if (!hasSku(results, "A02F9AA")) addLine(results, "A02F9AA", "PoE power injector for G62 or A2 Audio bridge");
      }

      // Camera add-ons (TAA) for X52 / X72 / G62
      {
        const isG62 = hasSku(results, "99T11AA") || hasSku(results, "99T10AA");
        const isX52 = hasSku(results, "8D8K4AA") || hasSku(results, "8D8K3AA");
        const isX72 = hasSku(results, "A4MA2AA") || hasSku(results, "A4MA1AA");
        if (isG62 || isX52 || isX72) {
          const cam = document.getElementById("cameraChoice")?.value;
          const camPwr = document.getElementById("cameraPower")?.value || "None";
          const camMount = document.getElementById("cameraMount")?.value || "None";
          if (cam === "E60") {
            addLine(results, "9W1A7AA"); // E60 TAA
            addSupport(results, "e60", supportTerm);
            if (camPwr === "Wall" && !hasSku(results, "9W1A9AA#ABA") && !hasSku(results, "9W1A9AA")) {
              addLine(results, "9W1A9AA#ABA", "Poly Studio E60 Power Accessory (wall power supply)");
            }
            if (camPwr === "Injector" && !hasSku(results, "85X03AA#ABA")) {
              addLine(results, "85X03AA#ABA", "Poly PoE+ midspan injector kit");
            }
            if (camMount === "Ceiling" && !hasSku(results, "9W1A8AA#AC3") && !hasSku(results, "9W1A8AA")) {
              addLine(results, "9W1A8AA#AC3", "Poly Studio E60 Ceiling Mount");
            }
          } else if (cam === "E70") {
            addLine(results, pick("886C9AA", "886C8AA")); // E70 TAA JITC / TAA
            addSupport(results, "e70", supportTerm);
            if (camPwr === "Wall" && !hasSku(results, "875K6AA")) {
              addLine(results, "875K6AA", "Poly E70 wall / external power supply (12V 5A)");
            }
            if (camPwr === "Injector" && !hasSku(results, "85X03AA#ABA")) {
              addLine(results, "85X03AA#ABA", "Poly PoE+ midspan injector kit");
            }
            if (camMount === "VESA" && !hasSku(results, "875K7AA")) {
              addLine(results, "875K7AA", "Poly Studio E70 VESA Mounting Kit");
            }
          }
        }
      }

      // Mounting (same physical mounts work for TAA)
      if (mounting && mounting !== "None") {
        const isV12 = hasSku(results, "B95SPAA");
        const isV52 = hasSku(results, "A09D6AA") || hasSku(results, "A09D5AA");
        const isV72 = hasSku(results, "AV1E4AA");
        const isX32 = hasSku(results, "A3SW0AA") || hasSku(results, "A3SV9AA");
        const isX52 = hasSku(results, "8D8K4AA") || hasSku(results, "8D8K3AA");
        const isX72 = hasSku(results, "A4MA2AA") || hasSku(results, "A4MA1AA");
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
      }
    }
    // ========== END TAA / JITC MODE ==========

    // ========== STANDARD COMMERCIAL PATH ==========
    if (!taaJitc) {
      if (isUSBorPC) {
        if (roomSize === "Small") {
          addLine(results, "A9DD8AA#ABA"); // V12
          addSupport(results, "v12", supportTerm);
        } else if (roomSize === "Medium") {
          addLine(results, "A09D4AA#ABA"); // V52
          addSupport(results, "v52", supportTerm);
        } else { // Large or Very large → V72
          addLine(results, "AV1E3AA#ABA");
          addSupport(results, "v72", supportTerm);
        }
        if (typeOfSystem === "Windows PC based solution") {
          if (platform === "Zoom") {
            addLine(results, "9C422AW#ABA");
            addSupport(results, "zoom_pc", supportTerm);
            addLine(results, "875K5AA");
            addSupport(results, "tc10", supportTerm);
          } else if (platform === "Microsoft Teams") {
            addLine(results, "A1ZB6AW#ABA");
            addSupport(results, "g9plus_mtr", supportTerm);
            addLine(results, "875K5AA");
            addSupport(results, "tc10", supportTerm);
          }
        }
      } else {
        // Android appliance
        if (roomSize === "Small") {
          addLine(results, "A3SV5AA#ABA"); // X32
          addSupport(results, "x32", supportTerm);
          // X32 also gets TC10
          if (!hasSku(results, "875K5AA")) addLine(results, "875K5AA");
          addSupport(results, "tc10", supportTerm);
        } else if (roomSize === "Medium") {
          addLine(results, "8D8K2AA#ABA"); // X52
          addSupport(results, "x52", supportTerm);
          addLine(results, "875K5AA");
          addSupport(results, "tc10", supportTerm);
        } else if (roomSize === "Large") {
          addLine(results, "A4LZ8AA#ABA"); // X72
          addSupport(results, "x72", supportTerm);
          addLine(results, "875K5AA");
          addSupport(results, "tc10", supportTerm);
        } else { // Very large → G62
          addLine(results, "A01KCAA#AC3");
          addSupport(results, "g62", supportTerm);
          addLine(results, "875K5AA");
          addSupport(results, "tc10", supportTerm);
        }
      }

      // Camera add-ons for X52 / X72 / G62
      const isX52 = hasSku(results, "8D8K2AA#ABA");
      const isX72 = hasSku(results, "A4LZ8AA#ABA");
      const isG62 = hasSku(results, "A01KCAA#AC3");
      if (isX52 || isX72 || isG62) {
        const cam = document.getElementById("cameraChoice")?.value;
        const camPwr = document.getElementById("cameraPower")?.value || "None";
        const camMount = document.getElementById("cameraMount")?.value || "None";
        if (cam === "E70") {
          if (!hasSku(results, "842F8AA")) addLine(results, "842F8AA");
          addSupport(results, "e70", supportTerm);
          if (camPwr === "Wall" && !hasSku(results, "875K6AA")) {
            addLine(results, "875K6AA", "Poly E70 wall / external power supply (12V 5A)");
          }
          if (camPwr === "Injector" && !hasSku(results, "85X03AA#ABA")) {
            addLine(results, "85X03AA#ABA", "Poly PoE+ midspan injector kit");
          }
          if (camMount === "VESA" && !hasSku(results, "875K7AA")) {
            addLine(results, "875K7AA", "Poly Studio E70 VESA Mounting Kit");
          }
        } else if (cam === "E60") {
          if (!hasSku(results, "9W1A6AA#AC3")) addLine(results, "9W1A6AA#AC3");
          addSupport(results, "e60", supportTerm);
          if (camPwr === "Wall" && !hasSku(results, "9W1A9AA#ABA") && !hasSku(results, "9W1A9AA")) {
            addLine(results, "9W1A9AA#ABA", "Poly Studio E60 Power Accessory (wall power supply)");
          }
          if (camPwr === "Injector" && !hasSku(results, "85X03AA#ABA")) {
            addLine(results, "85X03AA#ABA", "Poly PoE+ midspan injector kit");
          }
          if (camMount === "Ceiling" && !hasSku(results, "9W1A8AA#AC3") && !hasSku(results, "9W1A8AA")) {
            addLine(results, "9W1A8AA#AC3", "Poly Studio E60 Ceiling Mount");
          }
        }
      }

      // A2 mics (commercial)
      {
        const wantsA2White = (expansionMic || "").includes("New White A2");
        const wantsA2Black = (expansionMic || "").includes("New Black A2");
        if (wantsA2White || wantsA2Black) {
          const a2Qty = Math.max(1, Math.min(8, parseInt(document.getElementById("a2Qty")?.value || "1", 10) || 1));
          const podSku = wantsA2White ? "B22X4AA#AC3" : "B22X6AA#AC3"; // commercial White / Black
          addLine(results, podSku, wantsA2White ? "Poly Studio A2 Table Microphone — White" : "Poly Studio A2 Table Microphone — Black", a2Qty);
          addSupport(results, "a2_mic", supportTerm, a2Qty);
          if (!hasSku(results, "B22X2AA#AC3")) {
            addLine(results, "B22X2AA#AC3", "Poly Studio A2 Audio Bridge");
          }
          addSupport(results, "a2_bridge", supportTerm);
          // Required PoE for A2 bridge
          if (!hasSku(results, "A02F9AA")) addLine(results, "A02F9AA", "PoE power injector for G62 or A2 Audio bridge");
        }
      }

      // Scheduling panel
      if (scheduling && scheduling !== "None" && SCHEDULING_MAP[scheduling]) {
        const sch = SCHEDULING_MAP[scheduling];
        addLine(results, sch.commercialTc10, sch.label);
        addSupport(results, "tc10", supportTerm);
        if (sch.glassMount) addLine(results, sch.glassMount);
      }
    }
    // ========== END STANDARD PATH ==========

    // Free-form accessories
    accessories.forEach(sku => addLine(results, sku, sku));

    // ---------- render table + correct total ----------
    let html = `<p class="text-xs text-gray-500 mb-1">Build ${VERSION} — generated ${new Date().toLocaleDateString()}</p>`;
    html += `<h2 class="font-semibold mb-2">Your BOM:</h2>`;
    html += `<table class="w-full border-collapse text-sm"><thead><tr>`;
    html += `<th class="border px-4 py-2 text-left">Qty</th>`;
    html += `<th class="border px-4 py-2 text-left">SKU</th>`;
    html += `<th class="border px-4 py-2 text-left">Description</th>`;
    if (includePrices) html += `<th class="border px-4 py-2 text-left">MSRP</th>`;
    html += `</tr></thead><tbody>`;

    let grandTotal = 0;
    let pricedLines = 0;
    let unpricedLines = 0;

    results.forEach(r => {
      const sku = r.sku || "—";
      const qty = Number(r.quantity) || 0;
      const unit = (typeof r.msrp === "number") ? r.msrp : null;

      if (unit != null) {
        grandTotal += unit * qty;
        pricedLines++;
      } else {
        unpricedLines++;
      }

      html += `<tr>
        <td class="border px-4 py-2">${r.quantity}</td>
        <td class="border px-4 py-2">${sku}</td>
        <td class="border px-4 py-2">${r.description}</td>`;
      if (includePrices) {
        html += `<td class="border px-4 py-2">${fmtCurrency(r.msrp)}</td>`;
      }
      html += `</tr>`;
    });

    if (includePrices) {
      html += `<tr class="bg-blue-50 font-semibold">
        <td class="border px-4 py-2" colspan="3">Estimated MSRP Total</td>
        <td class="border px-4 py-2">${fmtCurrency(grandTotal)}</td>
      </tr>`;
    }

    html += `</tbody></table>`;

    if (includePrices) {
      html += `<p class="text-xs text-gray-600 mt-2">Total is Qty × unit MSRP for lines with a known price (${pricedLines} priced line${pricedLines === 1 ? "" : "s"}).`;
      if (unpricedLines > 0) {
        html += ` ${unpricedLines} line${unpricedLines === 1 ? "" : "s"} have no MSRP in the catalog and are excluded from the total.`;
      }
      html += ` Prices are list MSRP and may not reflect final quote.</p>`;
    }

    resultDiv.innerHTML = html;
  }
}

window.onload = init;
