// The table: the shared screen in the middle. Hosts the game, the lobby and the seats.
// Game-specific rules and drawing live in table-<game>.js modules.
import { GAMES, SIDE_ROT } from './games.js?v=91';
import { cardEl, snap, keepAwake } from './cards.js?v=91';
import { hostRoom } from './net.js?v=91';
import { winnersOf, leadersOf, OPEN_ENDED } from './winners.js?v=91';
import euchre from './table-euchre.js?v=91';
import holdem from './table-poker.js?v=91';
import veto from './table-veto.js?v=91';
import gofish from './table-gofish.js?v=91';
import chess from './table-chess.js?v=91';
import backgammon from './table-backgammon.js?v=91';
import sketch from './table-sketch.js?v=91';
import chefskiss from './table-chefskiss.js?v=91';
import insidejob from './table-insidejob.js?v=91';
import crown from './table-crown.js?v=91';
import hollow from './table-hollow.js?v=91';
import blackjack from './table-blackjack.js?v=91';
import baccarat from './table-baccarat.js?v=91';
import checkers from './table-checkers.js?v=91';
import yacht from './table-yacht.js?v=91';
import spoons from './table-spoons.js?v=91';
import doubt from './table-doubt.js?v=91';
import cashout from './table-cashout.js?v=91';
import crazy8 from './table-crazy8.js?v=91';
import skyline from './table-skyline.js?v=91';
import lowtide from './table-lowtide.js?v=91';
import trio from './table-trio.js?v=91';
import fourup from './table-fourup.js?v=91';
import seedstones from './table-seedstones.js?v=91';
import sonar from './table-sonar.js?v=91';
import milestones from './table-milestones.js?v=91';
import wrongnumber from './table-wrongnumber.js?v=91';
import scribble from './table-scribble.js?v=91';
import manor from './table-manor.js?v=91';
import warfront from './table-warfront.js?v=91';
import ironroutes from './table-ironroutes.js?v=91';
import homestead from './table-homestead.js?v=91';
import wordsmith from './table-wordsmith.js?v=91';
import powerup from './table-powerup.js?v=91';
import plottwist from './table-plottwist.js?v=91';
import guilty from './table-guilty.js?v=91';
import twowords from './table-twowords.js?v=91';
import lipreader from './table-lipreader.js?v=91';
import excuses from './table-excuses.js?v=91';
import drawpartner from './table-drawpartner.js?v=91';
import translatethis from './table-translatethis.js?v=91';
import interrogation from './table-interrogation.js?v=91';
import worstgift from './table-worstgift.js?v=91';
import whosaidthat from './table-whosaidthat.js?v=91';
import hottakes from './table-hottakes.js?v=91';
import fakepitch from './table-fakepitch.js?v=91';
import emojistory from './table-emojistory.js?v=91';
import cornerkings from './table-cornerkings.js?v=91';
import cardgolf from './table-cardgolf.js?v=91';
import pairs from './table-pairs.js?v=91';
import tonk from './table-tonk.js?v=91';
import thirtyone from './table-thirtyone.js?v=91';
import foolsdefense from './table-foolsdefense.js?v=91';
import bigdeuce from './table-bigdeuce.js?v=91';
import topdog from './table-topdog.js?v=91';
import bridge from './table-bridge.js?v=91';
import pinochle from './table-pinochle.js?v=91';
import schnapsen from './table-schnapsen.js?v=91';
import missiontricks from './table-missiontricks.js?v=91';
import raven from './table-raven.js?v=91';
import setback from './table-setback.js?v=91';
import exactly from './table-exactly.js?v=91';
import whist from './table-whist.js?v=91';
import mafianight from './table-mafianight.js?v=91';
import undercover from './table-undercover.js?v=91';
import codecrack from './table-codecrack.js?v=91';
import copycat from './table-copycat.js?v=91';
import fakeartist from './table-fakeartist.js?v=91';
import captionit from './table-captionit.js?v=91';
import mindmeld from './table-mindmeld.js?v=91';
import topfive from './table-topfive.js?v=91';
import rateit from './table-rateit.js?v=91';
import storychain from './table-storychain.js?v=91';
import fibfinder from './table-fibfinder.js?v=91';
import acrorace from './table-acrorace.js?v=91';
import slowreveal from './table-slowreveal.js?v=91';
import ghostletters from './table-ghostletters.js?v=91';
import wordchain from './table-wordchain.js?v=91';
import targetnumber from './table-targetnumber.js?v=91';
import longword from './table-longword.js?v=91';
import wordgallows from './table-wordgallows.js?v=91';
import fiveletters from './table-fiveletters.js?v=91';
import standoff from './table-standoff.js?v=91';
import mysteryboxes from './table-mysteryboxes.js?v=91';
import fishpond from './table-fishpond.js?v=91';
import lemonade from './table-lemonade.js?v=91';
import threefronts from './table-threefronts.js?v=91';
import galaauction from './table-galaauction.js?v=91';
import ticker from './table-ticker.js?v=91';
import treasurerun from './table-treasurerun.js?v=91';
import vulturebids from './table-vulturebids.js?v=91';
import twothirds from './table-twothirds.js?v=91';
import splitsteal from './table-splitsteal.js?v=91';
import lowestunique from './table-lowestunique.js?v=91';
import omaha from './table-omaha.js?v=91';
import islandstud from './table-islandstud.js?v=91';
import threecard from './table-threecard.js?v=91';
import ridethebus from './table-ridethebus.js?v=91';
import liftoff from './table-liftoff.js?v=91';
import casinowar from './table-casinowar.js?v=91';
import inbetween from './table-inbetween.js?v=91';
import pegdrop from './table-pegdrop.js?v=91';
import dicepit from './table-dicepit.js?v=91';
import oddoreven from './table-oddoreven.js?v=91';
import derbyday from './table-derbyday.js?v=91';
import moneywheel from './table-moneywheel.js?v=91';
import luckynumbers from './table-luckynumbers.js?v=91';
import tripledice from './table-tripledice.js?v=91';
import roulette from './table-roulette.js?v=91';
import flashmemory from './table-flashmemory.js?v=91';
import sortitout from './table-sortitout.js?v=91';
import cluecrack from './table-cluecrack.js?v=91';
import opposites from './table-opposites.js?v=91';
import nextinline from './table-nextinline.js?v=91';
import whatyear from './table-whatyear.js?v=91';
import buzzin from './table-buzzin.js?v=91';
import lastonestanding from './table-lastonestanding.js?v=91';
import countit from './table-countit.js?v=91';
import colorclash from './table-colorclash.js?v=91';
import continentquest from './table-continentquest.js?v=91';
import finishthesaying from './table-finishthesaying.js?v=91';
import wildfacts from './table-wildfacts.js?v=91';
import doesntbelong from './table-doesntbelong.js?v=91';
import riddleme from './table-riddleme.js?v=91';
import wordscramble from './table-wordscramble.js?v=91';
import missingvowels from './table-missingvowels.js?v=91';
import whichismore from './table-whichismore.js?v=91';
import numbercrunch from './table-numbercrunch.js?v=91';
import emojiphrase from './table-emojiphrase.js?v=91';
import trueorfalse from './table-trueorfalse.js?v=91';
import capitalquest from './table-capitalquest.js?v=91';
import flagfrenzy from './table-flagfrenzy.js?v=91';
import faceoff from './table-faceoff.js?v=91';
import thisorthat from './table-thisorthat.js?v=91';
import knowme from './table-knowme.js?v=91';
import dreamcards from './table-dreamcards.js?v=91';
import doodlebluff from './table-doodlebluff.js?v=91';
import closecall from './table-closecall.js?v=91';
import samebrain from './table-samebrain.js?v=91';
import oneclue from './table-oneclue.js?v=91';
import throwdown from './table-throwdown.js?v=91';
import whoswho from './table-whoswho.js?v=91';
import snapmatch from './table-snapmatch.js?v=91';
import bugbluff from './table-bugbluff.js?v=91';
import openhouse from './table-openhouse.js?v=91';
import bullpen from './table-bullpen.js?v=91';
import nope from './table-nope.js?v=91';
import nightlights from './table-nightlights.js?v=91';
import insync from './table-insync.js?v=91';
import sealed from './table-sealed.js?v=91';
import petals from './table-petals.js?v=91';
import bluffdice from './table-bluffdice.js?v=91';
import twotruths from './table-twotruths.js?v=91';
import mostlikely from './table-mostlikely.js?v=91';
import oddoneout from './table-oddoneout.js?v=91';
import spinsolve from './table-spinsolve.js?v=91';
import answerboard from './table-answerboard.js?v=91';
import triviawheel from './table-triviawheel.js?v=91';
import topanswers from './table-topanswers.js?v=91';
import wordbluff from './table-wordbluff.js?v=91';
import listoff from './table-listoff.js?v=91';
import passphrase from './table-passphrase.js?v=91';
import dontsay from './table-dontsay.js?v=91';
import pardon from './table-pardon.js?v=91';
import marblerush from './table-marblerush.js?v=91';
import poprace from './table-poprace.js?v=91';
import ludo from './table-ludo.js?v=91';
import orchard from './table-orchard.js?v=91';
import sweettrail from './table-sweettrail.js?v=91';
import snakes from './table-snakes.js?v=91';
import bingo from './table-bingo.js?v=91';
import hogtoss from './table-hogtoss.js?v=91';
import hotdice from './table-hotdice.js?v=91';
import lineup5 from './table-lineup5.js?v=91';
import shapeshade from './table-shapeshade.js?v=91';
import cornerstones from './table-cornerstones.js?v=91';
import dominoes from './table-dominoes.js?v=91';
import starjump from './table-starjump.js?v=91';
import codebreaker from './table-codebreaker.js?v=91';
import go from './table-go.js?v=91';
import reversi from './table-reversi.js?v=91';
import roundtable from './table-roundtable.js?v=91';
import rebelcell from './table-rebelcell.js?v=91';
import powergrab from './table-powergrab.js?v=91';
import unicorns from './table-unicorns.js?v=91';
import roadrally from './table-roadrally.js?v=91';
import dealmaker from './table-dealmaker.js?v=91';
import bento from './table-bento.js?v=91';
import rackem from './table-rackem.js?v=91';
import stackup from './table-stackup.js?v=91';
import cribbage from './table-cribbage.js?v=91';
import drawpoker from './table-drawpoker.js?v=91';
import gin from './table-gin.js?v=91';
import rummy from './table-rummy.js?v=91';
import oldmaid from './table-oldmaid.js?v=91';
import war from './table-war.js?v=91';
import spades from './table-spades.js?v=91';
import hearts from './table-hearts.js?v=91';
import words4fun from './table-words4fun.js?v=91';
import hardsell from './table-hardsell.js?v=91';
import deepspace from './table-deepspace.js?v=91';
import houserules from './table-houserules.js?v=91';
import bannerraid from './table-bannerraid.js?v=91';
import fieldagents from './table-fieldagents.js?v=91';
import dialitin from './table-dialitin.js?v=91';
import pileup from './table-pileup.js?v=91';
import luckystreak from './table-luckystreak.js?v=91';
import passpot from './table-passpot.js?v=91';
import tessera from './table-tessera.js?v=91';
import gearworks from './table-gearworks.js?v=91';
import redline from './table-redline.js?v=91';
import grandprix from './table-grandprix.js?v=91';
import spires from './table-spires.js?v=91';
import kaboom from './table-kaboom.js?v=91';
import nestegg from './table-nestegg.js?v=91';

const MODES = { euchre, holdem, veto, gofish, chess, backgammon, sketch, chefskiss, insidejob, crown, hollow, blackjack, baccarat, checkers, yacht, spoons, doubt, cashout, crazy8, skyline, lowtide, trio, fourup, seedstones, sonar, milestones, wrongnumber, scribble, manor, warfront, ironroutes, homestead, wordsmith, powerup, nestegg, kaboom, spires, grandprix, redline, gearworks, tessera, passpot, luckystreak, pileup, dialitin, fieldagents, bannerraid, houserules, deepspace, hardsell, words4fun, hearts, spades, war, oldmaid, rummy, gin, drawpoker, cribbage, stackup, rackem, bento, dealmaker, roadrally, unicorns, powergrab, rebelcell, roundtable, reversi, go, codebreaker, starjump, dominoes, cornerstones, shapeshade, lineup5, hotdice, hogtoss, bingo, snakes, sweettrail, orchard, ludo, poprace, marblerush, pardon, dontsay, passphrase, listoff, wordbluff, topanswers, triviawheel, answerboard, spinsolve, oddoneout, mostlikely, twotruths, bluffdice, petals, sealed, insync, nightlights, nope, bullpen, openhouse, bugbluff, snapmatch, whoswho, throwdown, oneclue, samebrain, closecall, doodlebluff, dreamcards, knowme, thisorthat, faceoff, flagfrenzy, capitalquest, trueorfalse, emojiphrase, numbercrunch, whichismore, missingvowels, wordscramble, riddleme, doesntbelong, wildfacts, finishthesaying, continentquest, colorclash, countit, lastonestanding, buzzin, whatyear, nextinline, opposites, cluecrack, sortitout, flashmemory, roulette, tripledice, luckynumbers, moneywheel, derbyday, oddoreven, dicepit, pegdrop, inbetween, casinowar, liftoff, ridethebus, threecard, islandstud, omaha, lowestunique, splitsteal, twothirds, vulturebids, treasurerun, ticker, galaauction, threefronts, lemonade, fishpond, mysteryboxes, standoff, fiveletters, wordgallows, longword, targetnumber, wordchain, ghostletters, slowreveal, acrorace, fibfinder, storychain, rateit, topfive, mindmeld, captionit, fakeartist, copycat, codecrack, undercover, mafianight, whist, exactly, setback, raven, missiontricks, schnapsen, pinochle, bridge, topdog, bigdeuce, foolsdefense, thirtyone, tonk, pairs, cardgolf, cornerkings, emojistory, fakepitch, hottakes, whosaidthat, worstgift, interrogation, translatethis, drawpartner, excuses, lipreader, twowords, guilty, plottwist };
const STORE = 'syndaris.table.v2';
const BOT_NAMES = ['Dot', 'Rook', 'Bixby', 'Clank', 'Pixel', 'Gizmo', 'Sprocket', 'Widget'];
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const $ = s => document.querySelector(s);

const newRoom = () => Array.from({ length: 4 }, () => ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)]).join('');

function freshSession(room) {
  return {
    room: room || newRoom(),
    gameId: 'euchre',
    players: new Array(GAMES.euchre.layout.length).fill(null),
    settings: Object.fromEntries(Object.entries(MODES).map(([id, m]) => [id, { ...m.defaults }])),
    game: null,
  };
}

let session = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s && s.room && GAMES[s.gameId] && Array.isArray(s.players)) {
      s.players.forEach(p => { if (p && !p.bot) { p.connected = false; p.lostAt = Date.now(); } });
      s.settings = s.settings || {};
      for (const id in MODES) s.settings[id] = { ...MODES[id].defaults, ...s.settings[id] };
      return s;
    }
  } catch {}
  return freshSession();
})();

// How big cards are drawn on the table (the slider in the corner), remembered on this device.
let cardScale = 1;
try { cardScale = Math.min(1.8, Math.max(0.8, Number(localStorage.getItem('pod.cardScale')) || 1)); } catch {}
document.documentElement.style.setProperty('--card-scale', cardScale);

let upright = false;
try {
  const saved = localStorage.getItem('syndaris.table.upright');
  // A TV stands up, so it starts in Upright mode unless someone changed it.
  upright = saved === null ? document.documentElement.classList.contains('tv') : saved === '1';
} catch {}

const mode = () => MODES[session.gameId];
const info = () => GAMES[session.gameId];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(session)); } catch {} };
const seatOf = pid => session.players.findIndex(p => p && p.id === pid);
const nameOf = seat => session.players[seat]?.name || info().layout[seat]?.name || '?';
const clients = new Map(); // pid -> { name, lastSeen }

// ---------------------------------------------------------------- networking

const net = hostRoom(session.room, {
  onStatus(s) {
    const el = $('#netstatus');
    el.className = 'pill ' + (s === 'online' ? 'ok' : 'bad');
    el.textContent = {
      online: `Room ${session.room}`, connecting: 'Connecting…', reconnecting: 'Reconnecting…', waiting: 'Opening room…',
    }[s] || s;
  },
  onMessage,
  onLeave(pid) {
    clients.delete(pid);
    const s = seatOf(pid);
    if (s >= 0) { session.players[s].connected = false; session.players[s].lostAt = Date.now(); update(); }
  },
});

function onMessage(pid, msg) {
  const seat = seatOf(pid);
  const c = clients.get(pid);
  if (c) c.lastSeen = Date.now();
  switch (msg.t) {
    case 'hello': {
      const name = cleanName(msg.name);
      clients.set(pid, { name, lastSeen: Date.now() });
      if (seat >= 0) Object.assign(session.players[seat], { connected: true, name: name || session.players[seat].name });
      else if (session.game && name) {
        // Someone who dropped out and scanned back in: put them back in their old seat.
        const old = session.players.findIndex(p => p && !p.bot && !p.connected && p.name.toLowerCase() === name.toLowerCase());
        if (old >= 0) Object.assign(session.players[old], { id: pid, connected: true });
      }
      update();
      break;
    }
    case 'ping':
      net.send(pid, { t: 'pong' });
      if (seat >= 0 && !session.players[seat].connected) { session.players[seat].connected = true; update(); }
      break;
    case 'sit': claimSeat(pid, msg.seat); break;
    case 'leave':
      if (seat >= 0 && !session.game) { session.players[seat] = null; update(); }
      break;
    case 'act': {
      const g = session.game;
      if (!g || seat < 0) return;
      const err = mode().act(g, seat, msg.action);
      if (err) net.send(pid, { t: 'error', msg: err });
      else update();
      break;
    }
    case 'ink': {
      // Live drawing (Sketch & Guess). Drawn straight onto the table without re-sending
      // everyone's screen; saved a moment later.
      const g = session.game;
      if (g && seat >= 0 && mode().ink?.(g, seat, msg)) saveSoon();
      break;
    }
  }
}

let saveT = null;
function saveSoon() {
  clearTimeout(saveT);
  saveT = setTimeout(save, 1500);
}

function cleanName(n) {
  return String(n || '').replace(/[<>&"]/g, '').trim().slice(0, 14);
}

function claimSeat(pid, s) {
  if (!(s >= 0 && s < session.players.length)) return;
  const cur = session.players[s];
  const mine = seatOf(pid);
  if (mine === s) return;
  if (cur && !cur.bot && cur.connected) return net.send(pid, { t: 'error', msg: 'Someone is already sitting there' });
  if (session.game && mine >= 0) return net.send(pid, { t: 'error', msg: "You can't switch seats in the middle of a game" });
  if (session.game && !cur && !mode().joinMidGame(session.game, s)) return net.send(pid, { t: 'error', msg: 'Wait for the next game to sit there' });
  if (mine >= 0) session.players[mine] = null;
  const name = clients.get(pid)?.name || 'Player';
  session.players[s] = { id: pid, name, bot: false, connected: true };
  update();
}

// Every state update carries this table's run id and a rising number, so a phone can drop an
// older update that arrives after a newer one (two relays, async decryption, resends).
const RUN = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let stateSeq = 0;

function stateFor(pid) {
  const seat = seatOf(pid);
  const g = session.game;
  return {
    t: 'state',
    run: RUN,
    seq: ++stateSeq,
    room: session.room,
    gameId: session.gameId,
    seats: session.players.map(p => p && { name: p.name, bot: !!p.bot, connected: !!p.connected }),
    started: !!g,
    you: seat >= 0 ? seat : null,
    game: g && seat >= 0 ? mode().view(g, seat) : null,
    // Dough this phone has won (it collects each one once, into its own account).
    awards: (session.awards || []).filter(a => a.pid === pid).map(a => a.id),
  };
}

function broadcast() {
  for (const pid of net.clients()) net.send(pid, stateFor(pid));
}

// Every few seconds, resend everyone's screen in case an update got lost on the relay.
setInterval(broadcast, 8000);

// Mark players whose phones went quiet (screen locked, walked away).
setInterval(() => {
  let changed = false;
  for (const p of session.players) {
    if (!p || p.bot || !p.connected) continue;
    const c = clients.get(p.id);
    if (!c || Date.now() - c.lastSeen > 15000) { p.connected = false; p.lostAt = Date.now(); changed = true; }
  }
  if (changed) update();
}, 5000);

// ---------------------------------------------------------------- game driving

let autoTimer = null;
function automate() {
  clearTimeout(autoTimer);
  const g = session.game;
  if (!g) return;
  const t = mode().timer(g, session.players);
  if (t) { autoTimer = setTimeout(() => { t.run(); update(); }, t.ms); return; }
  const turn = mode().turn(g);
  const p = turn >= 0 ? session.players[turn] : null;
  if (p?.bot) {
    autoTimer = setTimeout(() => {
      const err = mode().act(g, turn, mode().bot(g, turn));
      if (err) console.warn('bot move rejected:', err);
      update();
    }, 850 + Math.random() * 600);
  } else if (p && !p.connected && mode().bot) {
    // Safety net: if it's the turn of someone whose phone has dropped off, the table doesn't wait
    // forever. After 30 seconds away it makes that one move for them, then waits again.
    autoTimer = setTimeout(() => {
      if (session.game !== g || mode().turn(g) !== turn || p.connected) return automate();
      const a = mode().bot(g, turn);
      const err = a && mode().act(g, turn, a);
      if (err || !a) { console.warn('stand-in move rejected:', err); p.lostAt = Date.now(); }  // try again in 30 s, never in a loop
      update();
    }, Math.max(0, (p.lostAt || Date.now()) + 30000 - Date.now()));
  }
}

// ---------------------------------------------------------------- Dough for the winners
// When a game ends, each winning player (not computer players) earns 10 Dough. The table only
// decides who won; each winner's phone collects it into their own account. Every game pays once.
function payWinners(seats, g) {
  g._paid = true;
  const people = seats.filter(s => session.players[s] && !session.players[s].bot);
  session.awards = [...(session.awards || []), ...people.map(s => ({ id: `${g._uid || RUN}:${s}`, pid: session.players[s].id }))].slice(-60);
  if (people.length) doughBanner(people);
}
function checkWin() {
  const g = session.game;
  if (!g || g._paid) return;
  let w = null;
  try { w = winnersOf(session.gameId, g); } catch {}
  if (w) payWinners(w, g);
}
// Open-ended games (Scribble Chain, the casino tables) pay whoever leads when the table goes back to the lobby.
function payLeaders() {
  const g = session.game;
  if (!g || g._paid || !OPEN_ENDED.has(session.gameId)) return;
  let w = [];
  try { w = leadersOf(session.gameId, g); } catch {}
  payWinners(w, g);
}
let bannerT = null;
function doughBanner(seats) {
  let el = document.getElementById('doughBanner');
  if (!el) { el = document.createElement('div'); el.id = 'doughBanner'; document.body.appendChild(el); }
  const names = seats.map(s => cleanName(session.players[s]?.name));
  el.innerHTML = `<b>+10 Dough</b><span>${names.length > 1 ? names.slice(0, -1).join(', ') + ' & ' + names.at(-1) : names[0]} ${names.length > 1 ? 'each win' : 'wins'} 10 Dough!</span>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), 6500);
}

function update() {
  checkWin();
  save();
  render();
  broadcast();
  automate();
}

function startGame() {
  const n = session.players.filter(Boolean).length;
  if (n < info().min || n > info().max) return;
  snap(0.01); // unlocks audio on iOS while we have a user gesture
  keepAwake();
  mode().reset();
  // The game just finished goes along too, for games whose points carry over on "Play again".
  session.game = mode().create(session.settings[session.gameId], session.players, session.game);
  session.game._uid = RUN + ':' + Date.now().toString(36);
  update();
}

function endGame() {
  payLeaders();
  session.game = null;
  mode().reset();
  update();
}

// Switching games: move everyone to the nearest seat in the new layout.
function remapPlayers(players, oldLayout, newLayout) {
  const seated = players.map((p, i) => p && { p, at: oldLayout[i] }).filter(x => x && x.at);
  const next = new Array(newLayout.length).fill(null);
  for (const { p, at } of seated) {
    let best = -1, bestD = Infinity;
    newLayout.forEach((L, i) => {
      if (next[i]) return;
      const d = (L.x - at.x) ** 2 + (L.y - at.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best >= 0) next[best] = p;
  }
  return next;
}

// ---------------------------------------------------------------- rendering

let seatEls = [];
function buildSeats() {
  seatEls.forEach(el => el.remove());
  seatEls = info().layout.map((L, pos) => {
    const el = $('#seatTpl').content.firstElementChild.cloneNode(true);
    el.classList.add('side-' + L.side);
    el.style.setProperty('--x', L.x + '%');
    el.style.setProperty('--y', L.y + '%');
    el.style.setProperty('--seat-color', `var(--seat-${pos})`);
    el.querySelector('.addbot').onclick = () => {
      const used = session.players.filter(Boolean).map(p => p.name);
      const name = BOT_NAMES.find(n => !used.includes(n)) || 'Bot';
      if (session.game && !mode().joinMidGame(session.game, pos)) return;
      session.players[pos] = { id: 'bot-' + pos + '-' + Date.now(), name, bot: true, connected: true };
      update();
    };
    el.querySelector('.kick').onclick = () => { session.players[pos] = null; update(); };
    el.querySelector('.takeover').onclick = () => {
      const p = session.players[pos];
      if (p) { p.bot = true; p.connected = true; p.name += ' 🤖'; update(); }
    };
    $('#felt').appendChild(el);
    return el;
  });
  document.body.dataset.game = session.gameId;
  document.body.classList.toggle('many-seats', info().layout.length > 4);
  document.body.classList.toggle('no-bots', !!info().noBots);
  drawPrint();
}

// The table's printed markings: a double oval with the name set along it, readable from
// both long sides. Sized to sit just inside the seats.
function drawPrint() {
  // Some tables have their own scenery (Go Fish: rocks, lily pads, koi).
  const decor = $('#decor');
  const fr = $('#felt').getBoundingClientRect();
  if (mode().decorate) mode().decorate(decor, fr.width, fr.height, Math.min(fr.width, fr.height) / 100);
  else { decor.innerHTML = ''; delete decor.dataset.key; }
  const r = fr;
  const W = r.width, H = r.height, v = Math.min(W, H) / 100;
  const edge = (3.4 + 1.2 + (info().layout.length > 4 ? 21 : 25) + 1.6) * v;
  const cx = W / 2, cy = H / 2, rx = W / 2 - edge, ry = H / 2 - edge;
  if (rx < 10 * v || ry < 10 * v) { $('#print').innerHTML = ''; return; }
  const tx = rx - 1.7 * v, ty = ry - 1.7 * v;
  const words = 'PLAY ON DISPLAY ✦ CARD TABLE';
  const text = id => `<text font-size="${1.7 * v}" opacity=".7"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${words}</textPath></text>`;
  $('#print').innerHTML = `<svg viewBox="0 0 ${W} ${H}">
    <defs>
      <path id="arcB" d="M ${cx - tx} ${cy} A ${tx} ${ty} 0 0 0 ${cx + tx} ${cy}"/>
      <path id="arcT" d="M ${cx + tx} ${cy} A ${tx} ${ty} 0 0 0 ${cx - tx} ${cy}"/>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="currentColor" stroke-width="${0.16 * v}" opacity=".5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx - 0.8 * v}" ry="${ry - 0.8 * v}" fill="none" stroke="currentColor" stroke-width="${0.08 * v}" opacity=".3"/>
    ${text('arcB')}${text('arcT')}
  </svg>`;
}

function renderLobbyInfo() {
  document.querySelectorAll('.roomcode').forEach(el => { el.textContent = session.room; });
  const look = '&look=' + (document.documentElement.dataset.style === 'vibrant' ? 'vibrant' : 'classic');
  const url = new URL('play.html?room=' + session.room + look, location.href).href;
  $('#joinUrl').textContent = url.replace(/^https?:\/\//, '').replace(look, '');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
  $('#localWarn').hidden = !local;
  const qrEl = $('#qr');
  if (window.qrcode) {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    // A small copy by the room code during the game, so anyone who drops out can scan back in.
    $('#qrMini .qr').innerHTML = qrEl.innerHTML;
  } else qrEl.textContent = 'QR unavailable — type the address instead';

  // The game is picked in the catalog (index.html); here we just name it.
  $('#gameTitle').textContent = info().name;
  $('#gameBlurb').textContent = info().blurb;

  const set = session.settings[session.gameId];
  const box = $('#settings');
  box.innerHTML = mode().settingsHTML(set);
  box.querySelectorAll('[data-set]').forEach(el => {
    el.onchange = () => {
      const key = el.dataset.set;
      if (!mode().applySetting?.(set, key, el)) set[key] = el.type === 'checkbox' ? el.checked : Number(el.value);
      update();
    };
  });
}

// Geometry helpers handed to the game renderers.
function geometry() {
  const r = $('#felt').getBoundingClientRect();
  const vmin = Math.min(r.width, r.height) / 100;
  const layout = info().layout;
  return {
    vmin,
    layout,
    upright,
    cardScale,
    nameOf,
    bubble: (seat, text) => showBubble(seat, text),
    // For games that finish work in the background (Chef's Kiss's Si): re-send everyone's screen.
    refresh: () => { if (session.game) update(); },
    // Moves made by touching the table itself (chess pieces on the board).
    isBot: seat => !!session.players[seat]?.bot,
    act(seat, a) {
      if (!session.game) return 'No game';
      const err = mode().act(session.game, seat, a);
      if (err) showBubble(seat, err);
      else update();
      return err;
    },
    rot: seat => (upright ? 0 : SIDE_ROT[layout[seat].side]),
    // A point `d` vmin in from the edge that seat sits on, relative to the table centre.
    inset(seat, d) {
      const L = layout[seat];
      d += 2.6; // clear of the rail
      if (upright && L.side % 2 === 1) d += 8;
      let x = (L.x / 100) * r.width, y = (L.y / 100) * r.height;
      if (L.side === 0) y = r.height - d * vmin;
      if (L.side === 1) x = d * vmin;
      if (L.side === 2) y = d * vmin;
      if (L.side === 3) x = r.width - d * vmin;
      return { x: x - r.width / 2, y: y - r.height / 2 };
    },
  };
}

function render() {
  const g = session.game;
  const G = info();
  document.body.classList.toggle('in-lobby', !g);
  document.body.classList.toggle('in-game', !!g);
  document.body.classList.toggle('upright', upright);
  $('#btnOrient').textContent = upright ? 'Upright' : 'Flat';
  $('#btnEnd').hidden = !g;
  $('#allGames').hidden = !!g;
  // A game can add its own switch to the corner toolbar (Go Fish's fishing motion).
  const tool = mode().tool;
  $('#btnTool').hidden = !tool;
  if (tool) {
    const on = tool.on(session.settings[session.gameId]);
    const b = $('#btnTool');
    b.className = 'switch' + (on ? ' on' : '');
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="track"><span class="knob"></span></span><span class="sw-label">${tool.label}<small>${tool.hint}</small></span><b>${on ? 'On' : 'Off'}</b>`;
  }

  if (!g) {
    const n = session.players.filter(Boolean).length;
    const ok = n >= G.min && n <= G.max;
    $('#startBtn').disabled = !ok;
    $('#startBtn').textContent = ok ? G.startLabel || 'Deal the cards'
      : G.min === G.max ? `Waiting for players (${n}/${G.max})` : `Need at least ${G.min} players`;
  }

  turnSeat = -1;
  session.players.forEach((p, pos) => renderSeat(pos, p, g));
  // The lamp follows whoever's turn it is.
  const lamp = $('#lamp');
  lamp.classList.toggle('on', turnSeat >= 0);
  if (turnSeat >= 0) {
    const pt = geometry().inset(turnSeat, 20);
    lamp.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
  }
  if (g) {
    const ctx = geometry();
    mode().renderCenter(g, ctx);
    if (g.announce && g.announce.id !== lastAnn) {
      lastAnn = g.announce.id;
      showBubble(g.announce.seat, g.announce.text);
    }
  }
  renderOverlay(g);
}

function renderSeat(pos, p, g) {
  const el = seatEls[pos];
  const plate = g && p ? mode().plate(g, pos) : null;
  el.classList.toggle('empty', !p);
  el.classList.toggle('filled', !!p);
  el.classList.toggle('lost', !!p && !p.connected);
  el.classList.toggle('out', !!plate?.out);
  el.classList.toggle('turn', !!plate?.turn);
  if (plate?.turn) turnSeat = pos;
  el.classList.toggle('joinable', !!g && !p && !!GAMES[session.gameId].midJoin);
  el.querySelector('.name').textContent = p ? p.name : session.gameId === 'euchre' ? `Open seat · ${GAMES.euchre.layout[pos].name}` : 'Open seat';

  const badges = plate ? [...plate.badges] : [];
  if (p && !p.connected) badges.unshift('<span class="badge lost">reconnecting…</span>');
  if (!g && p?.bot) badges.push('<span class="badge">bot</span>');
  el.querySelector('.badges').innerHTML = badges.join('');

  const partner = GAMES[session.gameId].id === 'euchre' ? session.players[(pos + 2) % 4] : null;
  el.querySelector('.meta').innerHTML = plate ? plate.meta
    : p ? (partner !== null ? `<span>Partner: ${partner?.name || '—'}</span>` : '<span>Ready</span>')
      : '<span>Scan the join card to sit here</span>';

  const fan = el.querySelector('.fan');
  const n = plate ? plate.cards : 0;
  if (fan.childElementCount !== n) {
    fan.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const c = cardEl(null, true);
      c.style.transform = `rotate(${(i - (n - 1) / 2) * 5}deg) translateY(${Math.abs(i - (n - 1) / 2) * 0.4}vmin)`;
      fan.appendChild(c);
    }
  }
}

let lastAnn = null;
let turnSeat = -1;
function showBubble(pos, text) {
  const b = seatEls[pos]?.querySelector('.bubble');
  if (!b) return;
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove('show'), 2600);
}

function renderOverlay(g) {
  const ov = $('#overlay');
  const o = g && mode().overlay(g, geometry());
  if (!o) { ov.hidden = true; ov.dataset.key = ''; return; }
  if (ov.dataset.key === o.key) return;
  ov.dataset.key = o.key;
  ov.innerHTML = o.html;
  ov.querySelectorAll('[data-do]').forEach(b => {
    b.onclick = () => {
      if (b.dataset.do === 'again') startGame();
      else if (b.dataset.do === 'lobby') endGame();
      else if (b.dataset.do === 'next') { o.next?.(); update(); }
    };
  });
  ov.hidden = false;
}

// ---------------------------------------------------------------- controls

$('#startBtn').onclick = startGame;
$('#cardSize').value = String(cardScale);
$('#cardSize').oninput = e => {
  cardScale = Number(e.target.value);
  document.documentElement.style.setProperty('--card-scale', cardScale);
  try { localStorage.setItem('pod.cardScale', String(cardScale)); } catch {}
  render();
};

$('#btnOrient').onclick = () => {
  upright = !upright;
  try { localStorage.setItem('syndaris.table.upright', upright ? '1' : '0'); } catch {}
  render();
};
$('#btnFull').onclick = () => {
  const d = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else (d.requestFullscreen || d.webkitRequestFullscreen)?.call(d);
};
$('#btnEnd').onclick = () => { if (confirm('End this game and go back to the lobby?')) endGame(); };
window.addEventListener('resize', () => { drawPrint(); render(); });

$('#btnTool').onclick = () => {
  const tool = mode().tool;
  if (!tool) return;
  tool.toggle(session.settings[session.gameId], session.game);
  renderLobbyInfo();
  update();
};

// Opened from the catalog with ?game=<id>: switch to that game (unless one is being played).
const wanted = new URLSearchParams(location.search).get('game');
if (wanted && GAMES[wanted] && !session.game && wanted !== session.gameId) {
  const oldLayout = info().layout;
  session.gameId = wanted;
  session.players = remapPlayers(session.players, oldLayout, GAMES[wanted].layout);
  save();
}

buildSeats();
renderLobbyInfo();
checkWin(); save();   // a game that finished just before a reload still pays out
render();
automate();
