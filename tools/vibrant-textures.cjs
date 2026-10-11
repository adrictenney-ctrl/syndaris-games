// Builds the Vibrant texture variables and puts them into css/vibrant.css between markers.
const fs = require('fs');
const uri = svg => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')}")`;

// fine film grain: grey noise, used with blend-mode overlay (lightens and darkens)
const grain = `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 .4'/></filter><rect width='180' height='180' filter='url(#n)'/></svg>`;
// a lighter/darker speckle for printed surfaces
const speck = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncA type='table' tableValues='.0 .0 .18 .0 .0 .22 0'/></feComponentTransfer></filter><rect width='160' height='160' filter='url(#n)'/></svg>`;
// soft mottled clouds, like the back of the reference picture
const mottle = `<svg xmlns='http://www.w3.org/2000/svg' width='700' height='700'><filter id='m' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='0.005714286' numOctaves='4' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 1  0 0 .85 0 -.47'/></filter><rect width='700' height='700' filter='url(#m)'/></svg>`;
const mottleDark = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><filter id='m' x='0' y='0' width='1' height='1'><feTurbulence type='fractalNoise' baseFrequency='0.00375' numOctaves='3' seed='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .02  0 0 0 0 .01  0 0 0 0 .12  1.2 0 0 0 -.5'/></filter><rect width='800' height='800' filter='url(#m)'/></svg>`;
// big faint dice and cards, like the reference background
const doodles = `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='520' fill='none' stroke='#fff' stroke-width='4' stroke-linejoin='round'><g opacity='.06'>
<g transform='rotate(-16 90 110)'><rect x='45' y='50' width='90' height='124' rx='12'/><path d='M90 95l12 17-12 17-12-17z'/></g>
<g transform='rotate(20 380 120)'><rect x='330' y='70' width='100' height='100' rx='20'/><circle cx='355' cy='95' r='8' fill='#fff'/><circle cx='380' cy='120' r='8' fill='#fff'/><circle cx='405' cy='145' r='8' fill='#fff'/></g>
<g transform='rotate(12 400 400)'><rect x='355' y='338' width='90' height='124' rx='12'/><path d='M400 384c-13-15-30 3-16 15l16 15 16-15c14-12-3-30-16-15z'/></g>
<g transform='rotate(-24 120 400)'><rect x='75' y='355' width='92' height='92' rx='18'/><circle cx='97' cy='377' r='7.5' fill='#fff'/><circle cx='145' cy='377' r='7.5' fill='#fff'/><circle cx='97' cy='425' r='7.5' fill='#fff'/><circle cx='145' cy='425' r='7.5' fill='#fff'/></g>
<path d='M250 250l9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3z'/>
<path d='M230 470l14-14m-14 0l14 14M470 260l14-14m-14 0l14 14' stroke-linecap='round'/>
</g></svg>`;
// printed facets: shards of lighter and darker colour, like the backgrounds in the reference tiles
const facet = (seed) => {
  const shapes = [
    ['0,0 210,0 70,170', '#fff', .08], ['210,0 420,0 300,140', '#000', .08], ['420,0 600,0 600,180 520,90', '#fff', .06],
    ['70,170 300,140 170,400 0,400 0,240', '#000', .06], ['300,140 600,180 500,400', '#fff', .09], ['170,400 300,140 500,400', '#000', .05],
    ['0,0 70,170 0,240', '#fff', .04], ['520,90 600,180 300,140', '#000', .04], ['500,400 600,180 600,400', '#000', .07],
  ];
  const flip = seed === 1 ? `transform='translate(600 0) scale(-1 1)'` : seed === 2 ? `transform='translate(0 400) scale(1 -1)'` : '';
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' preserveAspectRatio='none'><g ${flip}>${shapes.map(([p, c, o]) => `<polygon points='${p}' fill='${c}' fill-opacity='${o}'/>`).join('')}</g></svg>`;
};
// confetti for the spotlight banner
const confetti = (() => {
  let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const cols = ['#ffd84a', '#ff5fae', '#4ad6ff', '#7cf5b8', '#ffffff', '#ff9d3c'];
  let out = '';
  for (let i = 0; i < 26; i++) {
    const x = (r() * 600).toFixed(0), y = (r() * 400).toFixed(0), a = (r() * 360).toFixed(0), c = cols[i % cols.length], k = r();
    out += k < .45 ? `<rect x='${x}' y='${y}' width='14' height='6' rx='2' fill='${c}' transform='rotate(${a} ${x} ${y})'/>`
      : k < .8 ? `<path d='M${x} ${y} l9 -15 l9 15z' fill='${c}' transform='rotate(${a} ${x} ${y})'/>`
      : `<circle cx='${x}' cy='${y}' r='4' fill='${c}'/>`;
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' opacity='.8'>${out}</svg>`;
})();


// Flowing wavy bands, like the swooshes behind the reference tiles and banner. A band runs from
// lower left to upper right between two S-curves. [y, thickness, colour, opacity]
const band = (y, t, tilt = 170, amp = 46) => {
  const a = `M-30 ${y} C170 ${y - amp - tilt * .33} 400 ${y + amp - tilt * .66} 630 ${y - tilt}`;
  const b = `L630 ${y - tilt + t} C400 ${y + amp - tilt * .66 + t * 1.25} 170 ${y - amp - tilt * .33 + t * .8} -30 ${y + t} Z`;
  return a + ' ' + b;
};
const line = (y, tilt = 170, amp = 46) => `M-30 ${y} C170 ${y - amp - tilt * .33} 400 ${y + amp - tilt * .66} 630 ${y - tilt}`;
const WAVES = [[70, 46, '#000', .1], [150, 70, '#fff', .15], [250, 34, '#000', .1], [330, 96, '#fff', .11], [440, 60, '#000', .09], [560, 80, '#fff', .1]];
const waves = (seed) => {
  const flip = seed === 1 ? `transform='translate(600 0) scale(-1 1)'` : seed === 2 ? `transform='translate(0 60)'` : '';
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' preserveAspectRatio='none'><g ${flip}>${WAVES.map(([y, t, c, o]) => `<path d='${band(y, t)}' fill='${c}' fill-opacity='${o}'/>`).join('')}<path d='${line(205)}' fill='none' stroke='#fff' stroke-opacity='.24' stroke-width='3'/><path d='${line(400)}' fill='none' stroke='#fff' stroke-opacity='.1' stroke-width='2'/></g></svg>`;
};
// the spotlight banner: warm swooshes of colour over red, like the reference banner
const wavesSpot = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400' preserveAspectRatio='none'>
  <path d='${band(40, 120, 200, 60)}' fill='#7a1a6a' fill-opacity='.6'/>
  <path d='${band(200, 70, 200, 60)}' fill='#ff6a2e' fill-opacity='.7'/>
  <path d='${band(290, 46, 200, 60)}' fill='#ffad2e' fill-opacity='.55'/>
  <path d='${band(360, 60, 200, 60)}' fill='#ff6a2e' fill-opacity='.45'/>
  <path d='${band(470, 140, 200, 60)}' fill='#a3164a' fill-opacity='.55'/>
  <path d='${line(180, 200, 60)}' fill='none' stroke='#fff' stroke-opacity='.25' stroke-width='3'/>
  <path d='${line(345, 200, 60)}' fill='none' stroke='#fff' stroke-opacity='.18' stroke-width='2'/>
</svg>`;
// the header: quiet waves in the room's own colours
const wavesBar = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 100' preserveAspectRatio='none'>
  <path d='M-10 70 C150 30 300 100 610 20 V-10 H-10 Z' fill='#fff' fill-opacity='.05'/>
  <path d='M-10 100 C200 60 380 110 610 50 V110 H-10 Z' fill='#000' fill-opacity='.18'/>
  <path d='M-10 62 C160 24 310 92 610 14' fill='none' stroke='#fff' stroke-opacity='.1' stroke-width='1.5'/>
</svg>`;


// The spotlight banner, after the reference: deep plum on the left running into red, then flame
// swooshes of orange and yellow sweeping up to the right, light streaks, a glow in the top corner.
const fire = (() => {
  const W = 1200, H = 360;
  // A streak of fire: a smooth band that sweeps from the lower middle up to the top right.
  const streak = (x0, y0, x1, y1, t, bend, fill, op) => {
    const c1x = x0 + (x1 - x0) * .35, c1y = y0 - bend, c2x = x0 + (x1 - x0) * .7, c2y = y1 + bend * .55;
    return `<path d='M${x0} ${y0} C${c1x} ${c1y} ${c2x} ${c2y} ${x1} ${y1} L${x1} ${y1 + t} C${c2x} ${c2y + t * 1.35} ${c1x + 10} ${c1y + t * 1.6} ${x0 + t * .9} ${y0} Z' fill='${fill}' opacity='${op}'/>`;
  };
  const cols = ['#c0142e', '#ff4421', '#ff7a1c', '#ffb22a', '#e8222c', '#ff9a24', '#ffd04a', '#d81c2c', '#ff6a1e', '#ffc23a', '#ff5420', '#ffe27a'];
  let streaks = '';
  for (let k = 0; k < 12; k++) {
    const x0 = 360 + k * 62, y0 = 400, x1 = 1240, y1 = -40 + k * 34, t = 16 + ((k * 7) % 5) * 9, bend = 70 + (k % 3) * 30;
    streaks += streak(x0, y0, x1, y1, t, bend, cols[k], (.62 + (k % 4) * .1).toFixed(2));
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='base' x1='0' y1='0' x2='1' y2='.15'><stop offset='0' stop-color='#33103f'/><stop offset='.2' stop-color='#4a1243'/><stop offset='.38' stop-color='#8c1640'/><stop offset='.55' stop-color='#d01e34'/><stop offset='.75' stop-color='#ec3a26'/><stop offset='1' stop-color='#ff7a24'/></linearGradient>
    <radialGradient id='glowTR' cx='.95' cy='.02' r='.5'><stop offset='0' stop-color='#ff9a7a' stop-opacity='.85'/><stop offset='.5' stop-color='#ff6a4a' stop-opacity='.35'/><stop offset='1' stop-color='#ff5a3a' stop-opacity='0'/></radialGradient>
    <radialGradient id='glowBR' cx='.98' cy='1' r='.45'><stop offset='0' stop-color='#ffd04a' stop-opacity='.95'/><stop offset='.5' stop-color='#ffa02a' stop-opacity='.45'/><stop offset='1' stop-color='#ff8a2a' stop-opacity='0'/></radialGradient>
    <radialGradient id='plum' cx='.1' cy='.5' r='.55'><stop offset='0' stop-color='#260a36' stop-opacity='.65'/><stop offset='1' stop-color='#260a36' stop-opacity='0'/></radialGradient>
    <filter id='glow' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='14'/></filter>
  </defs>
  <rect width='${W}' height='${H}' fill='url(#base)'/>
  <rect width='${W}' height='${H}' fill='url(#plum)'/>
  <path d='M150 -10 L235 -10 L85 ${H + 10} L0 ${H + 10} Z' fill='#b06cd8' opacity='.1'/>
  <path d='M300 -10 L340 -10 L210 ${H + 10} L170 ${H + 10} Z' fill='#b06cd8' opacity='.06'/>
  <g filter='url(#glow)' opacity='.8'>${streaks}</g>
  ${streaks}
  <rect width='${W}' height='${H}' fill='url(#glowTR)'/>
  <rect width='${W}' height='${H}' fill='url(#glowBR)'/>
  <path d='M520 400 C700 300 900 230 1240 60' fill='none' stroke='#fff3c4' stroke-opacity='.5' stroke-width='3'/>
  <path d='M700 400 C840 330 1000 270 1240 200' fill='none' stroke='#fff' stroke-opacity='.3' stroke-width='2'/>
  <path d='M1110 22 L1160 72 L1110 122 L1060 72 Z' fill='#9a6ae0' fill-opacity='.35' stroke='#c9a0ff' stroke-opacity='.75' stroke-width='7' stroke-linejoin='round'/>
  <path d='M478 66 l30 -10 -8 34 z' fill='#ffb02a'/>
  <path d='M440 262 l44 -18 -10 52 z' fill='#ffa62a'/>
  <path d='M1092 300 l52 -22 -14 60 z' fill='#ffbf2e'/>
  <path d='M1040 250 l26 -10 -6 28 z' fill='#ffcf4a' opacity='.9'/>
  <rect x='410' y='190' width='16' height='16' rx='2' fill='#e2242e' transform='rotate(22 418 198)'/>
  <rect x='1000' y='64' width='14' height='14' rx='2' fill='#e2242e' transform='rotate(-14 1007 71)'/>
  <rect x='760' y='34' width='10' height='10' rx='2' fill='#ff8a2a' transform='rotate(30 765 39)'/>
  <path d='M610 330 l20 -6 -4 22 z' fill='#ffd24a' opacity='.85'/>
</svg>`;
})();

const block = `  /* @tex — generated textures (tools/vibrant-textures.cjs) */
  --v-grain: ${uri(grain)};
  --v-speck: ${uri(speck)};
  --v-mottle: ${uri(mottle)};
  --v-mottle-dark: ${uri(mottleDark)};
  --v-doodles: ${uri(doodles)};
  --v-facet-0: ${uri(facet(0))};
  --v-facet-1: ${uri(facet(1))};
  --v-facet-2: ${uri(facet(2))};
  --v-confetti: ${uri(confetti)};
  --v-waves-0: ${uri(waves(0))};
  --v-waves-1: ${uri(waves(1))};
  --v-waves-2: ${uri(waves(2))};
  --v-waves-spot: ${uri(wavesSpot)};
  --v-fire-spot: ${uri(fire)};
  --v-waves-bar: ${uri(wavesBar)};
  /* @tex-end */`;

const f = 'css/vibrant.css';
let css = fs.readFileSync(f, 'utf8');
if (css.includes('/* @tex')) css = css.replace(/  \/\* @tex[\s\S]*?@tex-end \*\//, block);
else css = css.replace(/  \/\* faint doodles[^\n]*\n  --v-doodles: [^\n]*\n/, block + '\n');
if (!css.includes('@tex-end')) throw new Error('not inserted');
fs.writeFileSync(f, css);
console.log('ok', block.length);
