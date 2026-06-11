const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

const GREEN = '#23A455', DARK = '#1B8A46';
// White leaf with veins; `bg` optional rounded green field; `scale` for safe-zones.
const leaf = (stroke) => `
  <path d="M512 196 C 326 300 300 604 512 828 C 724 604 698 300 512 196 Z" fill="#ffffff"/>
  <path d="M512 300 L512 766" stroke="${stroke}" stroke-width="26" stroke-linecap="round"/>
  <path d="M512 452 L606 392" stroke="${stroke}" stroke-width="22" stroke-linecap="round"/>
  <path d="M512 548 L418 488" stroke="${stroke}" stroke-width="22" stroke-linecap="round"/>
  <path d="M512 632 L596 584" stroke="${stroke}" stroke-width="22" stroke-linecap="round"/>`;

const svgIcon = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="224" fill="${GREEN}"/>${leaf(GREEN)}</svg>`;

const svgAdaptive = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512 512) scale(0.66) translate(-512 -512)">${leaf(GREEN).replace(/#ffffff/g, '#ffffff')}
  <path d="M512 196 C 326 300 300 604 512 828 C 724 604 698 300 512 196 Z" fill="${GREEN}" opacity="0"/></g></svg>`;

// adaptive foreground: white leaf on transparent (background colour set in app.json)
const svgAdaptiveFg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512 512) scale(0.62) translate(-512 -512)">${leaf(GREEN)}</g></svg>`;

const svgSplash = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(512 512) scale(0.7) translate(-512 -512)">${leaf(GREEN)}</g></svg>`;

// Notification icon: white silhouette on transparent (Android tints it).
const svgNotif = `<svg width="96" height="96" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <path d="M512 196 C 326 300 300 604 512 828 C 724 604 698 300 512 196 Z" fill="#ffffff"/></svg>`;

const render = (svg, w, out) => {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng();
  fs.writeFileSync(`assets/${out}`, png);
  console.log('  wrote assets/' + out, png.length + 'b');
};

render(svgIcon, 1024, 'icon.png');
render(svgAdaptiveFg, 1024, 'adaptive-icon.png');
render(svgSplash, 1024, 'splash.png');
render(svgIcon, 48, 'favicon.png');
render(svgNotif, 96, 'notification-icon.png');
console.log('done');
