(function () {
  'use strict';
  const PRODUCT = 'rentreceipt';
  const PRICE = 99;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── seed/fallback templates (shape IDENTICAL to scripts/tool-data/rentreceipt.js) ──
  const FALLBACK = [
    { slug: 'simple', name: 'Simple', category: 'plain', is_free: true, sort_order: 1,
      description: 'Clean, no-frills receipt — just the essentials an HR/CA needs.',
      data: { style: 'simple', accent: '#2f6b4f', headingFont: 'helvetica', note: '' } },
    { slug: 'bordered', name: 'Bordered', category: 'formal', is_free: false, sort_order: 2,
      description: 'Framed receipt with a header rule — looks official on file.',
      data: { style: 'bordered', accent: '#3a5bbf', headingFont: 'helvetica', note: '' } },
    { slug: 'classic', name: 'Classic', category: 'formal', is_free: false, sort_order: 3,
      description: 'Serif heading, boxed amount — a traditional rent-book look.',
      data: { style: 'bordered', accent: '#9a3b2e', headingFont: 'times', note: '' } },
  ];

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'];

  // ── state ──
  let templates = [];
  let current = null;   // selected template
  let style = null;     // current style descriptor (a copy of template.data)
  const form = {
    tenant: 'Rahul Sharma',
    landlord: 'Suresh Kumar',
    pan: '',
    address: 'Flat 402, Green Meadows, Sector 21, Gurugram',
    rent: 15000,
    startMonth: new Date().getMonth(),
    startYear: new Date().getFullYear(),
    months: 12,
    mode: 'Bank Transfer',
    city: 'Gurugram',
    signLabel: '',
  };

  const $ = (id) => document.getElementById(id);

  // ── number → Indian words ──
  function numberToWords(num) {
    num = Math.floor(Math.abs(Number(num) || 0));
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoDigits(n) {
      if (n < 20) return ones[n];
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    }
    function threeDigits(n) {
      const h = Math.floor(n / 100), r = n % 100;
      let s = '';
      if (h) s += ones[h] + ' Hundred' + (r ? ' ' : '');
      if (r) s += twoDigits(r);
      return s;
    }
    let words = '';
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    const rest = num;
    if (crore) words += threeDigits(crore) + ' Crore ';
    if (lakh) words += threeDigits(lakh) + ' Lakh ';
    if (thousand) words += threeDigits(thousand) + ' Thousand ';
    if (rest) words += threeDigits(rest);
    return words.trim();
  }
  function rupeesInWords(amount) { return numberToWords(amount) + ' Rupees Only'; }

  // ── month math ──
  function monthAt(i) {
    // returns {month:0-11, year} for the i-th month starting from form.start
    const idx = form.startMonth + i;
    return { month: ((idx % 12) + 12) % 12, year: form.startYear + Math.floor(idx / 12) };
  }
  function monthLabel(i) { const m = monthAt(i); return `${MONTHS[m.month]} ${m.year}`; }
  // A representative payment date: the 5th of that month.
  function dateFor(i) { const m = monthAt(i); return `05 ${MONTHS[m.month].slice(0, 3)} ${m.year}`; }
  function receiptNo(i) { const m = monthAt(i); return `RR-${m.year}${String(m.month + 1).padStart(2, '0')}`; }

  function fmtAmount(n) { return Number(n || 0).toLocaleString('en-IN'); }
  function stampNeeded(i) { return form.mode === 'Cash' && Number(form.rent) > 5000; }

  // ── HTML preview (first month) ──
  function receiptHTML(i) {
    const accent = (style && style.accent) || '#2f6b4f';
    const bordered = style && style.style === 'bordered';
    const serif = style && style.headingFont === 'times';
    const amt = fmtAmount(form.rent);
    const words = rupeesInWords(form.rent);
    const wrap = bordered ? `border:2px solid ${accent};` : '';
    const headFont = serif ? "Georgia,'Times New Roman',serif" : "'Space Grotesk',Inter,sans-serif";
    return `
      <div style="background:#ffffff;color:#1c2430;width:100%;max-width:640px;margin:0 auto;padding:34px 36px;border-radius:6px;${wrap}box-sizing:border-box;font-family:Inter,Arial,sans-serif;box-shadow:0 10px 40px rgba(2,6,23,.25)">
        <div style="text-align:center;border-bottom:2px solid ${accent};padding-bottom:12px;margin-bottom:18px">
          <div style="font-family:${headFont};font-weight:700;font-size:26px;letter-spacing:.16em;color:${accent}">RENT RECEIPT</div>
          <div style="font-size:12.5px;color:#6b7280;margin-top:4px">For HRA exemption under Section 10(13A)</div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#374151;margin-bottom:16px">
          <div><strong>Receipt No:</strong> ${esc(receiptNo(i))}</div>
          <div><strong>Date:</strong> ${esc(dateFor(i))}</div>
        </div>
        <div style="font-size:15px;line-height:1.7;color:#1c2430">
          Received a sum of <strong>₹${esc(amt)}/-</strong> (${esc(words)})
          from <strong>${esc(form.tenant || '—')}</strong>
          towards rent of the property situated at <strong>${esc(form.address || '—')}</strong>
          for the month of <strong>${esc(monthLabel(i))}</strong>, paid via <strong>${esc(form.mode)}</strong>.
        </div>
        ${form.pan ? `<div style="font-size:13px;color:#374151;margin-top:14px"><strong>Landlord PAN:</strong> ${esc(form.pan)}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:40px">
          <div style="font-size:12.5px;color:#6b7280">${esc(form.city ? 'Place: ' + form.city : '')}</div>
          <div style="text-align:center">
            <div style="width:180px;border-top:1px solid #374151;padding-top:6px;font-size:13px;color:#1c2430">
              ${esc(form.signLabel || form.landlord || 'Landlord')}
            </div>
            <div style="font-size:11.5px;color:#6b7280;margin-top:2px">(Signature of Landlord)</div>
          </div>
        </div>
        ${stampNeeded(i) ? `<div style="margin-top:18px;font-size:11.5px;color:#9a3b2e;border:1px dashed #9a3b2e;border-radius:6px;padding:8px 10px">Affix Re.1 revenue stamp for cash payments over ₹5,000 and obtain the landlord's signature across it.</div>` : ''}
      </div>`;
  }

  function renderPreview() {
    const host = $('receiptPreview');
    if (!host) return;
    host.innerHTML = receiptHTML(0);
    const meta = $('previewMeta');
    if (meta) meta.textContent = `Showing receipt 1 of ${form.months} · ${monthLabel(0)} → ${monthLabel(form.months - 1)}`;
  }

  // ── form UI ──
  function renderForm() {
    const p = $('formPanel');
    const yearNow = new Date().getFullYear();
    const years = [];
    for (let y = yearNow - 3; y <= yearNow + 1; y++) years.push(y);
    p.innerHTML = `
      <div class="fp-group">
        <h4>People</h4>
        <label class="fld-lbl">Tenant (employee) name</label>
        <input class="fp-input" id="fTenant" value="${esc(form.tenant)}">
        <label class="fld-lbl">Landlord name</label>
        <input class="fp-input" id="fLandlord" value="${esc(form.landlord)}">
        <label class="fld-lbl">Landlord PAN <span class="opt">(optional — needed if annual rent > ₹1,00,000)</span></label>
        <input class="fp-input" id="fPan" value="${esc(form.pan)}" placeholder="ABCDE1234F" maxlength="10">
      </div>
      <div class="fp-group">
        <h4>Property & rent</h4>
        <label class="fld-lbl">Full property address</label>
        <textarea class="fp-input" id="fAddress" rows="2">${esc(form.address)}</textarea>
        <label class="fld-lbl">Monthly rent (₹)</label>
        <input class="fp-input" id="fRent" type="number" min="0" value="${esc(form.rent)}">
        <label class="fld-lbl">City</label>
        <input class="fp-input" id="fCity" value="${esc(form.city)}">
      </div>
      <div class="fp-group">
        <h4>Period</h4>
        <div class="two-col">
          <div>
            <label class="fld-lbl">Start month</label>
            <select class="fp-input" id="fStartMonth">${MONTHS.map((m, i) => `<option value="${i}" ${form.startMonth === i ? 'selected' : ''}>${m}</option>`).join('')}</select>
          </div>
          <div>
            <label class="fld-lbl">Start year</label>
            <select class="fp-input" id="fStartYear">${years.map((y) => `<option value="${y}" ${form.startYear === y ? 'selected' : ''}>${y}</option>`).join('')}</select>
          </div>
        </div>
        <label class="fld-lbl">Number of months</label>
        <input class="fp-input" id="fMonths" type="number" min="1" max="24" value="${esc(form.months)}">
        <label class="fld-lbl">Payment mode</label>
        <select class="fp-input" id="fMode">${MODES.map((m) => `<option ${form.mode === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
      </div>
      <div class="fp-group">
        <h4>Signature</h4>
        <label class="fld-lbl">Signature label <span class="opt">(optional — defaults to landlord name)</span></label>
        <input class="fp-input" id="fSign" value="${esc(form.signLabel)}" placeholder="${esc(form.landlord)}">
      </div>`;
    wireForm();
  }

  function wireForm() {
    const bind = (id, key, transform) => {
      const el = $(id); if (!el) return;
      el.addEventListener('input', () => { form[key] = transform ? transform(el.value) : el.value; renderPreview(); });
      el.addEventListener('change', () => { form[key] = transform ? transform(el.value) : el.value; renderPreview(); });
    };
    bind('fTenant', 'tenant');
    bind('fLandlord', 'landlord');
    bind('fPan', 'pan', (v) => v.toUpperCase().trim());
    bind('fAddress', 'address');
    bind('fRent', 'rent', (v) => Number(v) || 0);
    bind('fCity', 'city');
    bind('fStartMonth', 'startMonth', (v) => Number(v));
    bind('fStartYear', 'startYear', (v) => Number(v));
    bind('fMonths', 'months', (v) => Math.min(24, Math.max(1, Number(v) || 1)));
    bind('fMode', 'mode');
    bind('fSign', 'signLabel');
  }

  // ── gallery (style picker) ──
  async function loadGallery() {
    const grid = $('galleryGrid');
    try {
      templates = await ToolKit.api.get(`/api/tools/${PRODUCT}/templates`);
      if (!Array.isArray(templates) || !templates.length) templates = FALLBACK;
    } catch (e) {
      templates = FALLBACK;
    }
    renderGallery();
  }
  function renderGallery() {
    const licensed = ToolKit.isLicensed();
    $('galleryGrid').innerHTML = templates.map((t) => {
      const d = t.data || {};
      const accent = d.accent || '#2f6b4f';
      const bordered = d.style === 'bordered';
      const serif = d.headingFont === 'times';
      const locked = !t.is_free && !licensed;
      const active = current && current.slug === t.slug;
      return `<div class="gal-card ${active ? 'active' : ''}" data-slug="${esc(t.slug)}">
        <div class="gal-thumb" style="${bordered ? `border:2px solid ${accent};` : ''}">
          <div class="gt" style="color:${accent};font-family:${serif ? 'Georgia,serif' : "'Space Grotesk',sans-serif"}">RENT RECEIPT</div>
          <div class="grule" style="background:${accent}"></div>
          <div class="gr"></div><div class="gr" style="width:82%"></div><div class="gr" style="width:64%"></div>
          <div class="gsign"></div>
        </div>
        <div class="gal-body"><span class="gal-name">${esc(t.name)}</span>${t.is_free ? '<span class="badge-free">FREE</span>' : (locked ? '<span class="badge-pro">PRO</span>' : '')}</div>
      </div>`;
    }).join('');
    $('galleryGrid').querySelectorAll('.gal-card').forEach((c) => c.addEventListener('click', () => pick(c.dataset.slug)));
  }
  function pick(slug) {
    const t = templates.find((x) => x.slug === slug);
    if (!t) return;
    // Style is a free choice; the 12-receipt export stays gated regardless.
    current = t;
    style = JSON.parse(JSON.stringify(t.data || {}));
    const ov = $('galleryOverlay'); if (ov) ov.classList.remove('open');
    renderGallery();
    renderPreview();
  }

  // ── PDF helpers ──
  function wrapText(pdf, text, maxWidth) { return pdf.splitTextToSize(String(text), maxWidth); }

  function watermarkPage(pdf, pw, ph) {
    pdf.saveGraphicsState && pdf.saveGraphicsState();
    try { if (pdf.setGState) pdf.setGState(new pdf.GState({ opacity: 0.12 })); } catch (e) {}
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    const label = `PREVIEW - PAY Rs${PRICE}`;
    for (let y = 60; y < ph; y += 130) {
      for (let x = -40; x < pw + 80; x += 240) {
        pdf.text(label, x, y, { angle: 30 });
      }
    }
    try { if (pdf.setGState) pdf.setGState(new pdf.GState({ opacity: 1 })); } catch (e) {}
    pdf.saveGraphicsState && pdf.restoreGraphicsState();
    pdf.setTextColor(0, 0, 0);
  }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [47, 107, 79];
  }

  function drawReceipt(pdf, i, opts) {
    opts = opts || {};
    const pw = pdf.internal.pageSize.getWidth();
    const bordered = style && style.style === 'bordered';
    const serif = style && style.headingFont === 'times';
    const [r, g, b] = hexToRgb(style && style.accent);
    const M = 56;              // page margin
    const boxTop = 70;
    const boxL = M, boxR = pw - M, boxW = boxR - boxL;

    if (bordered) {
      pdf.setDrawColor(r, g, b);
      pdf.setLineWidth(1.4);
      pdf.rect(boxL - 10, boxTop - 24, boxW + 20, 640);
    }

    // Heading
    pdf.setTextColor(r, g, b);
    pdf.setFont(serif ? 'times' : 'helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('RENT RECEIPT', pw / 2, boxTop, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(110, 110, 110);
    pdf.text('For HRA exemption under Section 10(13A)', pw / 2, boxTop + 16, { align: 'center' });
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(1);
    pdf.line(boxL, boxTop + 26, boxR, boxTop + 26);

    // Receipt no / date
    let y = boxTop + 52;
    pdf.setTextColor(40, 45, 55);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Receipt No: ', boxL, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(receiptNo(i), boxL + 62, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date: ', boxR - 96, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(dateFor(i), boxR - 66, y);

    // Body
    y += 34;
    pdf.setFontSize(12);
    pdf.setTextColor(28, 36, 48);
    const amt = fmtAmount(form.rent);
    const body = `Received a sum of Rs ${amt}/- (${rupeesInWords(form.rent)}) from ${form.tenant || '-'} `
      + `towards rent of the property situated at ${form.address || '-'} for the month of ${monthLabel(i)}, `
      + `paid via ${form.mode}.`;
    const lines = wrapText(pdf, body, boxW);
    pdf.text(lines, boxL, y);
    y += lines.length * 16 + 10;

    if (form.pan) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Landlord PAN: ', boxL, y);
      pdf.setFont('helvetica', 'normal');
      pdf.text(String(form.pan), boxL + 78, y);
      y += 22;
    }

    // Signature block
    const sigY = Math.max(y + 40, boxTop + 210);
    if (form.city) {
      pdf.setFontSize(10);
      pdf.setTextColor(110, 110, 110);
      pdf.text('Place: ' + form.city, boxL, sigY);
    }
    pdf.setDrawColor(60, 60, 60);
    pdf.setLineWidth(0.6);
    pdf.line(boxR - 170, sigY, boxR, sigY);
    pdf.setTextColor(28, 36, 48);
    pdf.setFontSize(11);
    pdf.text(String(form.signLabel || form.landlord || 'Landlord'), boxR - 85, sigY + 14, { align: 'center' });
    pdf.setFontSize(9.5);
    pdf.setTextColor(110, 110, 110);
    pdf.text('(Signature of Landlord)', boxR - 85, sigY + 27, { align: 'center' });

    if (stampNeeded(i)) {
      const ny = sigY + 52;
      pdf.setDrawColor(154, 59, 46);
      pdf.setLineWidth(0.6);
      pdf.rect(boxL, ny - 12, boxW, 30);
      pdf.setTextColor(154, 59, 46);
      pdf.setFontSize(9);
      const note = wrapText(pdf, 'Affix Re.1 revenue stamp for cash payments over Rs 5,000 and obtain the landlord signature across it.', boxW - 16);
      pdf.text(note, boxL + 8, ny);
    }

    if (opts.watermark) watermarkPage(pdf, pw, pdf.internal.pageSize.getHeight());
    pdf.setTextColor(0, 0, 0);
  }

  async function exportReceipts() {
    const licensed = ToolKit.isLicensed();
    const btn = $('exportReceipts');
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Building PDF…';
    try {
      const jsPDF = await ToolKit.ensureJsPDF();
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const count = licensed ? form.months : 1; // free: only the first month
      for (let i = 0; i < count; i++) {
        if (i > 0) pdf.addPage();
        drawReceipt(pdf, i, { watermark: !licensed });
      }
      const base = (form.tenant || 'rent').replace(/[^a-z0-9]+/gi, '_');
      pdf.save(`${base}_rent_receipts.pdf`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
    // Nudge unlicensed users to unlock the remaining months.
    if (!licensed) ToolKit.showLicense();
  }

  // ── Rent agreement PDF (licensed only) ──
  function drawAgreement(pdf) {
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const M = 56, W = pw - M * 2;
    const [r, g, b] = hexToRgb(style && style.accent);
    let y = 64;

    pdf.setTextColor(r, g, b);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('LEAVE & LICENSE AGREEMENT', pw / 2, y, { align: 'center' });
    pdf.setDrawColor(r, g, b); pdf.setLineWidth(1);
    pdf.line(M, y + 10, pw - M, y + 10);
    y += 36;

    pdf.setTextColor(28, 36, 48);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    const start = monthLabel(0);
    const end = monthLabel(10); // 11-month term
    const para = (text) => {
      const lines = wrapText(pdf, text, W);
      if (y + lines.length * 15 > ph - 60) { pdf.addPage(); y = 64; }
      pdf.text(lines, M, y);
      y += lines.length * 15 + 10;
    };

    para(`This Leave & License Agreement is made on ${dateFor(0)} at ${form.city || '________'}.`);
    para(`BETWEEN ${form.landlord || '________'} (hereinafter called the "Licensor" / Landlord)`
      + ` AND ${form.tenant || '________'} (hereinafter called the "Licensee" / Tenant).`);
    para(`WHEREAS the Licensor is the owner of the premises situated at ${form.address || '________'}`
      + ` (hereinafter the "said Premises") and has agreed to grant a license to the Licensee on the following terms and conditions:`);

    pdf.setFont('helvetica', 'bold'); para('1. TERM');
    pdf.setFont('helvetica', 'normal');
    para(`The license is granted for a period of 11 (eleven) months commencing from ${start} and ending on ${end}, renewable on mutual consent.`);

    pdf.setFont('helvetica', 'bold'); para('2. LICENSE FEE (RENT)');
    pdf.setFont('helvetica', 'normal');
    para(`The Licensee shall pay a monthly rent of Rs ${fmtAmount(form.rent)}/- (${rupeesInWords(form.rent)}), payable via ${form.mode} on or before the 5th of each month.`);

    pdf.setFont('helvetica', 'bold'); para('3. DEPOSIT');
    pdf.setFont('helvetica', 'normal');
    para(`The Licensee has paid an interest-free refundable security deposit, to be returned at the end of the term after deducting dues and damages, if any.`);

    pdf.setFont('helvetica', 'bold'); para('4. USE OF PREMISES');
    pdf.setFont('helvetica', 'normal');
    para(`The said Premises shall be used by the Licensee for residential purposes only and shall not be sub-let or assigned without the written consent of the Licensor.`);

    pdf.setFont('helvetica', 'bold'); para('5. MAINTENANCE & UTILITIES');
    pdf.setFont('helvetica', 'normal');
    para(`The Licensee shall pay for electricity, water and other utility charges as per actuals and keep the Premises in good condition.`);

    pdf.setFont('helvetica', 'bold'); para('6. TERMINATION');
    pdf.setFont('helvetica', 'normal');
    para(`Either party may terminate this Agreement by giving one (1) month's written notice to the other party.`);

    if (form.pan) para(`Landlord PAN: ${form.pan}`);

    if (y > ph - 120) { pdf.addPage(); y = 64; }
    y += 20;
    para('IN WITNESS WHEREOF the parties have signed this Agreement on the date first written above.');
    y += 20;
    pdf.setDrawColor(60, 60, 60); pdf.setLineWidth(0.6);
    pdf.line(M, y, M + 180, y);
    pdf.line(pw - M - 180, y, pw - M, y);
    y += 14;
    pdf.setFontSize(10);
    pdf.text(`Licensor: ${form.landlord || '________'}`, M, y);
    pdf.text(`Licensee: ${form.tenant || '________'}`, pw - M - 180, y);
  }

  async function exportAgreement() {
    if (!ToolKit.isLicensed()) return ToolKit.showLicense();
    const btn = $('exportAgreement');
    const label = btn.textContent; btn.disabled = true; btn.textContent = 'Building PDF…';
    try {
      const jsPDF = await ToolKit.ensureJsPDF();
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      drawAgreement(pdf);
      const base = (form.tenant || 'rent').replace(/[^a-z0-9]+/gi, '_');
      pdf.save(`${base}_rent_agreement.pdf`);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
    btn.disabled = false; btn.textContent = label;
  }

  // ── init ──
  function updatePill() {
    const pill = $('licenseStatus'); const btn = $('btnUnlock');
    if (ToolKit.isLicensed()) {
      pill.innerHTML = '<span style="color:var(--success)">✓ Unlocked</span>';
      if (btn) btn.style.display = 'none';
    } else {
      pill.textContent = 'Free preview · 1 month, watermarked';
      if (btn) btn.style.display = '';
    }
  }

  async function init() {
    await ToolKit.init({
      product: PRODUCT,
      onUnlock: () => { updatePill(); renderGallery(); },
    });
    updatePill();
    $('btnUnlock').addEventListener('click', () => ToolKit.showLicense());
    $('changeStyle').addEventListener('click', () => $('galleryOverlay').classList.add('open'));
    $('galleryClose').addEventListener('click', () => $('galleryOverlay').classList.remove('open'));
    $('galleryOverlay').addEventListener('click', (e) => { if (e.target === $('galleryOverlay')) $('galleryOverlay').classList.remove('open'); });
    $('exportReceipts').addEventListener('click', exportReceipts);
    $('exportAgreement').addEventListener('click', exportAgreement);

    await loadGallery();
    pick((templates[0] && templates[0].slug) || 'simple');
    renderForm();
    renderPreview();
  }

  init();
})();
