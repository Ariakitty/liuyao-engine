# 六爻纳甲装卦引擎

一个严格依照传统典籍实现的六爻占卜引擎：**起卦、装卦全程确定性计算，AI 只在最后按规范解读，且句句要标注依据。**

**🔮 在线试玩（无需安装）**：https://ariakitty.github.io/liuyao-engine/

**前端一行接入**（浏览器 ESM 模块，无依赖、纯客户端计算，任何网页都能用）：

```html
<script type="module">
  import { cast } from 'https://ariakitty.github.io/liuyao-engine/liuyao.browser.mjs';
  const result = cast({ method: 'random', question: '要问的事' });
  console.log(result.benGua.name, result.yao);
</script>
```

六爻纳甲筮法源自《周易》六十四卦，由汉代京房定型，是传统预测术中规则最完备、结果最可复核的一支。本引擎的规则主要依照清代两部权威典籍——**《增删卜易》**（野鹤老人）与**《卜筮正宗》**（王洪绪）——逐条实现，纳甲表另对照《易冒》，月建日辰的论断地位参照《黄金策》。完整的规则与数据表见 [framework.md](framework.md)，每一节都标注了经典出处，存在流派分歧的地方如实并列各家观点，文末附有对照典籍的自校清单。

## 为什么说它严谨

- **起卦守古法**：三枚铜钱摇六次，自初爻至上爻，按《增删卜易》"一背为单、二背为拆、三背为重、三字为交"的口径判定阴阳动静；支持输入真实摇掷结果，电脑代摇使用密码学级随机数（`crypto.randomInt`），并在文档中如实标注"电脑摇卦属现代做法、传统派存在争议"。
- **装卦零发挥**：八宫归属、纳甲装干支、世应定位、五行生克配六亲、按日干起六神、旬空推算——全部查表与规则运算，同一次摇掷任何人复算结果完全一致。
- **历法用真的**：月建严格按二十四节气之"节"换月（节气日期采用天文台历书），日辰干支以已知锚点日反推并经核验，全部按东八区计算。
- **表格可验收**：仓库自带 `test.js`，用已知卦例固定验收装卦结果；`framework.md` 附录含纳甲、八宫、世应、六神、旬空五张关键表的复核清单，改错任何一张表测试即红。
- **AI 戴着镣铐解卦**：解读环节遵守 framework.md 第六节的十三条输出规范——严禁编造、每个结论必须写明依据的数据与经典条文、事实/计算/传统理论/推测四类分开标注、流派分歧并列呈现、依据不足直接写"无法判断"、最后强制以不含术语的白话总结收尾。AI 无法起卦、无法改卦，只能解读引擎算好的盘。

## 用法

装卦（无任何依赖，Node 18+）：

```js
const { cast } = require('./liuyao.js');

// 电脑随机摇卦
const result = cast({ method: 'random', question: '要问的事' });

// 真实铜钱摇卦：六次的"字面（正面）数"，初爻到上爻
const result2 = cast({ method: 'coins', tosses: [2, 2, 2, 0, 1, 1], question: '要问的事', time: '2026-01-01T12:00:00+08:00' });
```

返回完整卦盘：本卦/变卦、卦宫五行、每爻的干支五行六亲六神、世应、动爻及变出干支、月建、日辰、旬空。

命令行快速体验：

```bash
node cli.js "最近的工作机会如何"
node cli.js "最近的工作机会如何" 2,2,2,0,1,1
```

**在线解卦 API**（试玩页的"请 AI 解卦"即走此接口，任何前端可直接调用，流式返回）：

```bash
curl -N -X POST https://gua.ariakitty.com/api/divine \
  -H 'Content-Type: application/json' \
  -d '{"question":"要问的事","method":"random"}'
# 也可传 method:"coins" + tosses:[...] 解读真实摇掷
# 首帧为卦盘 JSON，\x1e 分隔符之后为解卦文本流
# 限流：每 IP 每小时 10 次，全站每日 200 次
```

自建 AI 解卦（接任意 OpenAI 兼容接口）：

```bash
export LIUYAO_LLM_URL=https://api.example.com/v1/chat/completions
export LIUYAO_LLM_KEY=你的key
export LIUYAO_LLM_MODEL=模型名
```

```js
const { cast, interpret } = require('./liuyao.js');
const r = cast({ method: 'random', question: '要问的事' });
await interpret(r, chunk => process.stdout.write(chunk));
```

## 文件

| 文件 | 说明 |
|------|------|
| `liuyao.js` | 引擎本体：起卦、装卦、解卦调用 |
| `framework.md` | 完整知识框架：规则、数据表、经典出处、流派分歧、AI 输出规范、自校清单 |
| `cli.js` | 命令行演示 |
| `test.js` | 已知卦例验收测试（`node test.js`） |

## 声明

本项目是对传统六爻纳甲筮法的忠实数字化实现，供易学爱好者研究与娱乐使用。占卜结果不构成任何现实决策建议。

## License

MIT
