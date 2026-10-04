(function () {
  // ---------- data ----------
  var INITIAL_BALANCE = 122546312;
  var GIFT_HEADLESS = { id: 201, name: 'Headless Horseman', price: 31000, image: 'assets/headless-horseman.png' };
  var GIFT_COMBO = { id: 192, name: 'Headless + Korblox', price: 48000, image: 'assets/korblox.png' };
  var FRIENDS = [
    { username: 'yannis4444', avatar: 'assets/avatar-yannis.png', mutual: 6, joined: 'Nov 9, 2021', last: '1 day ago', price: 31000, gift: 'Headless Horseman' },
    { username: 'Astrix_Gaming', avatar: 'assets/avatar-astrix.png', mutual: 4, joined: 'Jun 12, 2020', last: '2 hours ago', price: 31000, gift: 'Headless Horseman' },
    { username: '00milose735', avatar: 'assets/avatar-mushy.png', mutual: 8, joined: 'Jan 18, 2019', last: '3 hours ago', price: 31000, gift: 'Headless Horseman' },
    { username: 'fushyfj55', avatar: 'assets/avatar-fushy.png', mutual: 3, joined: 'May 8, 2022', last: '30 minutes ago', price: 31000, gift: 'Headless Horseman' },
    { username: 'Mateax2', avatar: 'assets/avatar-roblox.png', mutual: 5, joined: 'Apr 2, 2020', last: '4 hours ago', price: 31000, gift: 'Headless Horseman' }
  ];
  var YANNIS_SECOND = { username: 'yannis4444', avatar: 'assets/avatar-yannis.png', mutual: 2, joined: 'Mar 4, 2018', last: '1 hour ago', price: 48000, gift: 'Headless + Korblox' };
  var FRIENDS_COUNT = 182;

  var ICON_ROBUX = function (size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 16" class="robux" aria-hidden="true"><path fill="currentColor" d="M4.1 1.6h5.2L14.4 6.7v5.2L11.9 14.4H6.7L1.6 9.3V4.1L4.1 1.6zm1.2 2.2L3.8 5.3v5.4l1.5 1.5h5.4l1.5-1.5V5.3L10.7 3.8H5.3z"/></svg>';
  };
  var SVG = function (size, body) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };
  var ICON_GIFT = function (s) { return SVG(s, '<rect x="4" y="11" width="16" height="9" rx="1"/><path d="M4 11h16V8H4zM12 8v12"/><path d="M12 8c-2.2 0-4-1.2-4-2.6S10.2 4 12 8c1.8-4 4-2.8 4 .4S14.2 8 12 8z"/>'); };
  var ICON_CLOSE = function (s) { return SVG(s, '<path d="M6 6l12 12M18 6 6 18"/>'); };
  var ICON_BACK = function (s) { return SVG(s, '<path d="M15 5 8 12l7 7"/>'); };
  var ICON_SEARCH = function (s) { return SVG(s, '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.3-4.3"/>'); };

  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  // ---------- state ----------
  var state = {
    balance: INITIAL_BALANCE,
    owned: false,
    giftOpen: false,
    step: 'friends-search', // friends-search | friends-list | friend-profile | sent
    friend: null,
    query: '',
    giftsSent: 0,
    giftItem: GIFT_HEADLESS,
    picker: false,
    buyOpen: false
  };

  try {
    var saved = Number(localStorage.getItem('rbx-balance'));
    if (isFinite(saved) && saved > 0) state.balance = saved;
  } catch (e) {}
  function saveBalance() { try { localStorage.setItem('rbx-balance', String(state.balance)); } catch (e) {} }

  // ---------- elements ----------
  var overlay = document.getElementById('overlay');
  var giftModal = document.getElementById('giftModal');
  var buyHost = document.getElementById('buyHost');
  var buyBtn = document.getElementById('buyBtn');
  var giftBtn = document.getElementById('giftBtn');
  var topBal = document.getElementById('topBal');
  var loadTimer = null;

  function renderTopBar() {
    topBal.textContent = fmt(state.balance);
    buyBtn.textContent = state.owned ? 'Owned' : 'Buy';
  }

  function lockBody() {
    document.body.classList.toggle('modal-lock', state.giftOpen || state.buyOpen);
    overlay.classList.toggle('is-open', state.giftOpen || state.buyOpen);
  }

  // ---------- gift modal ----------
  function filteredFriends() {
    var q = state.query.trim().toLowerCase();
    return FRIENDS.filter(function (f) { return !q || f.username.toLowerCase().indexOf(q) !== -1; });
  }

  function friendsListHtml() {
    var list = filteredFriends();
    if (!list.length) return '<div class="loading-line">No friends found</div>';
    return list.map(function (f) {
      return '<button class="friend-row" data-friend="' + f.username + '"><img src="' + f.avatar + '" alt="">' + f.username + '</button>';
    }).join('');
  }

  function renderGift() {
    giftModal.classList.toggle('is-open', state.giftOpen);
    if (!state.giftOpen) return;
    var item = state.giftItem, step = state.step, f = state.friend;
    var title = step === 'friend-profile' && f ? f.username : 'Send gift';
    var head =
      '<div class="gift-head">' +
      (step === 'friend-profile'
        ? '<button class="x" id="gBack" aria-label="Back">' + ICON_BACK(16) + '</button>'
        : ICON_GIFT(15)) +
      '<span class="grow" id="gift-title">' + title + '</span>' +
      '<span class="bal">' + ICON_ROBUX(12) + fmt(state.balance) + '</span>' +
      '<button class="x" id="gClose" aria-label="Close">' + ICON_CLOSE(14) + '</button></div>';

    var body = '';
    if (step === 'friends-search' || step === 'friends-list') {
      body +=
        '<div class="gift-item"><img src="' + item.image + '" alt=""><div><div class="nm">' + item.name +
        '</div><div class="pr">' + ICON_ROBUX(12) + fmt(item.price) + '</div></div></div>' +
        '<button class="change-gift" id="gChange">Change gift</button>';
      if (state.picker) {
        body += '<div class="picker">' + [GIFT_HEADLESS, GIFT_COMBO].map(function (g) {
          return '<button data-gift="' + g.id + '" class="' + (item.id === g.id ? 'is-on' : '') + '"><img src="' + g.image + '" alt=""><span>' +
            g.name + '<small style="display:block;color:#6b6b6b">' + fmt(g.price) + '</small></span></button>';
        }).join('') + '</div>';
      }
      body +=
        '<p class="gift-label">Who would you like to gift this to?</p>' +
        '<div class="gift-search">' + ICON_SEARCH(13).replace('<svg ', '<svg class="search-ico" ') +
        '<input id="gSearch" value="' + state.query.replace(/"/g, '&quot;') + '" placeholder="Search" aria-label="Search friends"></div>';
      if (step === 'friends-search') {
        body += '<div class="loading-line"><span class="spinner"></span>Loading...</div>';
      } else {
        body += '<div class="friends-head">My friends (' + FRIENDS_COUNT + ')</div><div class="friends-list" id="gList">' + friendsListHtml() + '</div>';
      }
    } else if (step === 'friend-profile' && f) {
      body +=
        '<div class="profile-top"><img src="' + f.avatar + '" alt=""><div class="un">' + f.username + '</div></div>' +
        '<div class="stats">' +
        '<div class="stat"><div class="k">Mutual Friends</div><div class="v">' + f.mutual + '</div></div>' +
        '<div class="stat"><div class="k">Joined</div><div class="v">' + f.joined + '</div></div>' +
        '<div class="stat"><div class="k">Last active</div><div class="v">' + f.last + '</div></div></div>' +
        '<div class="confirm-gift"><img src="' + item.image + '" alt=""><div class="ask">Send this gift to ' + f.username +
        '?</div><div class="big">' + ICON_ROBUX(18) + fmt(f.price) + '</div></div>' +
        '<button class="cta cta-buy" id="gSend">Gift</button>';
    } else if (step === 'sent' && f) {
      body +=
        '<div class="sent-block"><img src="' + item.image + '" alt=""><h3>Gift sent</h3><div class="iname">' + f.gift +
        '</div><div class="pr">' + ICON_ROBUX(14) + fmt(f.price) + '</div><div class="to">To ' + f.username +
        '</div><button class="cta cta-buy" id="gAnother">Send another gift</button></div>';
    }

    // keep focus/caret in search box across re-renders
    var hadFocus = document.activeElement && document.activeElement.id === 'gSearch';
    giftModal.innerHTML = head + '<div class="gift-body">' + body + '</div>';
    if (hadFocus) {
      var inp = document.getElementById('gSearch');
      inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  }

  function openGift() {
    clearTimeout(loadTimer);
    state.giftOpen = true; state.step = 'friends-search'; state.friend = null; state.query = ''; state.picker = false;
    lockBody(); renderGift();
    loadTimer = setTimeout(function () {
      if (state.giftOpen && state.step === 'friends-search') { state.step = 'friends-list'; renderGift(); }
    }, 720);
  }
  function closeGift() {
    clearTimeout(loadTimer);
    state.giftOpen = false; state.step = 'friends-search'; state.friend = null; state.query = '';
    lockBody(); renderGift();
  }
  function selectFriend(username) {
    var f = FRIENDS.filter(function (x) { return x.username === username; })[0];
    if (!f) return;
    var next = f;
    if (state.giftsSent > 0 && f.username === 'yannis4444') next = YANNIS_SECOND;
    if (state.giftsSent > 0 && state.giftItem.id === GIFT_COMBO.id) {
      next = Object.assign({}, next, { price: state.giftItem.price, gift: state.giftItem.name });
    }
    state.friend = next; state.step = 'friend-profile'; renderGift();
  }
  function sendGift() {
    if (!state.friend) return;
    state.balance = Math.max(0, state.balance - state.friend.price);
    saveBalance();
    state.giftsSent += 1; state.step = 'sent';
    renderTopBar(); renderGift();
  }
  function sendAnother() {
    state.friend = null; state.query = ''; state.step = 'friends-list';
    state.giftItem = state.giftsSent >= 1 ? GIFT_COMBO : GIFT_HEADLESS;
    renderGift();
  }

  giftModal.addEventListener('click', function (e) {
    var t = e.target;
    var btn = t.closest ? t.closest('button') : null;
    if (!btn) return;
    if (btn.id === 'gClose') return closeGift();
    if (btn.id === 'gBack') { state.step = 'friends-list'; state.friend = null; return renderGift(); }
    if (btn.id === 'gChange') { state.picker = !state.picker; return renderGift(); }
    if (btn.id === 'gSend') return sendGift();
    if (btn.id === 'gAnother') return sendAnother();
    if (btn.dataset.friend) return selectFriend(btn.dataset.friend);
    if (btn.dataset.gift) {
      state.giftItem = Number(btn.dataset.gift) === GIFT_COMBO.id ? GIFT_COMBO : GIFT_HEADLESS;
      state.picker = false; return renderGift();
    }
  });
  giftModal.addEventListener('input', function (e) {
    if (e.target.id !== 'gSearch') return;
    state.query = e.target.value;
    var list = document.getElementById('gList');
    if (list) list.innerHTML = friendsListHtml(); // update only the list so typing isn't interrupted
  });

  // ---------- buy modal ----------
  function renderBuy() {
    if (!state.buyOpen) { buyHost.innerHTML = ''; return; }
    var item = GIFT_HEADLESS;
    buyHost.innerHTML =
      '<div class="buy-modal" role="dialog" aria-modal="true">' +
      '<h3>' + (state.owned ? 'Already owned' : 'Confirm purchase') + '</h3>' +
      '<p>' + (state.owned
        ? item.name + ' is already in your inventory.'
        : 'Buy ' + item.name + ' for ' + fmt(item.price) + ' Robux? This is a demo checkout \u2014 no real Robux are spent.') + '</p>' +
      '<div class="buy-actions"><button class="btn-ghost" id="bCancel">Cancel</button>' +
      '<button class="cta cta-buy" id="bOk" style="width:auto;padding:0 16px">' + (state.owned ? 'OK' : 'Buy Now') + '</button></div></div>';
  }
  function openBuy() { state.buyOpen = true; lockBody(); renderBuy(); }
  function closeBuy() { state.buyOpen = false; lockBody(); renderBuy(); }
  function confirmBuy() {
    if (!state.owned) {
      state.balance = Math.max(0, state.balance - GIFT_HEADLESS.price);
      state.owned = true; saveBalance();
    }
    renderTopBar(); closeBuy();
  }
  buyHost.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    if (btn.id === 'bCancel') closeBuy();
    if (btn.id === 'bOk') confirmBuy();
  });

  // ---------- wiring ----------
  buyBtn.addEventListener('click', openBuy);
  giftBtn.addEventListener('click', openGift);
  overlay.addEventListener('click', function () { if (state.giftOpen) closeGift(); if (state.buyOpen) closeBuy(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (state.giftOpen) closeGift();
    if (state.buyOpen) closeBuy();
  });

  // ---------- 3D drag-to-rotate ----------
  var turn = document.getElementById('turn');
  var angle = 0, down = false, lastX = 0;
  turn.addEventListener('pointerdown', function (e) { down = true; lastX = e.clientX; turn.setPointerCapture(e.pointerId); });
  turn.addEventListener('pointermove', function (e) {
    if (!down) return;
    angle += (e.clientX - lastX) * 0.45; lastX = e.clientX;
    turn.style.animation = 'none';
    turn.style.transform = 'rotateY(' + angle + 'deg)';
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) { turn.addEventListener(ev, function () { down = false; }); });

  renderTopBar();
})();
