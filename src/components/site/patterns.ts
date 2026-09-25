/**
 * Stencil tiles shared by the marketing and auth pages: small inline SVG
 * repeats used as `backgroundImage`. Each draws in `currentColor`, so the
 * host element's text colour and opacity set the ink.
 */

/** Wrap an SVG string as a CSS `url("data:...")` value. */
export function tile(svg: string) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** Asanoha: six-pointed hemp-leaf star on a hexagonal lattice. Tile is 56 x 97. */
export const ASANOHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z'/>
<path d='M28 0 L28 64 M0 16 L56 48 M56 16 L0 48'/>
<path d='M28 32 L56 16 M28 32 L0 16 M28 32 L0 48 M28 32 L56 48 M28 32 L28 0 M28 32 L28 64'/>
<path d='M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z' transform='translate(0,-16)'/>
<path d='M0 48 L28 64 M56 48 L28 64'/>
<path d='M0 80 L28 64 L56 80 M28 64 L28 97'/>
</g></svg>`);

/** Komon: offset grid of tiny punched dots. Tile is 16 x 16. */
export const KOMON = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>
<g fill='currentColor'><circle cx='4' cy='4' r='1.2'/><circle cx='12' cy='12' r='1.2'/></g></svg>`);

/** Seigaiha: overlapping concentric arcs, the "blue sea waves" repeat. Tile is 80 x 40. */
export const SEIGAIHA = tile(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='40' viewBox='0 0 80 40'>
<g fill='none' stroke='currentColor' stroke-width='1'>
<path d='M0 40 a40 40 0 0 1 80 0'/><path d='M8 40 a32 32 0 0 1 64 0'/><path d='M16 40 a24 24 0 0 1 48 0'/><path d='M24 40 a16 16 0 0 1 32 0'/>
<path d='M-40 20 a40 40 0 0 1 80 0' /><path d='M-32 20 a32 32 0 0 1 64 0'/><path d='M-24 20 a24 24 0 0 1 48 0'/><path d='M-16 20 a16 16 0 0 1 32 0'/>
<path d='M40 20 a40 40 0 0 1 80 0' /><path d='M48 20 a32 32 0 0 1 64 0'/><path d='M56 20 a24 24 0 0 1 48 0'/><path d='M64 20 a16 16 0 0 1 32 0'/>
</g></svg>`);
