// Peer-to-peer networking via PeerJS (WebRTC). The table device *is* the server:
// it registers a room id, phones connect straight to it. Game traffic flows device
// to device; the PeerJS cloud is only used to introduce them (needs internet once).
/* global Peer */

const PREFIX = 'syndaris-table-v1-';
const CONN_OPTS = { reliable: true, serialization: 'json' };

export function hostRoom(room, { onMessage, onLeave, onStatus, onIdTaken }) {
  let peer = null;
  const conns = new Map(); // playerId -> DataConnection

  function open() {
    peer = new Peer(PREFIX + room);
    onStatus('connecting');
    peer.on('open', () => onStatus('online'));
    peer.on('connection', conn => {
      conn.on('data', msg => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.t === 'hello' && typeof msg.id === 'string') {
          const old = conns.get(msg.id);
          if (old && old !== conn) old.close();
          conn._pid = msg.id;
          conns.set(msg.id, conn);
        }
        if (conn._pid) onMessage(conn._pid, msg);
      });
      conn.on('close', () => {
        if (conn._pid && conns.get(conn._pid) === conn) {
          conns.delete(conn._pid);
          onLeave(conn._pid);
        }
      });
      conn.on('error', () => {});
    });
    peer.on('disconnected', () => {
      onStatus('reconnecting');
      setTimeout(() => { if (!peer.destroyed && peer.disconnected) peer.reconnect(); }, 2000);
    });
    peer.on('error', err => {
      if (err.type === 'unavailable-id') {
        // Usually our own previous page load still holding the id for a moment.
        onStatus('waiting');
        peer.destroy();
        if (onIdTaken && onIdTaken()) return;
        setTimeout(open, 3000);
      } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
        onStatus('reconnecting');
        setTimeout(() => {
          if (peer.destroyed) open();
          else if (peer.disconnected) peer.reconnect();
        }, 3000);
      }
    });
  }
  open();

  return {
    send(pid, msg) {
      const c = conns.get(pid);
      if (c && c.open) c.send(msg);
    },
    clients: () => [...conns.keys()],
    rename(newRoom) {
      room = newRoom;
      if (peer && !peer.destroyed) peer.destroy();
      open();
    },
  };
}

export function joinRoom(room, { onOpen, onMessage, onStatus }) {
  let peer = null, conn = null, alive = false, lastMsg = 0, retry = null, openTimer = null;

  function startPeer() {
    if (peer && !peer.destroyed) peer.destroy();
    peer = new Peer();
    peer.on('open', connect);
    peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => peer.disconnected && !peer.destroyed && peer.reconnect(), 1500); });
    peer.on('error', err => {
      if (err.type === 'peer-unavailable') { onStatus('no-table'); schedule(connect, 3000); }
      else { onStatus('offline'); schedule(startPeer, 3000); }
    });
  }

  function schedule(fn, ms) {
    clearTimeout(retry);
    retry = setTimeout(fn, ms);
  }

  function connect() {
    if (!peer || peer.destroyed || peer.disconnected) return startPeer();
    if (conn) { try { conn.close(); } catch {} }
    onStatus('connecting');
    const c = conn = peer.connect(PREFIX + room, CONN_OPTS);
    clearTimeout(openTimer);
    openTimer = setTimeout(() => { if (c === conn && !c.open) connect(); }, 10000);
    c.on('open', () => {
      if (c !== conn) return;
      clearTimeout(openTimer);
      alive = true;
      lastMsg = Date.now();
      onStatus('online');
      onOpen();
    });
    c.on('data', m => { if (c === conn) { lastMsg = Date.now(); onMessage(m); } });
    c.on('close', () => {
      if (c !== conn) return;
      alive = false;
      onStatus('lost');
      schedule(connect, 1500);
    });
  }

  // Heartbeat: phones going to sleep often drop the link without a clean close.
  setInterval(() => {
    if (!alive) return;
    try { conn.send({ t: 'ping' }); } catch {}
    if (Date.now() - lastMsg > 12000) { alive = false; onStatus('lost'); connect(); }
  }, 4000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!alive || Date.now() - lastMsg > 6000)) connect();
  });

  startPeer();

  return {
    send(msg) {
      if (conn && conn.open) { conn.send(msg); return true; }
      return false;
    },
  };
}
