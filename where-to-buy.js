// Where to Buy page only: the store list, the state buttons and the store cards.
//
// ═══════════════════════════════════════════════════════════════════════
//  STORE LIST: add, edit or remove stores here, and nowhere else.
// ═══════════════════════════════════════════════════════════════════════
//  One { ... } block per store, separated by commas. For each store:
//    name      the store's name
//    address   street address
//    city, zip city and ZIP code
//    state     one of: Utah, Colorado, Idaho, Nevada, Arizona, Wyoming, Montana
//    phone     phone number, written the way it should appear on the page
//    website   full web address starting with https://, or '' if none
//              (the website line only shows when there is one)
//    products  any of: 'Pro Guard 20', 'Nonwoven Filter Fabric', 'Sod Staples'
//  A state button only appears when at least one store is in that state.
//
//  The two stores below are MADE-UP SAMPLES to show the design. Replace
//  them with real stores before this page goes live.
// ═══════════════════════════════════════════════════════════════════════
var STORES = [
  {
    name: 'Sample Store 1',
    address: '123 Sample Street',
    city: 'Sampleville',
    state: 'Utah',
    zip: '84000',
    phone: '(555) 010-0001',
    website: 'https://www.example.com',
    products: ['Pro Guard 20', 'Nonwoven Filter Fabric', 'Sod Staples']
  },
  {
    name: 'Sample Store 2',
    address: '456 Example Avenue',
    city: 'Testburg',
    state: 'Idaho',
    zip: '83000',
    phone: '(555) 010-0002',
    website: '',
    products: ['Pro Guard 20', 'Sod Staples']
  }
];
// ═══════════════════════════ END OF STORE LIST ═══════════════════════════


// Everything below draws the page from the list above; it should not need
// changing to add or remove a store.
//
// This file loads before script.js, so the cards already exist when
// script.js sets up the scroll animations (fade-up). Filtering only hides
// and shows cards; it never redraws them.
(function () {
  var STATE_ORDER = ['Utah', 'Colorado', 'Idaho', 'Nevada', 'Arizona', 'Wyoming', 'Montana'];
  var STATE_ABBR = { Utah: 'UT', Colorado: 'CO', Idaho: 'ID', Nevada: 'NV', Arizona: 'AZ', Wyoming: 'WY', Montana: 'MT' };
  var ICONS = {
    pin: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    web: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'
  };

  var filtersBox = document.getElementById('where-filters');
  var grid = document.getElementById('where-stores');
  if (!filtersBox || !grid) return;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function icon(name) {
    var s = document.createElement('span');
    s.className = 'where-icon';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + ICONS[name] + '</svg>';
    return s;
  }
  function smallButton(text, href, label, newTab) {
    var a = el('a', 'faq-contact-btn', text);
    a.href = href;
    a.setAttribute('aria-label', label);
    if (newTab) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  // Store cards
  var cards = STORES.map(function (store, i) {
    var card = el('article', 'where-card fade-up fade-up-delay-' + ((i % 3) + 1));
    card.setAttribute('data-state', store.state);
    card.appendChild(el('h3', 'where-name', store.name));

    var cityLine = store.city + ', ' + (STATE_ABBR[store.state] || store.state) + ' ' + store.zip;
    var addrRow = el('div', 'where-row');
    addrRow.appendChild(icon('pin'));
    var addrBody = el('div', 'where-row-body');
    var addr = el('address', 'where-value');
    addr.appendChild(document.createTextNode(store.address));
    addr.appendChild(document.createElement('br'));
    addr.appendChild(document.createTextNode(cityLine));
    addrBody.appendChild(addr);
    var mapsQuery = encodeURIComponent(store.name + ', ' + store.address + ', ' + cityLine);
    addrBody.appendChild(smallButton('Get Directions', 'https://www.google.com/maps/search/?api=1&query=' + mapsQuery,
      'Get directions to ' + store.name + ' in Google Maps (opens in a new tab)', true));
    addrRow.appendChild(addrBody);
    card.appendChild(addrRow);

    var phoneRow = el('div', 'where-row');
    phoneRow.appendChild(icon('phone'));
    var phoneBody = el('div', 'where-row-body where-row-inline');
    phoneBody.appendChild(el('span', 'where-value where-phone', store.phone));
    phoneBody.appendChild(smallButton('Call', 'tel:' + store.phone.replace(/[^0-9+]/g, ''), 'Call ' + store.name + ' at ' + store.phone));
    phoneRow.appendChild(phoneBody);
    card.appendChild(phoneRow);

    if (store.website) {
      var webRow = el('div', 'where-row');
      webRow.appendChild(icon('web'));
      var link = el('a', 'where-value where-website', store.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''));
      link.href = store.website;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', store.name + ' website (opens in a new tab)');
      webRow.appendChild(link);
      card.appendChild(webRow);
    }

    if (store.products && store.products.length) {
      var tags = el('ul', 'where-tags');
      tags.setAttribute('aria-label', 'Products carried');
      store.products.forEach(function (p) { tags.appendChild(el('li', 'product-tag', p)); });
      card.appendChild(tags);
    }
    grid.appendChild(card);
    return card;
  });

  // State buttons: "All" plus only the states that have a store.
  var states = STATE_ORDER.filter(function (s) {
    return STORES.some(function (store) { return store.state === s; });
  });
  if (!STORES.length) { filtersBox.hidden = true; return; }
  ['All'].concat(states).forEach(function (s) {
    var label = el('label', 'calc-choice');
    var input = document.createElement('input');
    input.type = 'radio';
    input.name = 'where-state';
    input.value = s;
    if (s === 'All') input.checked = true;
    input.addEventListener('change', function () {
      cards.forEach(function (card) {
        card.hidden = !(s === 'All' || card.getAttribute('data-state') === s);
      });
    });
    label.appendChild(input);
    label.appendChild(el('span', null, s));
    filtersBox.appendChild(label);
  });
})();
