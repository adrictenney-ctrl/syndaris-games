// Networking between the table and the phones.
//
// Messages go through a public MQTT relay over secure WebSockets instead of a direct
// device-to-device link. Direct (WebRTC) links fail on many home routers and on
// cellular, and a relay works on any connection that can load a web page. The table is
// still the "server": it runs the game, and the relay only forwards messages.
//
// Topics:  <PREFIX>/<ROOM>/host       phones → table
//          <PREFIX>/<ROOM>/p/<pid>    table → one phone
// Payloads are AES-GCM encrypted with a key derived from the room code (when the browser
// allows it), so other users of the public relay can't casually read anyone's hand.
/* global mqtt */

const BROKER = 'wss://broker.emqx.io:8084/mqtt';
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
  const text = JSON.stringify(obj);
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

function connect(opts) {
  return mqtt.connect(BROKER, { keepalive: 20, reconnectPeriod: 2000, connectTimeout: 10000, clean: true, ...opts });
}

// ---------------------------------------------------------------- table side

export function hostRoom(room, { onMessage, onLeave, onStatus }) {
  const seen = new Map(); // pid -> last message time
  const inbox = () => `${PREFIX}/${room}/host`;
  const client = connect({ clientId: 'syn-host-' + rand() });

  onStatus('connecting');
  client.on('connect', () => {
    client.subscribe(inbox(), err => onStatus(err ? 'reconnecting' : 'online'));
  });
  client.on('reconnect', () => onStatus('reconnecting'));
  client.on('offline', () => onStatus('reconnecting'));
  client.on('error', () => {});
  client.on('message', async (topic, payload) => {
    if (topic !== inbox()) return;
    const d = await unpack(room, payload);
    if (!d || !validPid(d.from) || !d.msg || typeof d.msg !== 'object') return;
    if (d.msg.t === 'bye') {
      if (seen.delete(d.from)) onLeave(d.from);
      return;
    }
    seen.set(d.from, Date.now());
    onMessage(d.from, d.msg);
  });

  return {
    async send(pid, msg) {
      if (!client.connected || !validPid(pid)) return;
      client.publish(`${PREFIX}/${room}/p/${pid}`, await pack(room, msg));
    },
    clients: () => [...seen].filter(([, t]) => Date.now() - t < 30000).map(([p]) => p),
    rename(newRoom) {
      client.unsubscribe(inbox());
      room = newRoom;
      if (client.connected) client.subscribe(inbox());
    },
  };
}

// ---------------------------------------------------------------- phone side

export function joinRoom(room, { pid, onOpen, onMessage, onStatus }) {
  const hostTopic = `${PREFIX}/${room}/host`;
  const mine = `${PREFIX}/${room}/p/${pid}`;
  let alive = false, lastMsg = 0, helloAt = 0;

  // The relay sends this "bye" for us if the phone drops off without saying goodbye.
  const client = connect({
    clientId: 'syn-' + pid + '-' + rand(),
    will: { topic: hostTopic, payload: JSON.stringify({ from: pid, msg: { t: 'bye' } }), qos: 0, retain: false },
  });

  const hello = () => { helloAt = Date.now(); onOpen(); };

  onStatus('connecting');
  client.on('connect', () => {
    client.subscribe(mine, err => {
      if (err) return onStatus('offline');
      onStatus('connecting');
      hello();
    });
  });
  client.on('reconnect', () => { alive = false; onStatus('lost'); });
  client.on('offline', () => { alive = false; onStatus('offline'); });
  client.on('error', () => {});
  client.on('message', async (topic, payload) => {
    if (topic !== mine) return;
    const m = await unpack(room, payload);
    if (!m) return;
    lastMsg = Date.now();
    if (!alive) { alive = true; onStatus('online'); }
    onMessage(m);
  });

  // Heartbeat, plus re-saying hello if the table hasn't answered (table not open yet,
  // table reloaded, or messages lost while the phone was asleep).
  setInterval(() => {
    if (!client.connected) return;
    send({ t: 'ping' });
    if (alive && Date.now() - lastMsg > 12000) { alive = false; onStatus('lost'); hello(); }
    else if (!alive && Date.now() - helloAt > 5000) { onStatus('no-table'); hello(); }
  }, 4000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!client.connected) client.reconnect();
    else hello();
  });

  async function send(msg) {
    if (!client.connected) return false;
    client.publish(hostTopic, await pack(room, { from: pid, msg }));
    return true;
  }

  return {
    send(msg) {
      if (!client.connected) return false;
      send(msg);
      return true;
    },
  };
}
