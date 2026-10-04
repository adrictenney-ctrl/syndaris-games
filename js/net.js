// Networking between the table and the phones.
//
// Messages go through public MQTT relays over secure WebSockets instead of a direct
// device-to-device link. Direct (WebRTC) links fail on many home routers and on
// cellular, and a relay works on any connection that can load a web page. The table is
// still the "server": it runs the game, and the relays only forward messages.
//
// Every device connects to two independent relays at once and sends each message through
// both, so the game keeps going if one relay is slow or down. Copies are dropped on arrival.
//
// Topics:  <PREFIX>/<ROOM>/host       phones → table
//          <PREFIX>/<ROOM>/p/<pid>    table → one phone
// Payloads are AES-GCM encrypted with a key derived from the room code (when the browser
// allows it), so other users of the public relays can't casually read anyone's hand.
/* global mqtt */

const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
const PREFIX = 'syndaris-table/v2';
const validPid = p => typeof p === 'string' && /^[\w-]{1,40}$/.test(p);
const rand = () => Math.random().toString(36).slice(2, 10);

// ---------------------------------------------------------------- scrambling

const keys = new Map();
function roomKey(room) {
  if (!globalThis.crypto?.subtle) return Promise.resolve(null); // plain http on a LAN address
  if (!keys.has(room)) {
    keys.set(room, crypto.subtle
      .digest('SHA-256', new TextEncoder().encode('syndaris-table:' + room))
      .then(raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']))
      .catch(() => null));
  }
  return keys.get(room);
}
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function pack(room, obj) {
  const text = JSON.stringify({ ...obj, _n: rand() });   // _n makes every message unique, for dropping copies
  const key = await roomKey(room);
  if (!key) return text;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return JSON.stringify({ iv: b64(iv), e: b64(data) });
}

async function unpack(room, payload) {
  try {
    const outer = JSON.parse(new TextDecoder().decode(payload));
    if (!outer || typeof outer.e !== 'string') return outer;
    const key = await roomKey(room);
    if (!key) return null;
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(outer.iv) }, key, unb64(outer.e));
    return JSON.parse(new TextDecoder().decode(data));
  } catch {
    return null;
  }
}

// The same message arrives once per relay; keep the first.
function deduper() {
  const seen = new Map();
  return payload => {
    const k = typeof payload === 'string' ? payload : new TextDecoder().decode(payload);
    const t = Date.now();
    if (seen.has(k)) return false;
    seen.set(k, t);
    if (seen.size > 400) for (const [key, at] of seen) { if (t - at > 20000) seen.delete(key); else break; }
    return true;
  };
}

function connectAll(idBase, extra = {}) {
  return BROKERS.map(url => mqtt.connect(url, {
    keepalive: 20, reconnectPeriod: 2000, connectTimeout: 30000, clean: true,
    clientId: idBase + '-' + rand(), ...extra,
  }));
}
const anyUp = clients => clients.some(c => c.connected && c._podReady);

// ---------------------------------------------------------------- table side

export function hostRoom(room, { onMessage, onLeave, onStatus }) {
  const seen = new Map(); // pid -> last message time
  const inbox = () => `${PREFIX}/${room}/host`;
  const fresh = deduper();
  const clients = connectAll('syn-host');
  globalThis.podRelays = clients; // handy when checking the connection from the console
  const status = () => onStatus(anyUp(clients) ? 'online' : 'reconnecting');

  onStatus('connecting');
  for (const client of clients) {
    client.on('connect', () => {
      client.subscribe(inbox(), { qos: 1 }, err => { client._podReady = !err; status(); });
    });
    client.on('reconnect', status);
    client.on('offline', () => { client._podReady = false; status(); });
    client.on('close', () => { client._podReady = false; status(); });
    client.on('error', () => {});
    client.on('message', async (topic, payload) => {
      if (topic !== inbox() || !fresh(payload)) return;
      const d = await unpack(room, payload);
      if (!d || !validPid(d.from) || !d.msg || typeof d.msg !== 'object') return;
      if (d.msg.t === 'bye') {
        // One relay lost the phone. If it's still talking through the other one, it's fine.
        const at = Date.now();
        setTimeout(() => { if ((seen.get(d.from) || 0) <= at && seen.delete(d.from)) onLeave(d.from); }, 6000);
        return;
      }
      seen.set(d.from, Date.now());
      onMessage(d.from, d.msg);
    });
  }

  return {
    async send(pid, msg) {
      if (!validPid(pid)) return;
      const up = clients.filter(c => c.connected);
      if (!up.length) return;
      const payload = await pack(room, msg);
      for (const c of up) c.publish(`${PREFIX}/${room}/p/${pid}`, payload, { qos: 1 });
    },
    clients: () => [...seen].filter(([, t]) => Date.now() - t < 30000).map(([p]) => p),
    rename(newRoom) {
      for (const c of clients) c.unsubscribe(inbox());
      room = newRoom;
      for (const c of clients) if (c.connected) c.subscribe(inbox());
    },
  };
}

// ---------------------------------------------------------------- phone side

export function joinRoom(room, { pid, onOpen, onMessage, onStatus }) {
  const hostTopic = `${PREFIX}/${room}/host`;
  const mine = `${PREFIX}/${room}/p/${pid}`;
  const fresh = deduper();
  let alive = false, lastMsg = 0, helloAt = 0, gotState = false;

  // Each relay sends this "bye" for us if the phone drops off without saying goodbye.
  const clients = globalThis.podRelays = connectAll('syn-' + pid, {
    will: { topic: hostTopic, payload: JSON.stringify({ from: pid, msg: { t: 'bye' } }), qos: 0, retain: false },
  });

  const hello = () => { helloAt = Date.now(); onOpen(); };
  let greeted = false;

  onStatus('connecting');
  for (const client of clients) {
    client.on('connect', () => {
      client.subscribe(mine, { qos: 1 }, err => {
        client._podReady = !err;
        if (err) { if (!anyUp(clients)) onStatus('offline'); return; }
        if (!alive) onStatus('connecting');
        // Say hello once per (re)connection, whichever relay comes up first.
        if (!greeted || !alive) { greeted = true; hello(); }
      });
    });
    client.on('reconnect', () => { if (!anyUp(clients)) { alive = false; gotState = false; onStatus('lost'); } });
    client.on('offline', () => { client._podReady = false; if (!anyUp(clients)) { alive = false; onStatus('offline'); } });
    client.on('error', () => {});
    client.on('message', async (topic, payload) => {
      if (topic !== mine || !fresh(payload)) return;
      const m = await unpack(room, payload);
      if (!m) return;
      lastMsg = Date.now();
      if (m.t === 'state') gotState = true;
      if (!alive) { alive = true; onStatus('online'); }
      onMessage(m);
    });
  }

  // Heartbeat, plus re-saying hello if the table hasn't answered (table not open yet,
  // table reloaded, or messages lost while the phone was asleep).
  setInterval(() => {
    if (!anyUp(clients)) return;
    send({ t: 'ping' });
    if (alive && Date.now() - lastMsg > 12000) { alive = false; onStatus('lost'); hello(); }
    else if (!alive && Date.now() - helloAt > 5000) { onStatus('no-table'); hello(); }
    // Connected, but the table's answer got lost on the way: ask again.
    else if (alive && !gotState && Date.now() - helloAt > 5000) hello();
  }, 4000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    for (const c of clients) if (!c.connected) c.reconnect();
    if (anyUp(clients)) hello();
  });

  async function send(msg) {
    const up = clients.filter(c => c.connected);
    if (!up.length) return false;
    const payload = await pack(room, { from: pid, msg });
    for (const c of up) c.publish(hostTopic, payload, { qos: 1 });
    return true;
  }

  return {
    send(msg) {
      if (!clients.some(c => c.connected)) return false;
      send(msg);
      return true;
    },
  };
}
