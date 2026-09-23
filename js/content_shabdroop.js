export function initializeShadbroopTable(data, containerEL) {
  bindGlobalDropdownClose();

  populateEnding(containerEL, data);
  populateSubtype(containerEL, data);
  populateGender(containerEL, data);
  populateWord(containerEL, data);
  populateTable(containerEL, data);
}

/* ---------------- Dropdown core ---------------- */

function initDropdown(containerEL, filterId, options) {
  const dd = containerEL.querySelector(`[data-dd="${filterId}"]`);
  if (!dd) {
    console.log(`Dropdown container not found: ${filterId}`);
    return;
  }

  const select = dd.querySelector(`#${CSS.escape(filterId)}`);
  const btn = dd.querySelector(".dd-btn");
  const menu = dd.querySelector(".dd-menu");
  const labelEl = btn?.querySelector(".dd-label");
  const label = labelEl || btn;

  if (!select || !btn || !menu) return;

  if (!Array.isArray(options) || options.length === 0) {
    // Clear UI if no options exist
    select.innerHTML = "";
    menu.innerHTML = "";
    if (label) label.textContent = "";
    return;
  }

  // prevent duplicate listeners if you re-init
  if (!dd._ddBound) {
    dd._ddBound = true;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const willOpen = !dd.classList.contains("open");
      closeAllDropdowns(dd);
      dd.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", willOpen ? "true" : "false");

      if (willOpen) {
        menu.focus?.();
      }
    });

    // don't let clicks inside close it
    dd.addEventListener("click", (e) => e.stopPropagation());

    // ESC closes
    menu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dd.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  } else {
    // already bound: just rebuild options
    select.innerHTML = "";
    menu.innerHTML = "";
  }

  // build options
  options.forEach((opt, idx) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.name;
    select.appendChild(o);

    const li = document.createElement("li");
    li.className = "dd-item";
    li.setAttribute("role", "option");
    li.textContent = opt.name;
    li.dataset.value = opt.value;

    li.addEventListener("click", () => {
      select.selectedIndex = idx;
      if (label) label.textContent = opt.name;
      select.dispatchEvent(new Event("change", { bubbles: true }));

      dd.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });

    menu.appendChild(li);
  });

  // select first by default (if nothing selected)
  select.selectedIndex = 0;
  if (label) label.textContent = select.options[0]?.textContent || "";
}

function bindGlobalDropdownClose() {
  if (document._ddGlobalBound) return;
  document._ddGlobalBound = true;

  document.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-ending.open, .filter-subtype.open, .filter-gender.open, .filter-word.open")
      .forEach((el) => el.classList.remove("open"));

    document
      .querySelectorAll(".dd-btn[aria-expanded='true']")
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
  });
}

function closeAllDropdowns(except = null) {
  document
    .querySelectorAll(".filter-ending.open, .filter-subtype.open, .filter-gender.open, .filter-word.open")
    .forEach((el) => {
      if (el !== except) {
        el.classList.remove("open");
        const btn = el.querySelector(".dd-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    });
}

/* ---------------- Populate filters ---------------- */

function populateEnding(containerEL, data) {
  initDropdown(containerEL, "filter-ending", data["roop-types"] || []);
  const endingSelect = containerEL.querySelector("#filter-ending");
  if (!endingSelect) return;

  if (!endingSelect._bound) {
    endingSelect._bound = true;
    endingSelect.addEventListener("change", () => {
      populateSubtype(containerEL, data);
      populateGender(containerEL, data);
      populateWord(containerEL, data);
      populateTable(containerEL, data);
      bindGlobalDropdownClose();
    });
  }
}

function populateSubtype(containerEL, data) {
  const endingSelect = containerEL.querySelector("#filter-ending");
  if (!endingSelect) return;

  const all = Array.isArray(data.allsubtypes) ? data.allsubtypes : [];
  const subtypes = all.filter((item) => item.type === endingSelect.value);

  initDropdown(containerEL, "filter-subtype", subtypes);

  const subtypeSelect = containerEL.querySelector("#filter-subtype");
  if (!subtypeSelect) return;

  if (!subtypeSelect._bound) {
    subtypeSelect._bound = true;
    subtypeSelect.addEventListener("change", () => {
      populateGender(containerEL, data);
      populateWord(containerEL, data);
      populateTable(containerEL, data);
      bindGlobalDropdownClose();
    });
  }
}

function populateGender(containerEL, data) {
  const endingSelect = containerEL.querySelector("#filter-ending");
  const subtypeSelect = containerEL.querySelector("#filter-subtype");
  if (!endingSelect || !subtypeSelect) return;

  const words = Array.isArray(data.words) ? data.words : [];

  const genderAvailable = new Set(
    words
      .filter(
        (item) =>
          item.endingType === endingSelect.value &&
          (item.pattern || "").startsWith(`${subtypeSelect.value}_`)
      )
      .map((item) => item.gender)
  );

  const genders = Array.isArray(data.gender) ? data.gender : [];
  initDropdown(containerEL, "filter-gender", genders.filter((g) => genderAvailable.has(g.value)));

  const genderSelect = containerEL.querySelector("#filter-gender");
  if (!genderSelect) return;

  if (!genderSelect._bound) {
    genderSelect._bound = true;
    genderSelect.addEventListener("change", () => {
      populateWord(containerEL, data);
      populateTable(containerEL, data);
      bindGlobalDropdownClose();
    });
  }
}

function populateWord(containerEL, data) {
  const endingSelect = containerEL.querySelector("#filter-ending");
  const subtypeSelect = containerEL.querySelector("#filter-subtype");
  const genderSelect = containerEL.querySelector("#filter-gender");
  if (!endingSelect || !subtypeSelect || !genderSelect) return;

  const words = Array.isArray(data.words) ? data.words : [];

  const wordAvailable = words
    .filter(
      (item) =>
        item.endingType === endingSelect.value &&
        (item.pattern || "").startsWith(`${subtypeSelect.value}_`) &&
        item.gender === genderSelect.value
    )
    .map((item) => ({ value: item.id, name: item.name }));

  initDropdown(containerEL, "filter-word", wordAvailable);

  const wordSelect = containerEL.querySelector("#filter-word");
  if (!wordSelect) return;

  if (!wordSelect._bound) {
    wordSelect._bound = true;
    wordSelect.addEventListener("change", () => {
      populateTable(containerEL, data);
      bindGlobalDropdownClose();
    });
  }
}

/* ---------------- Table rendering ---------------- */

function populateTable(containerEL, data) {
  const subtypeSelect = containerEL.querySelector("#filter-subtype");
  const wordSelect = containerEL.querySelector("#filter-word");
  const wordInfo = containerEL.querySelector("#word-info");
  const table = containerEL.querySelector("#study-table");
  const tbody = table?.querySelector("tbody");

  if (!subtypeSelect || !wordSelect || !wordInfo || !tbody) return;

  const subtypeText = subtypeSelect.options[subtypeSelect.selectedIndex]?.textContent || "";

  const words = Array.isArray(data.words) ? data.words : [];
  const selectedWord = words.find((w) => String(w.id) === String(wordSelect.value));

  if (!selectedWord) {
    wordInfo.textContent = "कृपया शब्द चुनिए।";
    tbody.innerHTML = "";
    return;
  }

  const genders = Array.isArray(data.gender) ? data.gender : [];
  const genderName = genders.find((g) => g.value === selectedWord.gender)?.name || selectedWord.gender;

  // update word info
  wordInfo.innerHTML =
    `<span class="badge gender-${selectedWord.gender}">${genderName}</span>` +
    `<span class="badge ${selectedWord.endingType}">${subtypeText}</span>` +
    `<span class="badge meaning">     शब्दार्थ: ${selectedWord.Meaning ?? ""}</span>`;

  const vibhaktis = Array.isArray(data.vibhaktis) ? data.vibhaktis : [];
  const vachanas = Array.isArray(data.vachanas) ? data.vachanas : [];

  const forms = generateforms(selectedWord, data);
  if (!forms) {
    tbody.innerHTML = `<tr><td class="sanskrit-td" colspan="4">इस शब्द का पैटर्न उपलब्ध नहीं है</td></tr>`;
    return;
  }

  let rows = "";
  for (let i = 0; i < vibhaktis.length; i++) {
    rows += "<tr>";
    rows += `<td class="sanskrit-td">${vibhaktis[i].name ?? ""}</td>`;
    for (let j = 0; j < vachanas.length; j++) {
      rows += `<td class="sanskrit-td">${forms?.[i]?.[j] ?? ""}</td>`;
    }
    rows += "</tr>";
  }

  tbody.innerHTML = rows;
}

/* ---------------- Pattern helpers ---------------- */

function generateforms(word, data) {
  const pattern = getPattern(data, word.pattern);
  if (!pattern || !pattern.base || !Array.isArray(pattern.forms)) return null;

  const base = pattern.base;
  const safeName = String(word.name ?? "");

  return pattern.forms.map((row) =>
    row.map((cell) => String(cell ?? "").replace(new RegExp(base, "g"), safeName))
  );
}

function getPattern(data, key) {
  if (!key) return null;
  const arr = Array.isArray(data.patterns) ? data.patterns : [];
  const obj = arr.find((p) => p && Object.prototype.hasOwnProperty.call(p, key));
  return obj ? obj[key] : null;
}
