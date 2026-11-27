/** Text-only SSR inspection; never creates a DOM or computes expected semantic values. */
export function readSelectSurfaceSSR(html: string) {
  return { rootPresent: /class="[^"]*\bsurface-control\b/.test(html),
    popupPresent: /class="[^"]*\bant-select-dropdown\b/.test(html),
    prefixPresent: /data-surface-node="prefix"/.test(html),
    authoredClasses: [...html.matchAll(/class="([^"]*)"/g)].flatMap(match => match[1].split(/\s+/).filter(name => name.startsWith('surface-'))),
    leakedAttributes: [...html.matchAll(/\s(popuprender|classnames|styles|components)=/gi)].map(match => match[1]) };
}
