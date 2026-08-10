#!/usr/bin/env node
'use strict';

// 命令行演示：
//   node cli.js "所问之事"                      电脑随机摇卦
//   node cli.js "所问之事" 2,2,2,0,1,1          真实铜钱摇卦（六次的字面数，初爻到上爻）
const { cast } = require('./liuyao.js');

const question = process.argv[2];
if (!question) {
  console.log('用法: node cli.js "所问之事" [六次字面数,如 2,2,2,0,1,1]');
  process.exit(1);
}

const input = { question, method: 'random' };
if (process.argv[3]) {
  input.method = 'coins';
  input.tosses = process.argv[3].split(',').map(Number);
}

const r = cast(input);
const MARK = { 6: '× 老阴·动', 7: '─ 少阳', 8: '╌ 少阴', 9: '○ 老阳·动' };

console.log(`\n所问：${r.question}`);
console.log(`占时：${r.time}　月建：${r.yueJian}　日辰：${r.riChen}　旬空：${r.xunKong.join('、')}`);
console.log(`本卦：${r.benGua.name}（${r.benGua.gong}，${r.benGua.gongWuXing}）${r.bianGua ? '　变卦：' + r.bianGua.name : '　无动爻'}\n`);
for (const y of [...r.yao].reverse()) {
  const shiYing = y.shiYing ? `〔${y.shiYing}〕` : '　　';
  const bian = y.bianGanZhi ? `　→ 变 ${y.bianGanZhi.ganZhi}·${y.bianGanZhi.liuQin}` : '';
  console.log(`${y.pos}爻　${MARK[y.val]}　${y.liuShen}　${y.liuQin} ${y.ganZhi}（${y.wuXing}）${shiYing}${bian}`);
}
console.log();
