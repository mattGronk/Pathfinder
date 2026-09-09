import test from 'node:test';
import assert from 'node:assert/strict';
import {responseChartData} from '../src/lib/chart-data.ts';
test('saved counts stay exact and are not relabelled as match percentages', () => {
  const rows = responseChartData([{key:'a',label:'Analytical',count:7},{key:'c',label:'Creative',count:5},{key:'s',label:'People',count:4}],16);
  assert.deepEqual(rows.map(r=>r.responses), [7,5,4]); assert.equal(rows[0].label, 'Analytical');
});
test('empty or inconsistent response data does not produce a misleading chart', () => {
  for (const count of [NaN,Infinity,-1,1.5,17]) assert.deepEqual(responseChartData([{key:'a',label:'A',count}],16), []);
  assert.deepEqual(responseChartData([{key:'a',label:'A',count:1}],0), []);
  assert.deepEqual(responseChartData([{key:'a',label:'A',count:10},{key:'b',label:'B',count:10}],16), []);
  assert.deepEqual(responseChartData([{key:'a',label:'A',count:1},{key:'a',label:'A',count:2}],16), []);
});
test('zero counts are omitted without changing the original labels or denominator', () => {
  assert.deepEqual(responseChartData([{key:'a',label:'A',count:0},{key:'b',label:'B',count:2}],5),
    [{key:'b',label:'B',responses:2,rank:'01'}]);
  assert.deepEqual(responseChartData([{key:'a',label:'A',count:0}],5), []);
});
