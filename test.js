'use strict';

const assert = require('assert');
const { cast } = require('./liuyao.js');

const result = cast({
  method: 'coins',
  tosses: [2, 2, 2, 0, 1, 1], // 字面数；按背为阳口径得爻值 [7,7,7,9,8,8]，初爻到上爻
  question: '验收装卦',
  time: '2026-01-01T12:00:00+08:00'
});

assert.equal(result.benGua.name, '雷天大壮');
assert.equal(result.benGua.gong, '坤宫');
assert.equal(result.benGua.gongWuXing, '土');
assert.equal(result.bianGua.name, '地天泰');
assert.deepEqual(result.yao.filter(y => y.dong).map(y => y.pos), [4]);
assert.equal(result.yao.find(y => y.shiYing === '世').pos, 4);
assert.equal(result.yao.find(y => y.shiYing === '应').pos, 1);
assert.deepEqual(result.yao.slice(0, 3).map(y => y.ganZhi), ['甲子','甲寅','甲辰']);
assert.deepEqual(result.yao.slice(3).map(y => y.ganZhi), ['庚午','庚申','庚戌']);

console.log('装卦断言全部通过');
console.log(JSON.stringify({
  benGua: result.benGua,
  bianGua: result.bianGua,
  dongYao: result.yao.filter(y => y.dong).map(y => y.pos),
  shi: result.yao.find(y => y.shiYing === '世').pos,
  ying: result.yao.find(y => y.shiYing === '应').pos,
  neiGuaNaJia: result.yao.slice(0, 3).map(y => y.ganZhi),
  waiGuaNaJia: result.yao.slice(3).map(y => y.ganZhi)
}, null, 2));
