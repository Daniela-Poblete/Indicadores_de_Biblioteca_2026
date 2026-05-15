// js/sync.js — Firebase Realtime Database sync layer
// Exporta a window.DuocSync con la misma interfaz que DuocData pero persistente en la nube.
window.DuocSync = (function () {
  'use strict';

  const cfg       = window.DUOC_FIREBASE_CONFIG || {};
  const DB_PATH   = 'data/bibliotecas';
  const isConfigured = !!(cfg.databaseURL && cfg.databaseURL.length > 4);

  let _db        = null;   // Firebase Database instance
  let _listeners = [];     // cleanup functions
  let _status    = isConfigured ? 'connecting' : 'local'; // 'local'|'connecting'|'online'|'error'
  let _statusCbs = [];

  function onStatus(cb) { _statusCbs.push(cb); cb(_status); }
  function setStatus(s) { _status = s; _statusCbs.forEach(cb => cb(s)); }

  // ── Init Firebase ───────────────────────────────────────────────────────────

  function init() {
    if (!isConfigured) { setStatus('local'); return Promise.resolve(false); }
    if (_db)           { return Promise.resolve(true); }

    return new Promise((resolve) => {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
        _db = firebase.database();
        setStatus('connecting');

        // connectivity detection
        _db.ref('.info/connected').on('value', snap => {
          setStatus(snap.val() ? 'online' : 'connecting');
        });

        resolve(true);
      } catch (e) {
        console.warn('[DuocSync] Firebase init failed:', e.message);
        setStatus('error');
        resolve(false);
      }
    });
  }

  // ── Read ────────────────────────────────────────────────────────────────────

  function loadRemote() {
    if (!_db) return Promise.resolve(null);
    return _db.ref(DB_PATH).once('value')
      .then(snap => snap.val())
      .catch(e => { console.warn('[DuocSync] read error:', e.message); return null; });
  }

  // ── Write ───────────────────────────────────────────────────────────────────

  function saveRemote(data) {
    if (!_db) return Promise.resolve(false);
    return _db.ref(DB_PATH).set(data)
      .then(() => true)
      .catch(e => { console.warn('[DuocSync] write error:', e.message); return false; });
  }

  // ── Real-time listener ──────────────────────────────────────────────────────
  // cb(data) called whenever remote data changes

  function subscribe(cb) {
    if (!_db) return () => {};
    const ref = _db.ref(DB_PATH);
    const handler = snap => { const v = snap.val(); if (v) cb(v); };
    ref.on('value', handler);
    const unsub = () => ref.off('value', handler);
    _listeners.push(unsub);
    return unsub;
  }

  // ── Load with fallback ──────────────────────────────────────────────────────
  // Returns {data, source:'remote'|'local'}

  async function loadData() {
    await init();

    if (!isConfigured || !_db) {
      const local = window.DuocData.loadData();
      return { data: local, source: 'local' };
    }

    const remote = await loadRemote();
    if (remote) {
      // Cache locally for offline
      window.DuocData.saveData(remote);
      return { data: remote, source: 'remote' };
    }

    // Remote empty or error → use local sample
    const local = window.DuocData.loadData();
    return { data: local, source: 'local' };
  }

  // ── Save with fallback ──────────────────────────────────────────────────────

  async function saveData(data) {
    // Always save locally
    window.DuocData.saveData(data);
    if (!isConfigured || !_db) return { saved: true, remote: false };
    const ok = await saveRemote(data);
    return { saved: true, remote: ok };
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  async function resetData() {
    const fresh = window.DuocData.resetData();
    if (isConfigured && _db) await saveRemote(fresh);
    return fresh;
  }

  return { isConfigured, init, loadData, saveData, resetData, subscribe, onStatus, getStatus: () => _status };
})();
