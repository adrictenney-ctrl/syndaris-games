// A player's phone: joining, picking a seat, then the game's own phone UI.
import { GAMES } from './games.js?v=68';
import { keepAwake } from './cards.js?v=68';
import { joinRoom } from './net.js?v=68';
import { $, toast, setStatus, renderHand, resetHand } from './phone-kit.js?v=68';
import * as euchreUI from './play-euchre.js?v=68';
import * as pokerUI from './play-poker.js?v=68';
import * as vetoUI from './play-veto.js?v=68';
import * as gofishUI from './play-gofish.js?v=68';
import * as chessUI from './play-chess.js?v=68';
import * as backgammonUI from './play-backgammon.js?v=68';
import * as sketchUI from './play-sketch.js?v=68';
import * as chefskissUI from './play-chefskiss.js?v=68';
import * as insidejobUI from './play-insidejob.js?v=68';
import * as crownUI from './play-crown.js?v=68';
import * as hollowUI from './play-hollow.js?v=68';
import * as blackjackUI from './play-blackjack.js?v=68';
import * as baccaratUI from './play-baccarat.js?v=68';
import * as checkersUI from './play-checkers.js?v=68';
import * as yachtUI from './play-yacht.js?v=68';
import * as spoonsUI from './play-spoons.js?v=68';
import * as doubtUI from './play-doubt.js?v=68';
import * as cashoutUI from './play-cashout.js?v=68';
import * as crazy8UI from './play-crazy8.js?v=68';
import * as skylineUI from './play-skyline.js?v=68';
import * as lowtideUI from './play-lowtide.js?v=68';
import * as trioUI from './play-trio.js?v=68';
import * as fourupUI from './play-fourup.js?v=68';
import * as seedstonesUI from './play-seedstones.js?v=68';
import * as sonarUI from './play-sonar.js?v=68';
import * as milestonesUI from './play-milestones.js?v=68';
import * as wrongnumberUI from './play-wrongnumber.js?v=68';
import * as scribbleUI from './play-scribble.js?v=68';
import * as manorUI from './play-manor.js?v=68';
import * as warfrontUI from './play-warfront.js?v=68';
import * as ironroutesUI from './play-ironroutes.js?v=68';
import * as homesteadUI from './play-homestead.js?v=68';
import * as wordsmithUI from './play-wordsmith.js?v=68';
import * as partyUI from './play-party.js?v=68';
import * as passphraseUI from './play-passphrase.js?v=68';
import * as dontsayUI from './play-dontsay.js?v=68';
import * as pardonUI from './play-pardon.js?v=68';
import * as ludoUI from './play-ludo.js?v=68';
import * as orchardUI from './play-orchard.js?v=68';
import * as sweettrailUI from './play-sweettrail.js?v=68';
import * as snakesUI from './play-snakes.js?v=68';
import * as bingoUI from './play-bingo.js?v=68';
import * as hogtossUI from './play-hogtoss.js?v=68';
import * as hotdiceUI from './play-hotdice.js?v=68';
import * as lineup5UI from './play-lineup5.js?v=68';
import * as shapeshadeUI from './play-shapeshade.js?v=68';
import * as cornerstonesUI from './play-cornerstones.js?v=68';
import * as dominoesUI from './play-dominoes.js?v=68';
import * as starjumpUI from './play-starjump.js?v=68';
import * as codebreakerUI from './play-codebreaker.js?v=68';
import * as goUI from './play-go.js?v=68';
import * as reversiUI from './play-reversi.js?v=68';
import * as rebelcellUI from './play-rebelcell.js?v=68';
import * as powergrabUI from './play-powergrab.js?v=68';
import * as unicornsUI from './play-unicorns.js?v=68';
import * as roadrallyUI from './play-roadrally.js?v=68';
import * as dealmakerUI from './play-dealmaker.js?v=68';
import * as bentoUI from './play-bento.js?v=68';
import * as rackemUI from './play-rackem.js?v=68';
import * as stackupUI from './play-stackup.js?v=68';
import * as cribbageUI from './play-cribbage.js?v=68';
import * as drawpokerUI from './play-drawpoker.js?v=68';
import * as ginUI from './play-gin.js?v=68';
import * as rummyUI from './play-rummy.js?v=68';
import * as oldmaidUI from './play-oldmaid.js?v=68';
import * as warUI from './play-war.js?v=68';
import * as spadesUI from './play-spades.js?v=68';
import * as heartsUI from './play-hearts.js?v=68';
import * as words4funUI from './play-words4fun.js?v=68';
import * as hardsellUI from './play-hardsell.js?v=68';
import * as deepspaceUI from './play-deepspace.js?v=68';
import * as houserulesUI from './play-houserules.js?v=68';
import * as bannerraidUI from './play-bannerraid.js?v=68';
import * as fieldagentsUI from './play-fieldagents.js?v=68';
import * as dialitinUI from './play-dialitin.js?v=68';
import * as pileupUI from './play-pileup.js?v=68';
import * as luckystreakUI from './play-luckystreak.js?v=68';
import * as passpotUI from './play-passpot.js?v=68';
import * as tesseraUI from './play-tessera.js?v=68';
import * as gearworksUI from './play-gearworks.js?v=68';
import * as redlineUI from './play-redline.js?v=68';
import * as grandprixUI from './play-grandprix.js?v=68';
import * as spiresUI from './play-spires.js?v=68';
import * as kaboomUI from './play-kaboom.js?v=68';
import * as nesteggUI from './play-nestegg.js?v=68';

const UIS = { euchre: euchreUI, holdem: pokerUI, veto: vetoUI, gofish: gofishUI, chess: chessUI, backgammon: backgammonUI, sketch: sketchUI, chefskiss: chefskissUI, insidejob: insidejobUI, crown: crownUI, hollow: hollowUI, blackjack: blackjackUI, baccarat: baccaratUI, checkers: checkersUI, yacht: yachtUI, spoons: spoonsUI, doubt: doubtUI, cashout: cashoutUI, crazy8: crazy8UI, skyline: skylineUI, lowtide: lowtideUI, trio: trioUI, fourup: fourupUI, seedstones: seedstonesUI, sonar: sonarUI, milestones: milestonesUI, wrongnumber: wrongnumberUI, scribble: scribbleUI, manor: manorUI, warfront: warfrontUI, ironroutes: ironroutesUI, homestead: homesteadUI, wordsmith: wordsmithUI, powerup: chessUI, nestegg: nesteggUI, kaboom: kaboomUI, spires: spiresUI, grandprix: grandprixUI, redline: redlineUI, gearworks: gearworksUI, tessera: tesseraUI, passpot: passpotUI, luckystreak: luckystreakUI, pileup: pileupUI, dialitin: dialitinUI, fieldagents: fieldagentsUI, bannerraid: bannerraidUI, houserules: houserulesUI, deepspace: deepspaceUI, hardsell: hardsellUI, words4fun: words4funUI, hearts: heartsUI, spades: spadesUI, war: warUI, oldmaid: oldmaidUI, rummy: rummyUI, gin: ginUI, drawpoker: drawpokerUI, cribbage: cribbageUI, stackup: stackupUI, rackem: rackemUI, bento: bentoUI, dealmaker: dealmakerUI, roadrally: roadrallyUI, unicorns: unicornsUI, powergrab: powergrabUI, rebelcell: rebelcellUI, roundtable: rebelcellUI, reversi: reversiUI, go: goUI, codebreaker: codebreakerUI, starjump: starjumpUI, dominoes: dominoesUI, cornerstones: cornerstonesUI, shapeshade: shapeshadeUI, lineup5: lineup5UI, hotdice: hotdiceUI, hogtoss: hogtossUI, bingo: bingoUI, snakes: snakesUI, sweettrail: sweettrailUI, orchard: orchardUI, ludo: ludoUI, poprace: ludoUI, marblerush: ludoUI, pardon: pardonUI, dontsay: dontsayUI, passphrase: passphraseUI, listoff: partyUI, wordbluff: partyUI, topanswers: partyUI, triviawheel: partyUI, answerboard: partyUI, spinsolve: partyUI, oddoneout: partyUI, mostlikely: partyUI, twotruths: partyUI, bluffdice: partyUI, petals: partyUI, sealed: partyUI, insync: partyUI, nightlights: partyUI, nope: partyUI, bullpen: partyUI, openhouse: partyUI, bugbluff: partyUI, snapmatch: partyUI, whoswho: partyUI, throwdown: partyUI, oneclue: partyUI, samebrain: partyUI, closecall: partyUI, doodlebluff: partyUI, dreamcards: partyUI, knowme: partyUI, thisorthat: partyUI, faceoff: partyUI, flagfrenzy: partyUI, capitalquest: partyUI, trueorfalse: partyUI, emojiphrase: partyUI, numbercrunch: partyUI, whichismore: partyUI, missingvowels: partyUI, wordscramble: partyUI, riddleme: partyUI, doesntbelong: partyUI, wildfacts: partyUI, finishthesaying: partyUI, continentquest: partyUI, colorclash: partyUI, countit: partyUI, lastonestanding: partyUI, buzzin: partyUI, whatyear: partyUI, nextinline: partyUI, opposites: partyUI, cluecrack: partyUI, sortitout: partyUI, flashmemory: partyUI, roulette: partyUI, tripledice: partyUI, luckynumbers: partyUI, moneywheel: partyUI, derbyday: partyUI, oddoreven: partyUI, dicepit: partyUI, pegdrop: partyUI, inbetween: partyUI, casinowar: partyUI, liftoff: partyUI, ridethebus: partyUI, threecard: partyUI, islandstud: partyUI, omaha: pokerUI, lowestunique: partyUI, splitsteal: partyUI, twothirds: partyUI, vulturebids: partyUI, treasurerun: partyUI, ticker: partyUI, galaauction: partyUI, threefronts: partyUI, lemonade: partyUI, fishpond: partyUI, mysteryboxes: partyUI, standoff: partyUI, fiveletters: partyUI, wordgallows: partyUI, longword: partyUI, targetnumber: partyUI, speedtypist: partyUI, wordchain: partyUI, ghostletters: partyUI, slowreveal: partyUI, acrorace: partyUI, fibfinder: partyUI };
const params = new URLSearchParams(location.search);

let pid = null;
try { pid = sessionStorage.getItem('syndaris.pid'); } catch {}
if (!pid) {
  pid = 'p-' + Math.random().toString(36).slice(2, 10);
  try { sessionStorage.setItem('syndaris.pid', pid); } catch {}
}

let net = null;
let st = null;          // last state from the table
let pickingSeat = false;
let lastGameKey = '';

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
}

// ---------------------------------------------------------------- join

try { $('#name').value = localStorage.getItem('syndaris.name') || ''; } catch {}
const urlRoom = (params.get('room') || '').toUpperCase();
if (urlRoom) { $('#room').value = urlRoom; $('#roomField').hidden = true; }
show('s-join');

$('#joinBtn').onclick = () => {
  const name = $('#name').value.trim();
  const room = $('#room').value.trim().toUpperCase();
  if (!name) { $('#name').focus(); return toast('Enter your name'); }
  if (!/^[A-Z]{4}$/.test(room)) { $('#roomField').hidden = false; $('#room').focus(); return toast('Enter the 4-letter room code shown on the table'); }
  try {
    localStorage.setItem('syndaris.name', name);
    sessionStorage.setItem('syndaris.joined', room);
  } catch {}
  if (!urlRoom) history.replaceState(null, '', '?room=' + room);
  keepAwake();
  $('#waitMsg').textContent = 'Connecting to the table…';
  show('s-wait');
  net = joinRoom(room, {
    pid,
    onOpen: () => net.send({ t: 'hello', id: pid, name }),
    onMessage,
    onStatus,
  });
};
$('#name').addEventListener('keydown', e => { if (e.key === 'Enter') $('#joinBtn').click(); });
$('#cancelBtn').onclick = () => {
  try { sessionStorage.removeItem('syndaris.joined'); } catch {}
  location.reload();
};

// Page reloaded mid-game: jump straight back in.
try {
  if (urlRoom && sessionStorage.getItem('syndaris.joined') === urlRoom && $('#name').value) $('#joinBtn').click();
} catch {}

function onStatus(s) {
  const bar = $('#netbar');
  if (!st) {
    $('#waitMsg').textContent = {
      connecting: 'Connecting to the table…',
      'no-table': "Can't find that table yet. Make sure the room code is right and the table screen is open — still trying…",
      offline: 'No internet connection — retrying…',
      lost: 'Reconnecting…',
    }[s] || 'Connecting…';
    return;
  }
  bar.hidden = s === 'online';
  bar.textContent = s === 'no-table' ? 'Table not reachable — retrying…' : 'Reconnecting to the table…';
}

function onMessage(m) {
  if (m.t === 'error') return toast(m.msg);
  if (m.t !== 'state') return;
  st = m;
  $('#netbar').hidden = true;
  render();
}

function send(action) {
  if (!net || !net.send({ t: 'act', action })) toast('Not connected — hang on…');
}

const nameOf = s => st.seats[s]?.name || GAMES[st.gameId].layout[s]?.name || '?';

// ---------------------------------------------------------------- render

function render() {
  if (st.you === null || pickingSeat) return renderSeatPicker();
  show('s-game');
  const ui = UIS[st.gameId];
  document.body.dataset.game = st.gameId;
  const gameKey = st.gameId + (st.started ? ':on' : ':off');
  if (gameKey !== lastGameKey) {
    lastGameKey = gameKey;
    Object.values(UIS).forEach(u => u.reset());
    resetHand();
    $('#panel').innerHTML = '';
    $('#board').innerHTML = '';
    $('#myHand').textContent = '';
  }
  const c = { st, send, nameOf, raw: msg => net?.send(msg) };

  if (!st.game) {
    document.body.classList.remove('myturn');
    ui.renderLobby(c);
    const G = GAMES[st.gameId];
    const n = st.seats.filter(Boolean).length;
    setStatus(`You're in! · ${G.name}`, n >= G.min ? `Waiting for someone to tap "${G.startLabel || 'Deal'}" on the table.` : 'Waiting for everyone to sit down…');
    $('#panel').innerHTML = '<button class="panel-btn wide" id="chgSeat">Change seat</button>';
    $('#chgSeat').onclick = () => { pickingSeat = true; render(); };
    renderHand([]);
    return;
  }
  ui.render(c);
}

// ---------------------------------------------------------------- seat picker

function renderSeatPicker() {
  const G = GAMES[st.gameId];
  const claimable = s => !s || s.bot || !s.connected;
  if (st.started && st.you === null && !st.seats.some((s, i) => claimable(s) && (s || G.midJoin))) {
    $('#waitMsg').textContent = "A game is already going and every seat is taken. You'll be able to join when a seat opens up.";
    return show('s-wait');
  }
  show('s-seat');
  $('#seatGame').textContent = G.name;
  const table = $('#minitable');
  table.dataset.game = G.id;
  table.querySelectorAll('.seatbtn').forEach(b => b.remove());
  G.layout.forEach((L, seat) => {
    const s = st.seats[seat];
    const mine = st.you === seat;
    const b = document.createElement('button');
    b.className = 'seatbtn side-' + L.side;
    // Map the table-screen position into the little picture of the table. Rows along the
    // top/bottom edge (x from 28% to 72%) are stretched to use the picture's full width.
    const vertical = L.side % 2 === 1;
    const [w, h] = vertical ? (G.max > 4 ? [20, 30] : [22, 42]) : (G.max > 4 ? [32, 19] : [42, 21]);
    const fx = vertical ? L.x / 100 : Math.min(1, Math.max(0, (L.x - 28) / 44));
    Object.assign(b.style, {
      width: w + '%', height: h + '%',
      left: (100 - w) * fx + '%', top: ((100 - h) * L.y) / 100 + '%',
    });
    b.style.setProperty('--dot', `var(--seat-${seat})`);
    b.classList.toggle('mine', mine);
    b.classList.toggle('open', !s);
    const joinable = !s && (!st.started || G.midJoin);
    b.disabled = !mine && !(claimable(s) && (s || joinable));
    if (mine) b.innerHTML = `You<small>${L.name}</small>`;
    else if (!s) b.innerHTML = `Sit here<small>${L.name}</small>`;
    else if (s.bot) b.innerHTML = `${esc(s.name)}<small>bot · tap to replace</small>`;
    else if (!s.connected) b.innerHTML = `${esc(s.name)}<small>tap to rejoin</small>`;
    else b.innerHTML = `${esc(s.name)}<small>${L.name}</small>`;
    b.onclick = () => {
      pickingSeat = false;
      if (!mine) net.send({ t: 'sit', seat });
      render();
    };
    table.appendChild(b);
  });
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
