const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({});
vm.runInContext(script + '\nthis.app = { STEPS, S };', context);
const { STEPS, S } = context.app;

function tangentReadout(step, degrees) {
  const state = { ...S, theta: degrees * Math.PI / 180 };
  const html = STEPS[step - 1].readout(state);
  return html.match(/<span class="c-tan">tan θ(?: = sin ÷ cos)?<\/span><span>([^<]+)<\/span>/)[1];
}

for (const step of [1, 13, 14]) {
  test(`Step ${step}: nearby angles have finite tangent values`, () => {
    for (const degrees of [89, 89.5, 89.999, 90.001, 90.5, 91, 269, 269.999, 270.001, 271]) {
      const expected = Math.tan(degrees * Math.PI / 180).toFixed(2).replace('-', '−');
      assert.equal(tangentReadout(step, degrees), expected, `${degrees}°`);
    }
  });
  test(`Step ${step}: tangent is undefined at 90° and 270°`, () => {
    for (const degrees of [90, 270]) assert.equal(tangentReadout(step, degrees), 'undefined');
  });
}

test('Tangent diagrams distinguish off-chart intersections from parallel lines', () => {
  for (const degrees of [89, 89.999, 90, 90.001, 91, 269, 270, 271]) {
    const state = { ...S, theta: degrees * Math.PI / 180 };
    const undefinedAngle = degrees === 90 || degrees === 270;
    const diagram = STEPS[12].draw(state, 1);
    assert.equal(diagram.includes('they never meet'), undefinedAngle, `${degrees}°`);
    assert.equal(diagram.includes('off the chart'), !undefinedAngle, `${degrees}°`);
    for (const step of [1, 13, 14]) {
      assert.doesNotMatch(STEPS[step - 1].draw(state, 1), /NaN|Infinity/);
    }
  }
});
