import { readFileSync, writeFileSync, existsSync } from 'fs';
// Needs lucide-preact installed temporarily: npm i --no-save lucide-preact
const dir = 'node_modules/lucide-preact/dist/esm/icons/';
const wanted = {
  check: 'check',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  'arrow-left': 'arrow-left',
  'arrow-down': 'arrow-down',
  'arrow-up': 'arrow-up',
  upload: 'upload',
  download: 'download',
  'file-archive': 'file-archive',
  images: 'images',
  image: 'image',
  'shield-check': 'shield-check',
  zap: 'zap',
  layers: 'layers',
  sparkles: 'sparkles',
  minus: 'minus',
  plus: 'plus',
  'rotate-cw': 'rotate-cw',
  contrast: 'contrast',
  grid: 'grid-3x3',
  x: 'x',
  scaling: 'scaling',
  palette: 'palette',
  info: 'info',
  alert: 'circle-alert',
  'wifi-off': 'wifi-off',
  smartphone: 'smartphone',
  'folder-tree': 'folder-tree',
  'clipboard-paste': 'clipboard-paste',
  list: 'list',
  'refresh-cw': 'refresh-cw',
  'chevrons-left-right': 'chevrons-left-right',
  'chevrons-up-down': 'chevrons-up-down',
  cookie: 'cookie',
  sliders: 'sliders-horizontal',
  'circle-check': 'circle-check',
  lock: 'lock',
  gauge: 'gauge',
  maximize: 'maximize-2',
  'square-dashed': 'square-dashed',
  'file-image': 'file-image',
  heart: 'heart',
  feather: 'feather',
  scan: 'scan',
  search: 'zoom-in',
  'search-minus': 'zoom-out',
};
const out = {};
for (const [name, file] of Object.entries(wanted)) {
  const p = dir + file + '.mjs';
  if (!existsSync(p)) {
    console.error('missing', file);
    continue;
  }
  const src = readFileSync(p, 'utf8');
  const m = /const __iconData = (\{[\s\S]*?\n\});/.exec(src);
  const node = eval('(' + m[1] + ')').node.map(([tag, attrs]) => {
    const { key, ...rest } = attrs;
    return [tag, rest];
  });
  out[name] = node;
}
writeFileSync(
  'src/shared/icons/data.ts',
  '// Generated from lucide-preact (ISC license). Re-run `node tools/gen-icons.mjs` to add icons.\n' +
    'export const iconData = ' +
    JSON.stringify(out, null, 0).replace(/\],"/g, '],\n  "') +
    ' as const;\n\n' +
    'export type IconName = keyof typeof iconData;\n',
);
console.log(Object.keys(out).length, 'icons');
