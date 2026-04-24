import assert from 'assert';
import { listPersonaPacks, listSkillPacks } from '../src/packs/packLoader.js';

const p = listPersonaPacks();
assert.ok(Array.isArray(p.packs));
const design = p.packs.find((x) => x.pack_id === 'design-interiors');
assert.ok(design, 'design-interiors pack');
assert.ok(Array.isArray(design.persona_ids));

const s = listSkillPacks();
assert.ok(Array.isArray(s.packs));

console.log('pack_loader test OK');
