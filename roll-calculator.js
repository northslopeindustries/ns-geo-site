// ─── ROLL CALCULATOR: THE PAGE ────────────────────────────────────────────
//
// Runs the Roll Calculator page: adding and removing areas, switching
// between "Recommend rolls for me" and "Use my roll size", checking what was
// typed, and showing the results. It does no math itself; all the math is in
// roll-calculator-math.js.

(function () {
  const Calc = window.RollCalculator;
  const form = document.getElementById('calc-form');
  if (!Calc || !form) return;

  const MAX_AREAS = 10;   // most areas at once (more makes Recommend slow on phones)
  const MAX_FEET = 500;   // longest side allowed for one area

  const areasBox = document.getElementById('calc-areas');
  const addButton = document.getElementById('calc-add');
  const addLimit = document.getElementById('calc-add-limit');
  const typeStep = document.getElementById('calc-type-step');
  const sizeStep = document.getElementById('calc-size-step');
  const sizeError = document.getElementById('calc-size-error');
  const submit = document.getElementById('calc-submit');
  const formError = document.getElementById('calc-form-error');
  const results = document.getElementById('calc-results');
  const resultsTitle = document.getElementById('calc-results-title');
  const cards = document.getElementById('calc-cards');

  // ─── Areas ──────────────────────────────────────────────────────────────
  const template = areasBox.querySelector('.calc-area').cloneNode(true);

  function areaCards() { return Array.from(areasBox.querySelectorAll('.calc-area')); }

  // Number the areas, label their boxes for screen readers, and only show
  // "Remove" when there is more than one area.
  function renumber() {
    const list = areaCards();
    list.forEach((card, i) => {
      const n = i + 1;
      card.querySelector('.calc-area-title').textContent = 'Area ' + n;
      card.querySelector('.calc-length').setAttribute('aria-label', 'Area ' + n + ' length in feet');
      card.querySelector('.calc-width').setAttribute('aria-label', 'Area ' + n + ' width in feet');
      const remove = card.querySelector('.calc-remove');
      remove.hidden = list.length === 1;
      remove.setAttribute('aria-label', 'Remove area ' + n);
    });
    addButton.hidden = list.length >= MAX_AREAS;
    addLimit.hidden = list.length < MAX_AREAS;
  }

  addButton.addEventListener('click', () => {
    if (areaCards().length >= MAX_AREAS) return;
    const card = template.cloneNode(true);
    card.querySelectorAll('input').forEach(input => { input.value = ''; input.removeAttribute('aria-invalid'); });
    card.querySelector('.calc-field-error').textContent = '';
    areasBox.appendChild(card);
    renumber();
    card.querySelector('.calc-length').focus();
  });

  areasBox.addEventListener('click', (e) => {
    const remove = e.target.closest('.calc-remove');
    if (!remove) return;
    const card = remove.closest('.calc-area');
    const list = areaCards();
    const index = list.indexOf(card);
    card.remove();
    renumber();
    // Put keyboard focus somewhere sensible after the box disappears.
    const rest = areaCards();
    rest[Math.min(index, rest.length - 1)].querySelector('.calc-length').focus();
  });

  // ─── Mode ───────────────────────────────────────────────────────────────
  function mode() { return form.querySelector('input[name="mode"]:checked').value; }

  function showMode() {
    const mine = mode() === 'mine';
    typeStep.hidden = mine;
    sizeStep.hidden = !mine;
  }
  form.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', showMode));
  form.querySelectorAll('input[name="rollSize"]').forEach(r => r.addEventListener('change', () => { sizeError.textContent = ''; }));
  showMode();
  renumber();

  // ─── Checking what was typed ────────────────────────────────────────────
  function readNumber(input) {
    const text = input.value.trim();
    if (text === '') return { error: 'empty' };
    const value = Number(text);
    if (!isFinite(value)) return { error: 'empty' };
    if (value <= 0) return { error: 'zero' };
    if (value > MAX_FEET) return { error: 'big' };
    return { value: value };
  }

  function readAreas() {
    let firstBad = null;
    const areas = areaCards().map(card => {
      const lengthInput = card.querySelector('.calc-length');
      const widthInput = card.querySelector('.calc-width');
      const length = readNumber(lengthInput);
      const width = readNumber(widthInput);
      const messages = [];
      [[length, lengthInput, 'length'], [width, widthInput, 'width']].forEach(([r, input, name]) => {
        if (r.error) {
          input.setAttribute('aria-invalid', 'true');
          if (!firstBad) firstBad = input;
          if (r.error === 'empty') messages.push('Enter the ' + name + ' in feet.');
          if (r.error === 'zero') messages.push('The ' + name + ' must be more than 0.');
          if (r.error === 'big') messages.push('The ' + name + ' must be ' + MAX_FEET + ' feet or less.');
        } else {
          input.removeAttribute('aria-invalid');
        }
      });
      card.querySelector('.calc-field-error').textContent = messages.join(' ');
      return { length: length.value, width: width.value };
    });
    return { areas: areas, firstBad: firstBad };
  }

  // ─── Showing results ────────────────────────────────────────────────────
  function num(x) { return x.toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function plural(n, one, many) { return num(n) + ' ' + (n === 1 ? one : (many || one + 's')); }
  function escape(text) {
    return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function rollLine(r) {
    return plural(r.count, r.type + ' roll') + ', ' + num(r.width) + "' × " + num(r.length) + "'";
  }

  function seamLine(answer) {
    if (answer.seams === 0) return 'None';
    const side = answer.seams - answer.joins;
    const parts = [];
    if (side) parts.push(num(side) + ' between rows');
    if (answer.joins) parts.push(num(answer.joins) + ' where one roll joins the next');
    return num(answer.seams) + ' (' + parts.join(', ') + ')';
  }

  function leftoverLines(answer) {
    if (!answer.leftover.length) return ['None'];
    return answer.leftover.map(l => num(l.feet) + ' ft of ' + num(l.width) + "'-wide fabric (" + num(l.sqft) + ' sq ft)');
  }

  function stapleLine(answer) {
    const p = answer.staplePackaging;
    const parts = [];
    if (p.cases) parts.push(plural(p.cases, 'case') + ' (1,000 each)');
    if (p.bags) parts.push(plural(p.bags, 'bag') + ' (100 each)');
    return plural(answer.staples, 'staple') + ': ' + parts.join(' + ');
  }

  // "2 rows of 8' fabric, then 1 row of 3' fabric"
  function rowsLine(rows) {
    const groups = [];
    rows.forEach(w => {
      const last = groups[groups.length - 1];
      if (last && last.width === w) last.count += 1;
      else groups.push({ width: w, count: 1 });
    });
    return groups.map(g => plural(g.count, 'row') + ' of ' + num(g.width) + "' fabric").join(', then ');
  }

  // The longer side is always the "length", whichever box it was typed in.
  function sides(a) {
    return { long: Math.max(a.length, a.width), short: Math.min(a.length, a.width) };
  }
  function longWay(a) { return a.rowLength >= sides(a).long - 1e-9; }

  function areaName(i, total) { return total > 1 ? 'Area ' + (i + 1) : 'Your area'; }

  function areaLine(a, i, total) {
    const sd = sides(a);
    const way = longWay(a)
      ? 'run rows the long way (' + num(a.rowLength) + "')"
      : 'run rows the short way (' + num(a.rowLength) + "')";
    return '<strong>' + areaName(i, total) + '</strong> (' + num(sd.long) + "' long × " + num(sd.short) + "' wide): " +
      way + ', cutting each row ' + num(a.cutLength) + "' long. " + rowsLine(a.rows) + '.';
  }

  function card(title, answer) {
    const rows = [
      ['Rolls', answer.rolls.map(rollLine).map(escape).join('<br />')],
      ['Seams', escape(seamLine(answer))],
      ['Left over', leftoverLines(answer).map(escape).join('<br />')],
      ['Staples', escape(stapleLine(answer)) + '<span class="calc-card-note">Use more on slopes or in windy areas.</span>'],
    ];
    return '<article class="calc-card">' +
      (title ? '<h3>' + escape(title) + '</h3>' : '') +
      '<dl class="calc-stats">' +
      rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') +
      '</dl>' +
      howToLay(answer) +
      '</article>';
  }

  // ─── Recommend: the list of options ─────────────────────────────────────
  // "60 ft of 8'-wide (480 sq ft) + 60 ft of 3'-wide (180 sq ft), 660 sq ft total"
  function optionLeftover(o) {
    if (!o.leftover.length) return 'None';
    const parts = o.leftover.map(l => num(l.feet) + " ft of " + num(l.width) + "'-wide (" + num(l.sqft) + ' sq ft)');
    if (parts.length === 1) return parts[0];
    return parts.join(' + ') + ', ' + num(o.leftoverSqFt) + ' sq ft total';
  }

  // ─── "How to lay it": drawing, color key, and cut list ──────────────────
  // The drawing is sized to the screen it is shown on, so its labels stay
  // readable on a phone.
  let SVG_W = 600;
  function sizeDiagrams() {
    const box = results.parentElement;
    const style = getComputedStyle(box);
    const inner = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const phone = window.innerWidth <= 480;
    // Card padding, list indent, drawing panel padding, and the drawing's own margins.
    const cardInner = Math.min(inner, 860) - (phone ? 37 : 48) - (phone ? 0 : 18);
    SVG_W = Math.max(180, Math.round(cardInner - (phone ? 26 : 34) - 40));
  }

  // One color per fabric width, in the order the widths are first laid:
  // white, then bright blue, then yellow.
  const FABRIC_COLORS = [
    { line: '#ffffff', text: '#0a1e2e' },
    { line: '#42a5f5', text: '#ffffff' },
    { line: '#ffd54f', text: '#0a1e2e' },
    { line: '#ff8a65', text: '#0a1e2e' },
  ];
  function fabricColors(areas) {
    const order = [];
    areas.forEach(a => a.rows.forEach(w => { if (order.indexOf(w) < 0) order.push(w); }));
    const map = {};
    order.forEach((w, i) => { map[w] = FABRIC_COLORS[Math.min(i, FABRIC_COLORS.length - 1)]; });
    return { map: map, order: order };
  }

  // How wide a row label's text really is, so a label is only dropped when
  // it truly does not fit.
  const measurer = document.createElement('canvas').getContext('2d');
  function textWidth(text) {
    measurer.font = '600 12.5px Roboto, sans-serif';
    return measurer.measureText(text).width + 4;
  }

  function svgText(x, y, text, cls, extra) {
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" class="' + cls + '"' + (extra || '') + '>' + escape(text) + '</text>';
  }

  function diagram(a, i, total, colors) {
    const sd = sides(a);
    const long = longWay(a);
    const rows = a.rows;
    const details = a.rowDetails;
    const many = rows.length > 30;                       // too many rows for text labels
    const step = Calc.RULES.SIDE_OVERLAP;
    const W = SVG_W;
    const xs = W / a.rowLength;                          // the length is always to scale
    // Height: to scale if every row then has room for its number and label;
    // otherwise stretched just enough, with a "not to scale" note.
    let ys = xs;
    let off = 0;
    const offsets = rows.map((w, r) => { const o = off; off += w - step; return o; });
    rows.forEach((w, r) => {
      const hasJoin = details[r].joinsAt.length > 0;
      const need = many ? 22 : (hasJoin ? 44 : 30);
      const isLast = r === rows.length - 1;
      const own = isLast ? Math.min(w, a.span - offsets[r]) - (r > 0 ? step : 0) : w - step - (r > 0 ? step : 0);
      if (own > 0) ys = Math.max(ys, need / own);
    });
    const toScale = ys <= xs * 1.0001;
    const left = 34, top = 30, right = 6;
    const areaH = a.span * ys;
    const lastRow = details[rows.length - 1];
    const overPx = lastRow.overhang * ys;
    const bottom = (overPx > 0 ? overPx + (overPx >= 18 ? 6 : 22) : 6);
    const x0 = left, y0 = top;

    let shapes = '', overlaps = '', joins = '', marks = '', over = '';
    rows.forEach((w, r) => {
      const c = colors.map[w];
      const yTop = y0 + offsets[r] * ys;
      const yBot = y0 + (offsets[r] + w) * ys;
      const yIn = Math.min(yBot, y0 + areaH);            // the part inside the area
      // Overlap with the row before: shaded light blue.
      if (r > 0) {
        const oTop = yTop, oBot = y0 + (offsets[r - 1] + rows[r - 1]) * ys;
        overlaps += '<rect x="' + x0 + '" y="' + oTop.toFixed(1) + '" width="' + W + '" height="' +
          Math.max(3, oBot - oTop).toFixed(1) + '" class="calc-svg-overlap" />';
      }
      // The row's fabric: dotted outline in its width's color.
      shapes += '<rect x="' + (x0 + 2) + '" y="' + (yTop + 1.5).toFixed(1) + '" width="' + (W - 4) + '" height="' +
        Math.max(2, yIn - yTop - (yBot > yIn ? 0 : 3)).toFixed(1) + '" fill="none" stroke="' + c.line + '" class="calc-svg-fabric" />';
      // A last row that runs past the area's edge: the extra part, faded.
      if (yBot > y0 + areaH + 0.5) {
        over += '<rect x="' + (x0 + 2) + '" y="' + (y0 + areaH).toFixed(1) + '" width="' + (W - 4) + '" height="' +
          (yBot - y0 - areaH - 1.5).toFixed(1) + '" stroke="' + c.line + '" class="calc-svg-over" />';
        const msg = num(details[r].overhang) + "' over: trim or overlap more";
        const ty = overPx >= 18 ? y0 + areaH + overPx / 2 + 4 : yBot + 15;
        over += svgText(x0 + W / 2, ty, msg, 'calc-svg-overtext', ' text-anchor="middle"');
      }
      // Number and label, centred in the part of the row no other row covers.
      const ownTop = yTop + (r > 0 ? step * ys : 0);
      const ownBot = r < rows.length - 1 ? y0 + (offsets[r + 1]) * ys : yIn;
      const hasJoin = details[r].joinsAt.length > 0;
      const mid = (ownTop + ownBot) / 2;
      const lineY = hasJoin && !many ? mid - 8 : mid;
      marks += '<circle cx="' + (x0 + 16) + '" cy="' + lineY.toFixed(1) + '" r="10" fill="' + c.line + '" />' +
        svgText(x0 + 16, lineY + 4, String(r + 1), 'calc-svg-num', ' text-anchor="middle" fill="' + c.text + '"');
      const label = 'Row ' + (r + 1) + ' · ' + num(w) + "' roll · cut " + num(details[r].cut) + "'";
      if (!many && textWidth(label) < W - 40) {
        marks += svgText(x0 + 32, lineY + 4.5, label, 'calc-svg-label', ' fill="' + c.line + '"');
      }
      // Joins: a dashed line where a new roll starts, with its distance.
      const jx = details[r].joinsAt.map(d => x0 + Math.max(0, Math.min(a.rowLength, d - Calc.RULES.END_FOLD)) * xs);
      jx.forEach((x, k) => {
        joins += '<line x1="' + x.toFixed(1) + '" y1="' + (ownTop + 1).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + (ownBot - 1).toFixed(1) + '" class="calc-svg-join" />';
        if (many) return;
        const gapNext = k < jx.length - 1 ? jx[k + 1] - x : Infinity;
        const gapPrev = k > 0 ? x - jx[k - 1] : Infinity;
        const room = Math.min(gapNext, gapPrev);
        const longText = 'new roll at ' + num(details[r].joinsAt[k]) + "'";
        const text = room > 112 ? longText : (room > 42 ? num(details[r].joinsAt[k]) + "'" : '');
        if (!text) return;
        const rightSide = x > x0 + W * 0.6;
        marks += svgText(rightSide ? x - 5 : x + 5, mid + 13, text, 'calc-svg-jointext', rightSide ? ' text-anchor="end"' : '');
      });
    });

    const xLabel = long ? num(sd.long) + "' long" : num(a.rowLength) + "' wide";
    const yLabel = long ? num(sd.short) + "' wide" : num(a.span) + "' long";
    const totalH = top + areaH + bottom;
    const sideSeams = rows.length - 1;
    const joinCount = details.reduce((t, d) => t + d.joinsAt.length, 0);
    const desc = num(sd.long) + "' long × " + num(sd.short) + "' wide · rows run the " + (long ? 'long' : 'short') +
      ' way (' + num(a.rowLength) + "') · " + plural(sideSeams, 'side seam') + ', ' + plural(joinCount, 'join');
    const svg = '<svg viewBox="0 0 ' + (left + W + right) + ' ' + totalH.toFixed(0) + '" role="img" aria-label="' +
      escape('Layout drawing for ' + areaName(i, total).toLowerCase() + ': ' + desc + '. ' + rowsLine(rows) + '.') + '">' +
      // Dimension lines.
      '<line x1="' + x0 + '" y1="16" x2="' + (x0 + W) + '" y2="16" class="calc-svg-dimline" />' +
      '<line x1="' + x0 + '" y1="11" x2="' + x0 + '" y2="21" class="calc-svg-dimline" />' +
      '<line x1="' + (x0 + W) + '" y1="11" x2="' + (x0 + W) + '" y2="21" class="calc-svg-dimline" />' +
      svgText(x0 + W / 2, 11, xLabel, 'calc-svg-dim', ' text-anchor="middle"') +
      '<line x1="14" y1="' + y0 + '" x2="14" y2="' + (y0 + areaH).toFixed(1) + '" class="calc-svg-dimline" />' +
      '<line x1="9" y1="' + y0 + '" x2="19" y2="' + y0 + '" class="calc-svg-dimline" />' +
      '<line x1="9" y1="' + (y0 + areaH).toFixed(1) + '" x2="19" y2="' + (y0 + areaH).toFixed(1) + '" class="calc-svg-dimline" />' +
      svgText(9, y0 + areaH / 2, yLabel, 'calc-svg-dim', ' text-anchor="middle" transform="rotate(-90 9 ' + (y0 + areaH / 2).toFixed(1) + ')"') +
      overlaps + over + shapes +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + W + '" height="' + areaH.toFixed(1) + '" class="calc-svg-edge" />' +
      joins + marks +
      '</svg>';

    const key = '<ul class="calc-key">' +
      '<li><span class="calc-key-edge"></span>Your area</li>' +
      rows.filter((w, r) => rows.indexOf(w) === r).map(w =>
        '<li><span class="calc-key-fabric" style="border-color:' + colors.map[w].line + '"></span>' + num(w) + "' fabric</li>").join('') +
      '<li><span class="calc-key-overlap"></span>6" overlap</li>' +
      '<li><span class="calc-key-join"></span>Join (new roll)</li>' +
      '<li><span class="calc-key-over"></span>Overhang</li>' +
      '<li><span class="calc-key-num">1</span>Order to lay</li>' +
      '</ul>';

    return '<figure class="calc-diagram">' +
      '<figcaption><span class="calc-diagram-title">Area ' + (i + 1) + ' layout</span>' +
      '<span class="calc-diagram-sub">' + escape(desc) + '</span></figcaption>' +
      svg + key +
      (toScale ? '' : '<p class="calc-diagram-note">Not to scale: stretched top to bottom so every row has room for its label.</p>') +
      '</figure>';
  }

  // "Roll 2 (6' × 250'): rest of Row 2 (151.5' incl. 6" overlap), Row 3 first 98.5'"
  function cutList(answer) {
    const multi = answer.areas.length > 1;
    const rowName = p => (multi ? 'Area ' + (p.area + 1) + ' ' : '') + 'Row ' + (p.row + 1);
    const lines = answer.cutList.map(roll => {
      const parts = roll.pieces.map(p => {
        if (p.kind === 'whole') return rowName(p) + ' (' + num(p.length) + "')";
        if (p.kind === 'first') return rowName(p) + ' first ' + num(p.length) + "'";
        if (p.kind === 'middle') return 'next ' + num(p.length) + "' of " + rowName(p) + ' (incl. 6" overlap)';
        return 'rest of ' + rowName(p) + ' (' + num(p.length) + "' incl. 6\" overlap)";
      });
      if (roll.scrap > 0) parts.push(num(roll.scrap) + "' scrap (too short to use)");
      if (roll.left > 0) parts.push(num(roll.left) + "' left over");
      return '<li><strong>Roll ' + roll.number + '</strong> (' + num(roll.width) + "' × " + num(roll.length) + "'): " +
        escape(parts.join(', ')) + '</li>';
    });
    return '<h4>Cut list</h4><ul class="calc-cutlist">' + lines.join('') + '</ul>';
  }

  // Each drawing starts hidden behind a "Show drawing" button. The details
  // needed to draw it again (at its real on-screen width) are kept here.
  const drawings = [];
  function howToLay(answer) {
    const colors = fabricColors(answer.areas);
    const total = answer.areas.length;
    return '<h4>How to lay it</h4>' +
      '<ul class="calc-layout">' +
      answer.areas.map((a, i) => {
        const id = drawings.push({ a: a, i: i, total: total, colors: colors }) - 1;
        return '<li>' + areaLine(a, i, total) +
          '<details class="calc-drawing" data-drawing="' + id + '">' +
          '<summary><span class="calc-drawing-more">Show drawing</span><span class="calc-drawing-less">Hide drawing</span>' +
          '<span class="calc-drawing-icon" aria-hidden="true"></span></summary>' +
          diagram(a, i, total, colors) +
          '</details></li>';
      }).join('') +
      '</ul>' +
      cutList(answer);
  }

  // When a drawing is opened, draw it again if it came out a different width
  // than planned, so its text shows at its real size.
  cards.addEventListener('toggle', (e) => {
    const box = e.target;
    if (!box.classList || !box.classList.contains('calc-drawing') || !box.open) return;
    const svg = box.querySelector('svg');
    const d = drawings[Number(box.getAttribute('data-drawing'))];
    if (!svg || !d) return;
    const shown = svg.getBoundingClientRect().width;
    if (shown > 0 && Math.abs(shown - (SVG_W + 40)) > 3) {
      SVG_W = Math.max(180, Math.round(shown - 40));
    }
    if (Math.abs(shown - Number(svg.getAttribute('viewBox').split(' ')[2])) > 3) {
      box.querySelector('.calc-diagram').outerHTML = diagram(d.a, d.i, d.total, d.colors);
    }
  }, true);

  function optionCard(o, index) {
    const rows = [
      ['Rolls', o.rolls.map(rollLine).map(escape).join('<br />')],
      ['Rows', escape(num(o.rowCount))],
      ['Seams', escape(seamLine(o))],
      ['Left over', escape(optionLeftover(o))],
      ['Staples', escape(stapleLine(o)) + '<span class="calc-card-note">Use more on slopes or in windy areas.</span>'],
    ];
    const tags = o.tags.map(t => '<li class="calc-tag' + (t === 'Our pick' ? ' calc-tag-pick' : '') + '">' + escape(t) + '</li>').join('');
    return '<article class="calc-card calc-option' + (index === 0 ? ' calc-option-pick' : '') + '">' +
      '<div class="calc-option-head"><h3>Option ' + (index + 1) + '</h3>' +
      (tags ? '<ul class="calc-tags" aria-label="Why this option">' + tags + '</ul>' : '') + '</div>' +
      '<dl class="calc-stats">' +
      rows.map(r => '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>').join('') +
      '</dl>' +
      howToLay(o) +
      '</article>';
  }

  // ─── Calculate ──────────────────────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.textContent = '';
    const read = readAreas();
    let roll = null;
    if (mode() === 'mine') {
      const picked = form.querySelector('input[name="rollSize"]:checked');
      if (picked) {
        const [w, l] = picked.value.split('x').map(Number);
        roll = Calc.ROLL_SIZES.find(r => r.width === w && r.length === l);
        sizeError.textContent = '';
      } else {
        sizeError.textContent = 'Pick a roll size.';
      }
    }
    if (read.firstBad || (mode() === 'mine' && !roll)) {
      formError.textContent = 'Please fix the highlighted boxes above.';
      if (read.firstBad) read.firstBad.focus();
      else form.querySelector('input[name="rollSize"]').focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Calculating…';
    // Let the button change show before the math runs.
    setTimeout(() => {
      try {
        let render;
        if (mode() === 'mine') {
          const answer = Calc.useMyRoll(read.areas, roll);
          cards.className = 'calc-cards calc-cards-single';
          render = () => { cards.innerHTML = card('', answer); };
        } else {
          const type = form.querySelector('input[name="rollType"]:checked').value;
          const options = Calc.recommend(read.areas, type);
          cards.className = 'calc-cards calc-option-list';
          render = () => { cards.innerHTML = options.map(optionCard).join(''); };
        }
        drawings.length = 0;
        sizeDiagrams();
        render();
        results.hidden = false;
        resultsTitle.focus({ preventScroll: true });
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        formError.textContent = 'Sorry, something went wrong with the calculation. Please check your numbers and try again.';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Calculate';
      }
    }, 30);
  });
})();
