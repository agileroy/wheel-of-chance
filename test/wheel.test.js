import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { colorsFor, targetRotation } from '../public/wheel.js';

/** Index du segment sous le pointeur pour une rotation donnée. */
function segmentUnderPointer(rotation, count) {
  const angle = (((-rotation) % 360) + 360) % 360;
  return Math.floor(angle / (360 / count));
}

describe('roue', () => {
  it('s\'arrête toujours sur le segment tiré', () => {
    for (let count = 1; count <= 10; count++) {
      let rotation = 0;
      for (let trial = 0; trial < 200; trial++) {
        const index = trial % count;
        const next = targetRotation(rotation, index, count);
        assert.ok(next >= rotation + 6 * 360, 'la roue fait au moins six tours');
        assert.equal(segmentUnderPointer(next, count), index);
        rotation = next;
      }
    }
  });

  it('s\'arrête sur le segment même aux extrêmes de l\'aléa', () => {
    for (const r of [0, 0.999999]) {
      const rot = targetRotation(123, 3, 7, { random: () => r });
      assert.equal(segmentUnderPointer(rot, 7), 3);
    }
  });

  it('donne une couleur différente à deux segments voisins', () => {
    for (let count = 2; count <= 12; count++) {
      const colors = colorsFor(count);
      for (let i = 0; i < count; i++) {
        assert.notEqual(colors[i], colors[(i + 1) % count], `${count} segments, voisins ${i}`);
      }
    }
  });
});
