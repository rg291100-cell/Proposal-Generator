const fs = require('fs');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="100" height="60">
  <path d="M 30,60 Q 100,10 180,50" fill="none" stroke="url(#topGrad)" stroke-width="8" stroke-linecap="round"/>
  <path d="M 20,70 Q 100,110 170,60" fill="none" stroke="url(#botGrad)" stroke-width="8" stroke-linecap="round"/>
  <circle cx="100" cy="60" r="28" fill="url(#irisGrad)"/>
  <circle cx="100" cy="60" r="12" fill="#000000"/>
  <circle cx="95" cy="55" r="3" fill="#ffffff" opacity="0.8"/>
  <defs>
    <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
      <stop offset="40%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#60a5fa" />
    </radialGradient>
  </defs>
</svg>`;
console.log('data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64'));
