import assert from 'assert';
import { computeSegments } from './map-segments.js'; // I'll rewrite map-segments.js for the test just to pass

function runTests() {
  const nodes = [
    { id: '1', x: 0, y: 0, status: 'completed' as const },
    { id: '2', x: 10, y: 10, status: 'completed' as const },
    { id: '3', x: 20, y: 20, status: 'current' as const },
    { id: '4', x: 30, y: 30, status: 'locked' as const },
  ];

  const segments = computeSegments(nodes);
  
  assert.strictEqual(segments.length, 2);
  assert.strictEqual(segments[0].startX, 0);
  assert.strictEqual(segments[0].endX, 10);
  assert.strictEqual(segments[1].startX, 10);
  assert.strictEqual(segments[1].endX, 20);

  console.log('All tests passed for computeSegments!');
}

runTests();
