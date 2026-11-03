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

  function areaLine(a, i, total) {
    const side = a.along === 'length' ? 'length' : 'width';
    return (total > 1 ? '<strong>Area ' + (i + 1) + '</strong> (' : '<strong>Your area</strong> (') +
      num(a.length) + "' × " + num(a.width) + "'): run rows along the " + num(a.rowLength) + "' " + side +
      ', cutting each row ' + num(a.cutLength) + "' long. " + rowsLine(a.rows) + '.';
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
      '<h4>How to lay it</h4>' +
      '<ul class="calc-layout">' +
      answer.areas.map((a, i) => '<li>' + areaLine(a, i, answer.areas.length) + '</li>').join('') +
      '</ul>' +
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
        if (mode() === 'mine') {
          cards.className = 'calc-cards calc-cards-single';
          cards.innerHTML = card('', Calc.useMyRoll(read.areas, roll));
        } else {
          const type = form.querySelector('input[name="rollType"]:checked').value;
          const answers = Calc.recommend(read.areas, type);
          cards.className = 'calc-cards';
          cards.innerHTML = card('Fewest seams', answers.seams) +
            card('Least fabric left over', answers.leftover) +
            card('Fewest rolls', answers.rolls);
        }
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
