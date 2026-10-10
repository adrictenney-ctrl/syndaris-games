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
  // a tapered swoosh from (x0,y0) to (x1,y1), bulging by b and thickness t
  const swoosh = (x0, y0, x1, y1, t, b, fill, op = 1) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return `<path d='M${x0} ${y0} C${mx - b} ${my + b * .6} ${mx + b * .4} ${my - t - b * .2} ${x1} ${y1} C${mx + b * .5} ${my + t * .3 - b * .2} ${mx - b * .6} ${my + t + b * .6} ${x0 + t * .6} ${y0} Z' fill='${fill}' opacity='${op}'/>`;
  };
  // flame tongues licking up along a curve
  let tongues = '';
  for (let i = 0; i < 9; i++) {
    const x = 560 + i * 72, y = 330 - i * 30, h = 70 + (i % 3) * 26, w = 46;
    tongues += `<path d='M${x} ${y} C${x + w * .2} ${y - h * .5} ${x + w * .9} ${y - h * .55} ${x + w * 1.25} ${y - h} C${x + w * 1.15} ${y - h * .45} ${x + w * 1.6} ${y - h * .3} ${x + w * 1.7} ${y + 6} Z' fill='url(#tg)' opacity='${.55 + (i % 2) * .25}'/>`;
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='base' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#2b0f4e'/><stop offset='.22' stop-color='#4f1352'/><stop offset='.42' stop-color='#a81c42'/><stop offset='.58' stop-color='#e0242f'/><stop offset='.8' stop-color='#ec3424'/><stop offset='1' stop-color='#ff6a22'/></linearGradient>
    <linearGradient id='o' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='#ff3a2a' stop-opacity='0'/><stop offset='.35' stop-color='#ff4f22'/><stop offset='.75' stop-color='#ff8a1e'/><stop offset='1' stop-color='#ffc23a'/></linearGradient>
    <linearGradient id='y' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='#ffb02a' stop-opacity='0'/><stop offset='.5' stop-color='#ffc53a'/><stop offset='1' stop-color='#fff0a0'/></linearGradient>
    <linearGradient id='r' x1='0' y1='1' x2='1' y2='0'><stop offset='0' stop-color='#7a0f3a' stop-opacity='0'/><stop offset='.5' stop-color='#a5122f'/><stop offset='1' stop-color='#d01c2a'/></linearGradient>
    <linearGradient id='tg' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#ff5a1e'/><stop offset='.6' stop-color='#ffa52a'/><stop offset='1' stop-color='#ffe27a' stop-opacity='.9'/></linearGradient>
    <radialGradient id='glow' cx='.92' cy='.12' r='.55'><stop offset='0' stop-color='#ffd25a' stop-opacity='.85'/><stop offset='.45' stop-color='#ff8a2a' stop-opacity='.35'/><stop offset='1' stop-color='#ff6a2a' stop-opacity='0'/></radialGradient>
    <radialGradient id='dark' cx='.08' cy='.55' r='.6'><stop offset='0' stop-color='#1e0838' stop-opacity='.7'/><stop offset='1' stop-color='#1e0838' stop-opacity='0'/></radialGradient>
    <filter id='soft' x='-10%' y='-10%' width='120%' height='120%'><feGaussianBlur stdDeviation='6'/></filter>
  </defs>
  <rect width='${W}' height='${H}' fill='url(#base)'/>
  <rect width='${W}' height='${H}' fill='url(#dark)'/>
  <path d='M0 -10 L330 -10 L120 ${H + 10} L0 ${H + 10} Z' fill='#24093f' opacity='.45'/>
  <path d='M250 -10 L420 -10 L260 ${H + 10} L150 ${H + 10} Z' fill='#5a1550' opacity='.35'/>
  ${swoosh(300, 400, 1230, -40, 150, 120, 'url(#r)', .75)}
  ${swoosh(420, 420, 1240, 30, 120, 90, 'url(#o)', .95)}
  <g filter='url(#soft)'>${tongues}</g>
  ${tongues}
  ${swoosh(560, 420, 1240, 110, 60, 70, 'url(#y)', .95)}
  ${swoosh(820, 420, 1240, 250, 34, 40, 'url(#y)', 1)}
  ${swoosh(640, 420, 1240, 330, 22, 30, '#ffe066', .8)}
  ${swoosh(700, 420, 1240, 210, 40, 50, 'url(#o)', .85)}
  ${swoosh(380, -30, 1230, 330, 80, -90, 'url(#r)', .45)}
  <rect width='${W}' height='${H}' fill='url(#glow)'/>
  <path d='M470 400 C640 280 860 200 1230 40' fill='none' stroke='#fff4c0' stroke-opacity='.55' stroke-width='3'/>
  <path d='M600 400 C760 300 930 230 1230 140' fill='none' stroke='#fff' stroke-opacity='.35' stroke-width='2'/>
  <path d='M420 -20 C620 90 820 130 1230 90' fill='none' stroke='#ffb85a' stroke-opacity='.35' stroke-width='2.5'/>
  <path d='M1110 30 l42 42 -42 42 -42 -42z' fill='none' stroke='#b06cff' stroke-opacity='.7' stroke-width='8' stroke-linejoin='round'/>
  <path d='M1110 30 l42 42 -42 42 -42 -42z' fill='#8a3ae0' fill-opacity='.25'/>
  <path d='M700 52 l18 -6 -6 22z' fill='#ffb02a'/><rect x='640' y='300' width='16' height='16' fill='#e8262e' transform='rotate(20 648 308)'/>
  <path d='M1040 300 l30 -14 -10 34z' fill='#ffc23a'/><path d='M560 120 l14 -4 -4 16z' fill='#ff8a2a' opacity='.9'/>
  <rect x='1000' y='70' width='12' height='12' fill='#e8262e' transform='rotate(-15 1006 76)'/><path d='M860 330 l22 -8 -6 26z' fill='#ffd24a' opacity='.9'/>
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
