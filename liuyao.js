'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ZHI_WUXING = { 子:'水',亥:'水',寅:'木',卯:'木',巳:'火',午:'火',申:'金',酉:'金',辰:'土',戌:'土',丑:'土',未:'土' };
const GONG_WUXING = { 乾:'金',坎:'水',艮:'土',震:'木',巽:'木',离:'火',坤:'土',兑:'金' };

// 初爻到上爻：1 为阳、0 为阴。键按“下卦三爻 + 上卦三爻”。
const TRIGRAMS = {
  '111':'乾', '010':'坎', '001':'艮', '100':'震',
  '011':'巽', '101':'离', '000':'坤', '110':'兑'
};
const TRIGRAM_SYMBOL = { 乾:'天',坎:'水',艮:'山',震:'雷',巽:'风',离:'火',坤:'地',兑:'泽' };

// framework.md 2.2 八宫六十四卦表；数组位置同时决定世次。
const PALACES = {
  乾:['乾为天','天风姤','天山遁','天地否','风地观','山地剥','火地晋','火天大有'],
  坎:['坎为水','水泽节','水雷屯','水火既济','泽火革','雷火丰','地火明夷','地水师'],
  艮:['艮为山','山火贲','山天大畜','山泽损','火泽睽','天泽履','风泽中孚','风山渐'],
  震:['震为雷','雷地豫','雷水解','雷风恒','地风升','水风井','泽风大过','泽雷随'],
  巽:['巽为风','风天小畜','风火家人','风雷益','天雷无妄','火雷噬嗑','山雷颐','山风蛊'],
  离:['离为火','火山旅','火风鼎','火水未济','山水蒙','风水涣','天水讼','天火同人'],
  坤:['坤为地','地雷复','地泽临','地天泰','雷天大壮','泽天夬','水天需','水地比'],
  兑:['兑为泽','泽水困','泽地萃','泽山咸','水山蹇','地山谦','雷山小过','雷泽归妹']
};
const HEX_INFO = {};
for (const [gong, names] of Object.entries(PALACES)) {
  names.forEach((name, palaceIndex) => { HEX_INFO[name] = { gong, palaceIndex }; });
}
const SHI_BY_INDEX = [6,1,2,3,4,5,4,3];

// framework.md 2.3 纳甲全表，严格分内卦/外卦。
const NAJIA = {
  乾:{ inner:['甲子','甲寅','甲辰'], outer:['壬午','壬申','壬戌'] },
  坎:{ inner:['戊寅','戊辰','戊午'], outer:['戊申','戊戌','戊子'] },
  艮:{ inner:['丙辰','丙午','丙申'], outer:['丙戌','丙子','丙寅'] },
  震:{ inner:['庚子','庚寅','庚辰'], outer:['庚午','庚申','庚戌'] },
  巽:{ inner:['辛丑','辛亥','辛酉'], outer:['辛未','辛巳','辛卯'] },
  离:{ inner:['己卯','己丑','己亥'], outer:['己酉','己未','己巳'] },
  坤:{ inner:['乙未','乙巳','乙卯'], outer:['癸丑','癸亥','癸酉'] },
  兑:{ inner:['丁巳','丁卯','丁丑'], outer:['丁亥','丁酉','丁未'] }
};

const LIUSHEN = {
  甲:['青龙','朱雀','勾陈','螣蛇','白虎','玄武'], 乙:['青龙','朱雀','勾陈','螣蛇','白虎','玄武'],
  丙:['朱雀','勾陈','螣蛇','白虎','玄武','青龙'], 丁:['朱雀','勾陈','螣蛇','白虎','玄武','青龙'],
  戊:['勾陈','螣蛇','白虎','玄武','青龙','朱雀'],
  己:['螣蛇','白虎','玄武','青龙','朱雀','勾陈'],
  庚:['白虎','玄武','青龙','朱雀','勾陈','螣蛇'], 辛:['白虎','玄武','青龙','朱雀','勾陈','螣蛇'],
  壬:['玄武','青龙','朱雀','勾陈','螣蛇','白虎'], 癸:['玄武','青龙','朱雀','勾陈','螣蛇','白虎']
};

// 香港天文台《公历与农历日期对照表》2025、2026、2027 年版（weather.gov.hk）。
// framework.md 2.8 指定的十二“节”换月；需求只需精确到日，日期均按 Asia/Shanghai。
const JIE_DATES = {
  2025:{ 小寒:'01-05',立春:'02-03',惊蛰:'03-05',清明:'04-04',立夏:'05-05',芒种:'06-05',小暑:'07-07',立秋:'08-07',白露:'09-07',寒露:'10-08',立冬:'11-07',大雪:'12-07' },
  2026:{ 小寒:'01-05',立春:'02-04',惊蛰:'03-05',清明:'04-05',立夏:'05-05',芒种:'06-05',小暑:'07-07',立秋:'08-07',白露:'09-07',寒露:'10-08',立冬:'11-07',大雪:'12-07' },
  2027:{ 小寒:'01-05',立春:'02-04',惊蛰:'03-06',清明:'04-05',立夏:'05-06',芒种:'06-06',小暑:'07-07',立秋:'08-08',白露:'09-08',寒露:'10-08',立冬:'11-07',大雪:'12-07' }
};
const MONTH_BRANCHES = [
  ['小寒','丑'],['立春','寅'],['惊蛰','卯'],['清明','辰'],['立夏','巳'],['芒种','午'],
  ['小暑','未'],['立秋','申'],['白露','酉'],['寒露','戌'],['立冬','亥'],['大雪','子']
];

function shanghaiParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).formatToParts(date);
  return Object.fromEntries(parts.filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
}

function parseTime(value) {
  const date = value == null ? new Date() : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('time 必须是有效 ISO 时间字符串');
  const p = shanghaiParts(date);
  return { date, year:+p.year, month:+p.month, day:+p.day, dateKey:`${p.year}-${p.month}-${p.day}` };
}

function dayGanzhi(year, month, day) {
  // 锚点核验：香港天文台年历及多个万年历均列 2026-01-01 为乙亥日（并非丙午日）。
  // 以 UTC 正午代表上海公历日，避开 DST/时区导致的毫秒日差。
  const anchor = Date.UTC(2026, 0, 1, 12);
  const target = Date.UTC(year, month - 1, day, 12);
  const days = Math.round((target - anchor) / 86400000);
  const index = ((11 + days) % 60 + 60) % 60; // 乙亥在六十甲子中索引 11（0 起）
  return GAN[index % 10] + ZHI[index % 12];
}

function monthBranch(year, month, day) {
  const table = JIE_DATES[year];
  if (!table) throw new Error('月建节气表仅支持 2025—2027 年');
  const md = String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0');
  let branch = '子'; // 每年小寒前仍属上一年大雪后的子月
  for (const [jie, zhi] of MONTH_BRANCHES) if (md >= table[jie]) branch = zhi;
  return branch;
}

function hexagram(lines) {
  const inner = TRIGRAMS[lines.slice(0,3).join('')];
  const outer = TRIGRAMS[lines.slice(3,6).join('')];
  if (!inner || !outer) throw new Error('无法识别卦象');
  const prefix = inner === outer ? inner + '为' + TRIGRAM_SYMBOL[inner] : TRIGRAM_SYMBOL[outer] + TRIGRAM_SYMBOL[inner];
  const name = Object.keys(HEX_INFO).find(n => n.startsWith(prefix));
  const info = HEX_INFO[name];
  if (!info) throw new Error('八宫表缺少卦：' + name);
  return { name, inner, outer, gong:info.gong, gongWuXing:GONG_WUXING[info.gong], palaceIndex:info.palaceIndex };
}

function liuQin(gong, element) {
  if (gong === element) return '兄弟';
  const generates = { 木:'火',火:'土',土:'金',金:'水',水:'木' };
  const overcomes = { 木:'土',土:'水',水:'火',火:'金',金:'木' };
  if (generates[gong] === element) return '子孙';
  if (generates[element] === gong) return '父母';
  if (overcomes[gong] === element) return '妻财';
  if (overcomes[element] === gong) return '官鬼';
  throw new Error('无法确定六亲');
}

function lineData(gua) {
  const ganZhi = NAJIA[gua.inner].inner.concat(NAJIA[gua.outer].outer);
  return ganZhi.map(gz => {
    const wuXing = ZHI_WUXING[gz[1]];
    return { ganZhi:gz, wuXing, liuQin:liuQin(gua.gongWuXing, wuXing) };
  });
}

function xunKong(riChen) {
  const gi = GAN.indexOf(riChen[0]);
  const zi = ZHI.indexOf(riChen[1]);
  const start = (zi - gi + 12) % 12;
  return [ZHI[(start + 10) % 12], ZHI[(start + 11) % 12]];
}

function cast(input) {
  if (!input || !['coins','random'].includes(input.method)) throw new Error("method 必须是 'coins' 或 'random'");
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (!question) throw new Error('question 必填');
  let tosses;
  if (input.method === 'random') tosses = Array.from({length:6}, () => crypto.randomInt(0,2) + crypto.randomInt(0,2) + crypto.randomInt(0,2));
  else {
    if (!Array.isArray(input.tosses) || input.tosses.length !== 6 || input.tosses.some(n => !Number.isInteger(n) || n < 0 || n > 3)) throw new Error('tosses 必须是含 6 个 0—3 整数的数组（初爻到上爻）');
    tosses = input.tosses.slice();
  }
  /* 《增删卜易》单拆重交口径（背为阳）：一背为单7、二背为拆8、三背为重9、三字为交6。
     tosses 存的是字面（正面）数，故按字数查表：0字(3背)=9、1字=8、2字=7、3字=6 */
  const values = tosses.map(n => [9,8,7,6][n]);
  const primary = values.map(v => v === 7 || v === 9 ? 1 : 0);
  const changed = primary.map((v,i) => values[i] === 6 || values[i] === 9 ? 1-v : v);
  const ben = hexagram(primary);
  const hasMoving = values.some(v => v === 6 || v === 9);
  const bian = hasMoving ? hexagram(changed) : null;
  const benLines = lineData(ben);
  const bianLines = bian ? lineData(bian) : null;
  const t = parseTime(input.time);
  const riChen = dayGanzhi(t.year,t.month,t.day);
  const shi = SHI_BY_INDEX[ben.palaceIndex];
  const ying = ((shi + 2) % 6) + 1;
  const yao = values.map((val,i) => {
    const dong = val === 6 || val === 9;
    const row = { pos:i+1, val, dong, ...benLines[i], liuShen:LIUSHEN[riChen[0]][i], shiYing:i+1 === shi ? '世' : i+1 === ying ? '应' : null };
    if (dong) row.bianGanZhi = { ...bianLines[i] };
    return row;
  });
  return {
    question, method:input.method, tosses, time:t.date.toISOString(), yueJian:monthBranch(t.year,t.month,t.day), riChen,
    xunKong:xunKong(riChen), benGua:{ name:ben.name, gong:ben.gong+'宫', gongWuXing:ben.gongWuXing },
    bianGua:bian ? { name:bian.name } : null, yao
  };
}

function interpretationFramework() {
  const text = fs.readFileSync(path.join(__dirname,'framework.md'),'utf8');
  const section = n => {
    const start = text.indexOf(`## ${n}、`);
    const next = text.indexOf('\n## ', start + 4);
    if (start < 0) throw new Error('framework.md 缺少第' + n + '章');
    return text.slice(start, next < 0 ? text.length : next).trim();
  };
  return [section('三'),section('四'),section('六')].join('\n\n') + '\n\n硬约束：你只能使用 user 消息里提供的【事实数据】和【计算结果】，严禁自行起卦、修改卦象或补充任何未提供的数据。' +
    '\n\n输出结构要求：推导过程照常按【计算结果】【传统理论】【推测】分节展开；但全文最后必须以一节【白话总结】收尾——用完全不含术语的大白话 4-8 句，说清：这一卦对所问之事的直接回答、总体是顺是阻还是平、值得留意的时间点（如推导得出）、一句实际可行的建议。【白话总结】里禁止出现卦名、爻名、六亲六神等任何术语，第 13 条原则在这一节执行得最严格；若依据不足，总结里也要如实写"无法判断"及缺什么。';
}

function userPrompt(result) {
  return `所问之事：${result.question}\n\n【事实数据】\n问题：${result.question}\n占时：${result.time}\n月建：${result.yueJian}\n日辰：${result.riChen}\n旬空：${result.xunKong.join('、')}\n\n【计算结果】\n${JSON.stringify(result, null, 2)}`;
}

async function interpret(castResult, onChunk) {
  if (!castResult || typeof castResult !== 'object') throw new Error('castResult 必填');
  if (typeof onChunk !== 'function') throw new Error('onChunk 必须是函数');
  // 解卦走任意 OpenAI 兼容接口，凭据从环境变量读：
  //   LIUYAO_LLM_URL   如 https://api.openai.com/v1/chat/completions
  //   LIUYAO_LLM_KEY   API key
  //   LIUYAO_LLM_MODEL 模型名
  const apiUrl = process.env.LIUYAO_LLM_URL;
  const apiKey = process.env.LIUYAO_LLM_KEY;
  const model = process.env.LIUYAO_LLM_MODEL;
  if (!apiUrl || !apiKey || !model) throw new Error('请设置 LIUYAO_LLM_URL / LIUYAO_LLM_KEY / LIUYAO_LLM_MODEL 环境变量（任意 OpenAI 兼容接口）');
  const response = await fetch(apiUrl, {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + apiKey },
    body:JSON.stringify({ model, max_tokens:8000, stream:true, messages:[
      { role:'system', content:interpretationFramework() },
      { role:'user', content:userPrompt(castResult) }
    ] })
  });
  if (!response.ok) throw new Error(`LLM HTTP ${response.status}: ${(await response.text()).slice(0,500)}`);
  if (!response.body) throw new Error('LLM 未返回流');
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, {stream:true});
    const events = buffer.split(/\r?\n\r?\n/); buffer = events.pop();
    for (const event of events) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        let parsed;
        try { parsed = JSON.parse(data); } catch (_) { continue; }
        const text = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
        if (text) await onChunk(text);
      }
    }
  }
}

module.exports = { cast, interpret };
