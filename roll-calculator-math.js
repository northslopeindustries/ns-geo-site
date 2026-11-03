// ─── ROLL CALCULATOR: THE MATH ────────────────────────────────────────────
//
// This file only does arithmetic. It does not touch the page. The page
// (roll-calculator.js) hands it the areas and the chosen mode, and gets back
// plain answers to display.
//
// Every rule the calculator follows is one of the numbers in RULES or
// ROLL_SIZES just below. To change a rule, change the number there.
// All measurements are in feet (6 inches = 0.5 feet).

(function (root) {
  'use strict';

  const RULES = {
    END_FOLD: 0.25,           // 3" folded under at each cut end of a row (so a row is 6" longer than the area)
    SIDE_OVERLAP: 0.5,        // rows lying side by side overlap 6"
    JOIN_OVERLAP: 0.5,        // when a roll runs out mid-row, the next roll overlaps it 6" (a "join")
    MIN_USABLE_PIECE: 3,      // a leftover piece shorter than this is only used if it finishes the row
    STAPLE_SPACING: 3,        // one staple every 3 feet along area edges, side seams, and joins
    STAPLES_PER_BAG: 100,
    STAPLES_PER_CASE: 1000,
  };

  // Pro Guard 20 roll sizes: width × length, in feet.
  const ROLL_SIZES = [
    { width: 3,  length: 50,  type: 'retail' },
    { width: 3,  length: 100, type: 'retail' },
    { width: 4,  length: 50,  type: 'retail' },
    { width: 4,  length: 100, type: 'retail' },
    { width: 5,  length: 100, type: 'retail' },
    { width: 6,  length: 100, type: 'retail' },
    { width: 3,  length: 250, type: 'bulk' },
    { width: 4,  length: 250, type: 'bulk' },
    { width: 5,  length: 250, type: 'bulk' },
    { width: 6,  length: 250, type: 'bulk' },
    { width: 8,  length: 250, type: 'bulk' },
    { width: 12, length: 250, type: 'bulk' },
  ];

  // How thorough the Recommend search is. Higher numbers check more
  // combinations but are slower on a phone.
  const SEARCH = {
    ROW_LIMIT: 40,          // plans kept after each row is laid
    KEEP_PER_LAYOUT: 4,     // plans kept for each way of laying an area, before moving to the next area
    AREA_LIMIT: 80,         // most plans carried from one area to the next
  };

  const EPS = 1e-9;
  const WIDTHS = Array.from(new Set(ROLL_SIZES.map(r => r.width))).sort((a, b) => a - b);

  // ─── Rows needed ───────────────────────────────────────────────────────
  // How far `count` side-by-side rows of one width reach across the area.
  function reach(width, count) {
    return count === 0 ? 0 : width + (count - 1) * (width - RULES.SIDE_OVERLAP);
  }

  // Fewest rows of one width that reach across `span` feet.
  function rowsNeeded(width, span) {
    if (width >= span - EPS) return 1;
    return 1 + Math.ceil((span - width) / (width - RULES.SIDE_OVERLAP) - EPS);
  }

  // ─── A plan in progress ────────────────────────────────────────────────
  // Indexes below are positions in WIDTHS (fabric width) or ROLL_SIZES (roll).
  //   open:  feet left on the roll currently in use, per fabric width (0 = none)
  //   scrap: feet thrown away (pieces under 3 feet that could not finish a row), per width
  //   rolls: how many of each roll size have been bought
  //   hist:  the layout chosen for each area so far
  function emptyState() {
    return {
      open: WIDTHS.map(() => 0), scrap: WIDTHS.map(() => 0), rolls: ROLL_SIZES.map(() => 0),
      rollCount: 0, seams: 0, joinCount: 0, joinFeet: 0, hist: null,
    };
  }

  function cloneState(s) {
    return {
      open: s.open.slice(), scrap: s.scrap.slice(), rolls: s.rolls.slice(),
      rollCount: s.rollCount, seams: s.seams, joinCount: s.joinCount, joinFeet: s.joinFeet, hist: s.hist,
    };
  }

  function leftoverSqFt(s) {
    let total = 0;
    for (let i = 0; i < WIDTHS.length; i++) total += (s.open[i] + s.scrap[i]) * WIDTHS[i];
    return total;
  }

  // Two plans with the same key face exactly the same future.
  function stateKey(s) {
    return s.open.map(x => Math.round(x * 1000)).join(',');
  }

  // ─── Laying one row ────────────────────────────────────────────────────
  // Every possible result of laying one row of fabric width WIDTHS[wi] that
  // needs `need` feet. `rollChoices` lists the roll sizes of that width that
  // may be bought, longest first.
  function layRow(state, wi, need, rollChoices, out) {
    const width = WIDTHS[wi];
    const s = cloneState(state);
    let remaining = need;
    let started = false;

    const piece = s.open[wi];
    if (piece > 0) {
      s.open[wi] = 0;
      if (piece >= remaining - EPS) {
        // The leftover piece covers the whole row.
        s.open[wi] = Math.max(0, piece - remaining);
        out.push(s);
        return;
      }
      if (piece >= RULES.MIN_USABLE_PIECE - EPS) {
        // Long enough to start the row; a new roll finishes it.
        remaining -= piece;
        started = true;
      } else {
        // Too short to use: scrap.
        s.scrap[wi] += piece;
      }
    }

    // Try each roll length for the roll that finishes this row. A roll that
    // gets used up completely partway along the row is always the longest
    // size, since a shorter one would only mean more rolls and more joins.
    function buy(st, rem, isStarted) {
      rollChoices.forEach((ri, i) => {
        const len = ROLL_SIZES[ri].length;
        const done = len >= rem + (isStarted ? RULES.JOIN_OVERLAP : 0) - EPS;
        if (!done && i > 0) return;
        const n = cloneState(st);
        let r = rem;
        if (isStarted) {
          r += RULES.JOIN_OVERLAP;
          n.seams += 1; n.joinCount += 1; n.joinFeet += width;
        }
        n.rolls[ri] += 1;
        n.rollCount += 1;
        if (done) {
          n.open[wi] = Math.max(0, len - r);
          out.push(n);
        } else {
          buy(n, r - len, true);
        }
      });
    }
    buy(s, remaining, started);
  }

  // ─── Comparing plans ───────────────────────────────────────────────────
  // Each goal, with its tie-breakers in order.
  const GOALS = {
    seams:    ['seams', 'leftover', 'rolls'],
    leftover: ['leftover', 'rolls', 'seams'],
    rolls:    ['rolls', 'seams', 'leftover'],
  };

  function scrapSqFt(s) {
    let total = 0;
    for (let i = 0; i < WIDTHS.length; i++) total += s.scrap[i] * WIDTHS[i];
    return total;
  }

  // `final` is true once every area is laid. Before that, for the
  // least-left-over goal, scrap (pieces too short to use) counts first,
  // because fabric still on an open roll may yet be used by a later row.
  function scoreOf(s, goal, final) {
    const score = GOALS[goal].map(g => g === 'seams' ? s.seams : g === 'rolls' ? s.rollCount : leftoverSqFt(s));
    if (!final && goal === 'leftover') score.unshift(scrapSqFt(s));
    return score;
  }

  function compareScores(a, b) {
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > 1e-6) return a[i] - b[i];
    }
    return 0;
  }

  // Keep one plan per key (the best), then the best `limit` overall.
  function prune(states, goal, limit, final) {
    const best = new Map();
    states.forEach(s => {
      s.score = scoreOf(s, goal, final);
      const k = stateKey(s);
      const cur = best.get(k);
      if (!cur || compareScores(s.score, cur.score) < 0) best.set(k, s);
    });
    const list = Array.from(best.values()).sort((a, b) => compareScores(a.score, b.score));
    return list.slice(0, limit);
  }

  // Lay `count` more rows of width WIDTHS[wi] onto every plan in `states`.
  function layRows(states, wi, count, need, rollsByWidth, goal) {
    let current = states;
    for (let i = 0; i < count; i++) {
      const out = [];
      current.forEach(s => layRow(s, wi, need, rollsByWidth[wi], out));
      current = prune(out, goal, SEARCH.ROW_LIMIT, false);
    }
    return current;
  }

  function finishArea(states, areaIndex, along, rows, out) {
    const group = [];
    states.forEach(st => {
      const s = cloneState(st);
      s.seams += rows.length - 1;                       // side seams between rows
      s.hist = { prev: st.hist, areaIndex: areaIndex, along: along, rows: rows };
      group.push(s);
    });
    out.push(group);
  }

  // ─── Planning a whole job ──────────────────────────────────────────────
  // areas:    [{ length, width }, ...] in feet
  // allowed:  indexes into ROLL_SIZES that may be bought
  // goal:     'seams', 'leftover', or 'rolls'
  // allowMix: whether an area may add one row of a second fabric width
  //
  // Each area is tried with its rows running both directions. For each
  // direction, each fabric width is tried on its own, and (if allowMix) with
  // its last row swapped for a different width that still reaches across.
  function plan(areas, allowed, goal, allowMix) {
    const rollsByWidth = WIDTHS.map(w => allowed
      .filter(ri => ROLL_SIZES[ri].width === w)
      .sort((a, b) => ROLL_SIZES[b].length - ROLL_SIZES[a].length));
    const usable = WIDTHS.map((w, i) => i).filter(i => rollsByWidth[i].length > 0);

    let states = [emptyState()];

    areas.forEach((area, areaIndex) => {
      const next = [];
      [
        { along: 'length', rowLength: area.length, span: area.width },
        { along: 'width', rowLength: area.width, span: area.length },
      ].forEach(dir => {
        const need = dir.rowLength + 2 * RULES.END_FOLD;
        usable.forEach(wi => {
          const w = WIDTHS[wi];
          const n = rowsNeeded(w, dir.span);
          // Lay the main rows one at a time, and at each point where a single
          // row of another width would finish the area, try that too.
          let current = states;
          for (let m = 0; m < n; m++) {
            if (allowMix && m > 0) {
              usable.forEach(oi => {
                if (oi === wi) return;
                if (reach(w, m) + WIDTHS[oi] - RULES.SIDE_OVERLAP < dir.span - EPS) return;
                const done = layRows(current, oi, 1, need, rollsByWidth, goal);
                finishArea(done, areaIndex, dir.along, Array(m).fill(w).concat([WIDTHS[oi]]), next);
              });
            }
            current = layRows(current, wi, 1, need, rollsByWidth, goal);
          }
          finishArea(current, areaIndex, dir.along, Array(n).fill(w), next);
        });
      });
      // Keep the best few plans for each way this area could be laid, so one
      // layout cannot crowd out the others before the next area is tried.
      if (areaIndex === areas.length - 1) {
        states = prune([].concat.apply([], next), goal, 1, true);
      } else {
        states = [].concat.apply([], next.map(group => prune(group, goal, SEARCH.KEEP_PER_LAYOUT, false)));
        states = prune(states, goal, SEARCH.AREA_LIMIT, false);
      }
    });

    return summarize(states[0], areas);
  }

  // ─── Staples ───────────────────────────────────────────────────────────
  // Under 1,000 staples: bags. 1,000 or more: cases, plus bags for the rest.
  function staplePackaging(count) {
    if (count < RULES.STAPLES_PER_CASE) {
      return { cases: 0, bags: Math.ceil(count / RULES.STAPLES_PER_BAG) };
    }
    let cases = Math.floor(count / RULES.STAPLES_PER_CASE);
    let bags = Math.ceil((count - cases * RULES.STAPLES_PER_CASE) / RULES.STAPLES_PER_BAG);
    if (bags * RULES.STAPLES_PER_BAG >= RULES.STAPLES_PER_CASE) { cases += 1; bags = 0; }
    return { cases: cases, bags: bags };
  }

  // ─── Turning a finished plan into an answer ────────────────────────────
  function summarize(s, areas) {
    const chosen = [];
    for (let h = s.hist; h; h = h.prev) chosen.unshift(h);

    // Staples go along every area edge, every side seam, and across every join.
    let stapleFeet = s.joinFeet;
    const areaPlans = chosen.map(h => {
      const area = areas[h.areaIndex];
      const rowLength = h.along === 'length' ? area.length : area.width;
      stapleFeet += 2 * (area.length + area.width);
      stapleFeet += (h.rows.length - 1) * rowLength;
      return {
        length: area.length,
        width: area.width,
        along: h.along,                             // rows run along the area's 'length' or 'width'
        rowLength: rowLength,                       // the side the rows run along
        cutLength: rowLength + 2 * RULES.END_FOLD,  // how long each row is cut
        rows: h.rows,                               // fabric width of each row, in laying order
      };
    });
    const staples = Math.ceil(stapleFeet / RULES.STAPLE_SPACING - EPS);

    const leftover = [];
    for (let i = WIDTHS.length - 1; i >= 0; i--) {
      const feet = round(s.open[i] + s.scrap[i]);
      if (feet > 0) leftover.push({ width: WIDTHS[i], feet: feet, sqft: round(feet * WIDTHS[i]) });
    }

    const rolls = [];
    ROLL_SIZES.forEach((r, i) => {
      if (s.rolls[i]) rolls.push({ width: r.width, length: r.length, type: r.type, count: s.rolls[i] });
    });

    return {
      rolls: rolls,
      rollCount: s.rollCount,
      seams: s.seams,
      joins: s.joinCount,
      leftover: leftover,
      leftoverFeet: round(leftover.reduce((t, l) => t + l.feet, 0)),
      leftoverSqFt: round(leftover.reduce((t, l) => t + l.sqft, 0)),
      areas: areaPlans,
      staples: staples,
      staplePackaging: staplePackaging(staples),
    };
  }

  function round(x) { return Math.round(x * 100) / 100; }

  // ─── What the page calls ───────────────────────────────────────────────

  // "Use my roll size": one roll size (an entry of ROLL_SIZES).
  // Picks fewest rolls, then fewest seams, then least left over.
  function useMyRoll(areas, roll) {
    return plan(areas, [ROLL_SIZES.indexOf(roll)], 'rolls', false);
  }

  // "Recommend rolls for me": rollType is 'bulk', 'retail', or 'mix'.
  // Returns the three answers.
  function recommend(areas, rollType) {
    const allowed = ROLL_SIZES.map((r, i) => i).filter(i => rollType === 'mix' || ROLL_SIZES[i].type === rollType);
    return {
      seams: plan(areas, allowed, 'seams', true),
      leftover: plan(areas, allowed, 'leftover', true),
      rolls: plan(areas, allowed, 'rolls', true),
    };
  }

  const api = { RULES: RULES, ROLL_SIZES: ROLL_SIZES, SEARCH: SEARCH, useMyRoll: useMyRoll, recommend: recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RollCalculator = api;
})(this);
