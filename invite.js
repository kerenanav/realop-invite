// RealOp invite page. Static, no cookies, no trackers.
// The invite code is read from the part of the link after "#", which browsers
// never send to the web server: it only goes to RealOp's own database.
(function () {
  'use strict';

  // Public values only (the publishable key is designed to be public; the
  // database only lets it call get_invitation_preview).
  var SUPABASE_URL = 'https://hhvwsbmstitdmioueugw.supabase.co';
  var PUBLISHABLE_KEY = 'sb_publishable_OIKiZhmw8oRcloMbF1kXtw_BY4R09tT';
  var APP_SCHEME = 'realop://invite/';
  var APP_STORE_URL = null; // set once RealOp is on the App Store / TestFlight

  var it = /^it\b/i.test(navigator.language || '');
  var T = it
    ? {
        loading: 'Caricamento dell’invito…',
        title: '{name} ti ha invitato su RealOp',
        tagline: 'L’opinione giusta, dalla persona giusta, adesso.',
        openApp: 'Apri in RealOp',
        openHint: 'Hai già RealOp? Tocca qui sopra.',
        newTitle: 'Nuovo su RealOp? 3 passaggi veloci',
        step1: 'Installa RealOp',
        step1Beta: 'RealOp è in test privato: chiedi a chi ti ha invitato come partecipare.',
        step1Store: 'Scaricalo dall’App Store.',
        step2: 'Registrati con la tua email',
        step2Note: 'Meno di un minuto, senza password.',
        step3: 'Tocca “Incolla invito” nell’app',
        step3Note: 'Prima copia il tuo invito:',
        copy: 'Copia invito',
        copied: 'Copiato! Ora apri RealOp e tocca “Incolla invito”.',
        expires: 'L’invito scade il {date} e si può usare una sola volta.',
        privacy: 'Questa pagina non usa cookie né tracciamento.',
        invalidTitle: 'Invito non valido',
        invalidBody: 'Questo link non funziona. Chiedi a chi te l’ha mandato un nuovo invito.',
        usedTitle: 'Invito già usato',
        usedBody: 'Ogni link si può usare una sola volta. Chiedi un nuovo invito.',
        expiredTitle: 'Invito scaduto',
        expiredBody: 'Gli inviti valgono 7 giorni. Chiedi un nuovo invito.',
        errorTitle: 'Impossibile caricare l’invito',
        errorBody: 'Controlla la connessione e ricarica la pagina.'
      }
    : {
        loading: 'Loading your invitation…',
        title: '{name} invited you to RealOp',
        tagline: 'The right opinion, from the right person, right now.',
        openApp: 'Open in RealOp',
        openHint: 'Already have RealOp? Tap above.',
        newTitle: 'New to RealOp? 3 quick steps',
        step1: 'Install RealOp',
        step1Beta: 'RealOp is in private testing: ask the person who invited you how to join.',
        step1Store: 'Get it on the App Store.',
        step2: 'Sign up with your email',
        step2Note: 'Under a minute, no password needed.',
        step3: 'Tap “Paste invite” in the app',
        step3Note: 'Copy your invite first:',
        copy: 'Copy invite',
        copied: 'Copied! Now open RealOp and tap “Paste invite”.',
        expires: 'This invite expires on {date} and can be used once.',
        privacy: 'This page does not use cookies or trackers.',
        invalidTitle: 'Invitation not valid',
        invalidBody: 'This link doesn’t work. Ask the person who sent it for a new invite.',
        usedTitle: 'Invitation already used',
        usedBody: 'Each link works only once. Ask for a new invite.',
        expiredTitle: 'Invitation expired',
        expiredBody: 'Invites last 7 days. Ask for a new invite.',
        errorTitle: 'Couldn’t load the invitation',
        errorBody: 'Check your connection and reload the page.'
      };

  document.documentElement.lang = it ? 'it' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (T[key]) el.textContent = T[key];
  });

  function $(id) { return document.getElementById(id); }
  function show(id) {
    ['loading', 'valid', 'problem'].forEach(function (s) { $(s).hidden = s !== id; });
  }
  function problem(kind) {
    $('problem-title').textContent = T[kind + 'Title'];
    $('problem-body').textContent = T[kind + 'Body'];
    show('problem');
  }

  // Same rules as the database: letters/digits only, last 10 characters.
  var raw = (location.hash.slice(1) || new URLSearchParams(location.search).get('c') || '');
  var code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-10);
  if (!/^[A-HJKMNP-Z2-9]{10}$/.test(code)) return problem('invalid');

  var pretty = code.slice(0, 5) + '-' + code.slice(5);
  $('code').textContent = pretty;
  $('open-app').href = APP_SCHEME + code;
  if (APP_STORE_URL) {
    var note = $('install-note');
    note.textContent = '';
    var link = document.createElement('a');
    link.href = APP_STORE_URL;
    link.textContent = T.step1Store;
    note.appendChild(link);
  }

  $('copy').addEventListener('click', function () {
    var text = 'RealOp ' + pretty;
    var done = function () { $('copied').hidden = false; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* user can copy by hand */ }
      document.body.removeChild(ta);
    }
  });

  fetch(SUPABASE_URL + '/rest/v1/rpc/get_invitation_preview', {
    method: 'POST',
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: 'Bearer ' + PUBLISHABLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_code: code })
  })
    .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(function (data) {
      if (!data || data.status === 'invalid') return problem('invalid');
      if (data.status === 'used') return problem('used');
      if (data.status === 'expired') return problem('expired');
      $('title').textContent = T.title.replace('{name}', data.inviter_name || 'A friend');
      if (data.expires_at) {
        var date = new Date(data.expires_at).toLocaleDateString(it ? 'it-IT' : 'en-GB', {
          day: 'numeric', month: 'long'
        });
        $('expires').textContent = T.expires.replace('{date}', date);
      }
      show('valid');
    })
    .catch(function () { problem('error'); });
})();
