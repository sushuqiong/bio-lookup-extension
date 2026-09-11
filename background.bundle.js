/**
 * background.bundle.js —— 自动生成，请勿直接编辑
 * 由 genedata.js + classify.js + background.js 合并（去掉 ESM 语法），
 * 目的是消除 MV3 service worker 使用 type:"module" 时的兼容风险。
 * 重新生成：python build.py
 */
/* ═══════════ 1/3 genedata.js ═══════════ */
/**
 * genedata.js —— v0.4 数据层
 * ① 类型主题色 ② 内置肿瘤/临床相关基因速查表 ③ 序列工具
 * 纯数据 + 纯函数，可单测，无 chrome API 依赖
 */

/* ── ① 类型主题色（色彩贯穿菜单/历史/卡片/浮层/统计） ── */
const TYPE_COLORS = {
  gene: "#64ffda", // 青绿
  variant_rs: "#f472b6", // 玫红
  variant_hgvs: "#fb7185", // 珊瑚
  variant_coord: "#38bdf8", // 天蓝
  variant_vcf: "#a78bfa", // 紫
  geo: "#fbbf24", // 金橙
  pmid: "#60a5fa", // 蓝
  doi: "#c084fc", // 淡紫
  region: "#34d399", // 翠绿
  sequence: "#f97316", // 橙
  unknown: "#94a3b8", // 灰蓝
}

/* ── ② 内置肿瘤/临床相关基因速查表（本地数据，无需联网） ── */
const GENE_INFO = {
  BRCA1: { cn: "乳腺癌易感基因1", cancers: ["乳腺癌", "卵巢癌", "前列腺癌", "胰腺癌"], pathway: "同源重组修复 HRR" },
  BRCA2: { cn: "乳腺癌易感基因2", cancers: ["乳腺癌", "卵巢癌", "胰腺癌", "前列腺癌"], pathway: "同源重组修复 HRR" },
  PALB2: { cn: "BRCA2 伴侣", cancers: ["乳腺癌", "卵巢癌", "胰腺癌"], pathway: "同源重组修复 HRR" },
  ATM: { cn: "共济失调毛细血管扩张突变", cancers: ["乳腺癌", "胰腺癌", "前列腺癌"], pathway: "DNA 损伤应答" },
  CHEK2: { cn: "检查点激酶2", cancers: ["乳腺癌", "结直肠癌"], pathway: "DNA 损伤应答" },
  RAD51C: { cn: "RAD51 旁系同源 C", cancers: ["卵巢癌", "乳腺癌"], pathway: "同源重组修复" },
  RAD51D: { cn: "RAD51 旁系同源 D", cancers: ["卵巢癌"], pathway: "同源重组修复" },
  BARD1: { cn: "BRCA1 相关环域蛋白", cancers: ["乳腺癌", "神经母细胞瘤"], pathway: "同源重组修复" },
  TP53: { cn: "肿瘤蛋白 p53", cancers: ["泛癌", "Li-Fraumeni 综合征"], pathway: "p53 信号通路" },
  MDM2: { cn: "双微体2同源物", cancers: ["脂肪肉瘤", "骨肉瘤"], pathway: "p53 负调控" },
  CDKN2A: { cn: "细胞周期抑制因子2A (p16)", cancers: ["黑色素瘤", "胰腺癌", "肺癌"], pathway: "细胞周期 CDK4/6" },
  RB1: { cn: "视网膜母细胞瘤1", cancers: ["视网膜母细胞瘤", "骨肉瘤", "小细胞肺癌"], pathway: "细胞周期" },
  CCND1: { cn: "细胞周期素 D1", cancers: ["套细胞淋巴瘤", "乳腺癌", "头颈癌"], pathway: "细胞周期" },
  MYC: { cn: "MYC 原癌基因", cancers: ["Burkitt 淋巴瘤", "泛癌"], pathway: "转录调控" },
  APC: { cn: "腺瘤性息肉病基因", cancers: ["结直肠癌", "家族性腺瘤息肉病"], pathway: "Wnt / β-catenin" },
  CTNNB1: { cn: "β-连环蛋白1", cancers: ["肝细胞癌", "子宫内膜癌", "结直肠癌"], pathway: "Wnt / β-catenin" },
  MLH1: { cn: "MutL 同源物1", cancers: ["林奇综合征", "结直肠癌", "子宫内膜癌"], pathway: "错配修复 MMR" },
  MSH2: { cn: "MutS 同源物2", cancers: ["林奇综合征", "结直肠癌"], pathway: "错配修复 MMR" },
  MSH6: { cn: "MutS 同源物6", cancers: ["林奇综合征", "结直肠癌", "子宫内膜癌"], pathway: "错配修复 MMR" },
  PMS2: { cn: "减数分裂后分离2", cancers: ["林奇综合征", "结直肠癌"], pathway: "错配修复 MMR" },
  EPCAM: { cn: "上皮细胞黏附分子", cancers: ["林奇综合征（缺失致 MSH2 沉默）"], pathway: "错配修复 MMR" },
  POLE: { cn: "DNA 聚合酶 ε", cancers: ["超突变型结直肠癌", "子宫内膜癌"], pathway: "DNA 复制校对" },
  MUTYH: { cn: "MutY 同源物", cancers: ["结直肠癌（MAP）"], pathway: "碱基切除修复" },
  CDH1: { cn: "E-钙黏蛋白", cancers: ["弥漫型胃癌", "乳腺小叶癌"], pathway: "细胞黏附" },
  ARID1A: { cn: "SWI/SNF 复合物亚基", cancers: ["子宫内膜癌", "卵巢透明细胞癌", "胃癌"], pathway: "染色质重塑" },
  SMAD4: { cn: "SMAD 家族成员4", cancers: ["胰腺癌", "结直肠癌"], pathway: "TGF-β 信号" },
  STK11: { cn: "丝氨酸苏氨酸激酶11 (LKB1)", cancers: ["Peutz-Jeghers 综合征", "肺癌"], pathway: "LKB1 / AMPK" },
  TGFBR2: { cn: "TGF-β 受体2", cancers: ["结直肠癌", "胃癌"], pathway: "TGF-β 信号" },
  ERBB2: { cn: "HER2 / ERBB2", cancers: ["乳腺癌", "胃癌", "食管癌"], pathway: "RTK（HER2 扩增）" },
  ERBB3: { cn: "HER3", cancers: ["乳腺癌", "胃癌"], pathway: "RTK" },
  EGFR: { cn: "表皮生长因子受体", cancers: ["非小细胞肺癌", "结直肠癌", "胶质母细胞瘤"], pathway: "RTK / RAS / MAPK" },
  KRAS: { cn: "KRAS 原癌基因", cancers: ["胰腺癌", "肺癌", "结直肠癌"], pathway: "RTK / RAS / MAPK" },
  NRAS: { cn: "NRAS 原癌基因", cancers: ["黑色素瘤", "AML"], pathway: "RTK / RAS / MAPK" },
  HRAS: { cn: "HRAS 原癌基因", cancers: ["膀胱癌", "头颈癌"], pathway: "RTK / RAS / MAPK" },
  BRAF: { cn: "B-Raf 原癌基因", cancers: ["黑色素瘤", "甲状腺癌", "结直肠癌"], pathway: "MAPK" },
  MAP2K1: { cn: "MEK1", cancers: ["黑色素瘤", "肺癌"], pathway: "MAPK" },
  NF1: { cn: "神经纤维瘤蛋白1", cancers: ["神经纤维瘤病", "黑色素瘤", "胶质瘤"], pathway: "RAS / MAPK" },
  ALK: { cn: "间变性淋巴瘤激酶", cancers: ["非小细胞肺癌", "间变大细胞淋巴瘤"], pathway: "RTK 融合" },
  ROS1: { cn: "ROS 原癌基因1", cancers: ["非小细胞肺癌"], pathway: "RTK 融合" },
  RET: { cn: "RET 原癌基因", cancers: ["甲状腺髓样癌", "非小细胞肺癌"], pathway: "RTK" },
  MET: { cn: "MET 原癌基因", cancers: ["非小细胞肺癌", "肾细胞癌", "胃癌"], pathway: "RTK" },
  KIT: { cn: "KIT 受体酪氨酸激酶", cancers: ["胃肠间质瘤 GIST", "黑色素瘤"], pathway: "RTK" },
  PDGFRA: { cn: "血小板衍生生长因子受体 α", cancers: ["GIST", "胶质瘤"], pathway: "RTK" },
  NTRK1: { cn: "神经营养酪氨酸激酶受体1", cancers: ["泛癌（融合，TRK 抑制剂）"], pathway: "RTK 融合" },
  NTRK2: { cn: "TRKB", cancers: ["泛癌（融合）"], pathway: "RTK 融合" },
  NTRK3: { cn: "TRKC", cancers: ["婴儿纤维肉瘤", "分泌性乳腺癌"], pathway: "RTK 融合" },
  FGFR1: { cn: "成纤维细胞生长因子受体1", cancers: ["肺癌", "胶质瘤"], pathway: "RTK / FGFR" },
  FGFR2: { cn: "成纤维细胞生长因子受体2", cancers: ["胆管癌", "子宫内膜癌", "胃癌"], pathway: "RTK / FGFR" },
  FGFR3: { cn: "成纤维细胞生长因子受体3", cancers: ["尿路上皮癌", "多发性骨髓瘤"], pathway: "RTK / FGFR" },
  FLT3: { cn: "FMS 样酪氨酸激酶3", cancers: ["急性髓系白血病 AML"], pathway: "RTK" },
  ABL1: { cn: "ABL 原癌基因1", cancers: ["慢性髓性白血病（BCR-ABL）", "急性淋巴细胞白血病"], pathway: "RTK / BCR-ABL" },
  JAK2: { cn: "Janus 激酶2", cancers: ["骨髓增殖性肿瘤", "真性红细胞增多症"], pathway: "JAK / STAT" },
  CALR: { cn: "钙网蛋白", cancers: ["骨髓增殖性肿瘤"], pathway: "JAK / STAT" },
  MPL: { cn: "血小板生成素受体", cancers: ["骨髓增殖性肿瘤"], pathway: "JAK / STAT" },
  NPM1: { cn: "核磷蛋白1", cancers: ["急性髓系白血病"], pathway: "白血病融合基因" },
  DNMT3A: { cn: "DNA 甲基转移酶3A", cancers: ["急性髓系白血病", "MDS"], pathway: "表观遗传调控" },
  TET2: { cn: "TET2 双加氧酶", cancers: ["MDS", "AML"], pathway: "表观遗传调控" },
  PIK3CA: { cn: "PI3K 催化亚基 α", cancers: ["乳腺癌", "子宫内膜癌", "结直肠癌"], pathway: "PI3K / AKT / mTOR" },
  PTEN: { cn: "磷酸酶及张力蛋白同源物", cancers: ["子宫内膜癌", "胶质母细胞瘤", "乳腺癌"], pathway: "PI3K / AKT 负调控" },
  AKT1: { cn: "AKT 丝氨酸/苏氨酸激酶1", cancers: ["乳腺癌", "Cowden 综合征"], pathway: "PI3K / AKT / mTOR" },
  MTOR: { cn: "雷帕霉素靶蛋白", cancers: ["肾细胞癌", "结节性硬化"], pathway: "mTOR" },
  TSC1: { cn: "结节性硬化复合物1", cancers: ["结节性硬化症", "肾血管平滑肌脂肪瘤"], pathway: "mTOR 负调控" },
  TSC2: { cn: "结节性硬化复合物2", cancers: ["结节性硬化症"], pathway: "mTOR 负调控" },
  CD274: { cn: "PD-L1（免疫检查点配体）", cancers: ["泛癌免疫治疗标志", "肺癌", "胃癌"], pathway: "免疫检查点" },
  PDCD1: { cn: "PD-1（免疫检查点受体）", cancers: ["黑色素瘤", "肺癌（免疫治疗）"], pathway: "免疫检查点" },
  CTLA4: { cn: "细胞毒性 T 淋巴细胞相关蛋白4", cancers: ["黑色素瘤（免疫治疗）"], pathway: "免疫检查点" },
  LAG3: { cn: "LAG-3（免疫检查点）", cancers: ["黑色素瘤（免疫治疗）"], pathway: "免疫检查点" },
  HAVCR2: { cn: "TIM-3（免疫检查点）", cancers: ["免疫治疗耐药"], pathway: "免疫检查点" },
  TIGIT: { cn: "TIGIT（免疫检查点）", cancers: ["肺癌（免疫治疗）"], pathway: "免疫检查点" },
  IDH1: { cn: "异柠檬酸脱氢酶1", cancers: ["胶质瘤", "胆管癌", "AML"], pathway: "代谢重编程" },
  IDH2: { cn: "异柠檬酸脱氢酶2", cancers: ["胶质瘤", "AML"], pathway: "代谢重编程" },
  TERT: { cn: "端粒酶逆转录酶", cancers: ["泛癌（启动子突变）", "胶质瘤", "黑色素瘤"], pathway: "端粒维持" },
  KEAP1: { cn: "Kelch 样 ECH 相关蛋白1", cancers: ["肺癌", "头颈癌"], pathway: "NRF2 通路" },
  NFE2L2: { cn: "NRF2", cancers: ["肺癌", "食管癌"], pathway: "氧化应激应答" },
  VHL: { cn: "von Hippel-Lindau 肿瘤抑制因子", cancers: ["肾透明细胞癌", "嗜铬细胞瘤"], pathway: "HIF / VHL" },
  BAP1: { cn: "BRCA1 相关蛋白1", cancers: ["间皮瘤", "肾细胞癌", "葡萄膜黑色素瘤"], pathway: "去泛素化" },
  SDHA: { cn: "琥珀酸脱氢酶 A", cancers: ["副神经节瘤", "嗜铬细胞瘤", "GIST"], pathway: "三羧酸循环" },
  SDHB: { cn: "琥珀酸脱氢酶 B", cancers: ["副神经节瘤", "嗜铬细胞瘤"], pathway: "三羧酸循环" },
  MEN1: { cn: "多发性内分泌腺瘤蛋白1", cancers: ["多发性内分泌腺瘤病1型"], pathway: "转录调控" },
  WT1: { cn: "Wilms 瘤抑制基因1", cancers: ["Wilms 瘤", "间皮瘤"], pathway: "转录调控" },
  PTCH1: { cn: "Patched 1", cancers: ["基底细胞癌", "髓母细胞瘤"], pathway: "Hedgehog" },
  SMO: { cn: "Smoothened", cancers: ["基底细胞癌"], pathway: "Hedgehog" },
  GNAQ: { cn: "G 蛋白 α 亚基 q", cancers: ["葡萄膜黑色素瘤"], pathway: "G 蛋白信号" },
  GNA11: { cn: "G 蛋白 α 亚基 11", cancers: ["葡萄膜黑色素瘤"], pathway: "G 蛋白信号" },
  BCL2: { cn: "B 细胞淋巴瘤2（抗凋亡）", cancers: ["滤泡性淋巴瘤", "慢性淋巴细胞白血病"], pathway: "凋亡调控" },
  EZH2: { cn: "Zeste 增强子同源物2", cancers: ["滤泡性淋巴瘤"], pathway: "表观遗传调控" },
  BTK: { cn: "布鲁顿酪氨酸激酶", cancers: ["慢性淋巴细胞白血病", "淋巴瘤"], pathway: "B 细胞受体信号" },
  CLDN18: { cn: "紧密连接蛋白18（Claudin18.2）", cancers: ["胃癌", "食管胃结合部癌", "胰腺癌"], pathway: "细胞黏附 / 治疗靶点" },
  CXCL9: { cn: "趋化因子配体9", cancers: ["免疫浸润标志（结直肠癌 / 胃癌）"], pathway: "趋化因子 / 免疫微环境" },
  CXCL10: { cn: "趋化因子配体10", cancers: ["免疫浸润标志"], pathway: "趋化因子 / 免疫微环境" },
  CD8A: { cn: "CD8α（细胞毒 T 细胞标志）", cancers: ["免疫浸润评估"], pathway: "免疫微环境" },
  FOXP3: { cn: "叉头盒 P3（Treg 标志）", cancers: ["免疫微环境"], pathway: "免疫调控" },
  ABCB1: { cn: "多药耐药蛋白1 (MDR1/P-gp)", cancers: ["化疗耐药"], pathway: "药物外排转运" },
  ERCC1: { cn: "切除修复交叉互补1", cancers: ["铂类耐药（肺癌）"], pathway: "核苷酸切除修复" },
  RRM1: { cn: "核糖核苷酸还原酶 M1", cancers: ["吉西他滨敏感性"], pathway: "核苷酸代谢" },
  TYMS: { cn: "胸苷酸合成酶", cancers: ["5-FU 敏感性（结直肠癌）"], pathway: "核苷酸代谢" },
  UGT1A1: { cn: "UDP 葡糖醛酸转移酶1A1", cancers: ["伊立替康毒性"], pathway: "药物代谢" },
  DPYD: { cn: "二氢嘧啶脱氢酶", cancers: ["5-FU / 卡培他滨毒性"], pathway: "药物代谢" },
}

/** 别名 → 官方符号 */
const GENE_ALIAS = {
  "P53": "TP53",
  "PD-L1": "CD274",
  "PDL1": "CD274",
  "PD-1": "PDCD1",
  "PD1": "PDCD1",
  "HER2": "ERBB2",
  "HER-2": "ERBB2",
  "P16": "CDKN2A",
  "LKB1": "STK11",
  "NRF2": "NFE2L2",
  "CLDN18.2": "CLDN18",
  "TIM3": "HAVCR2",
  "TIM-3": "HAVCR2",
  "MDR1": "ABCB1",
  "P-GP": "ABCB1",
}

/** 查询基因信息（大小写不敏感 + 别名解析） */
function lookupGene(raw) {
  const raw0 = String(raw || "").trim().toUpperCase()
  if (!raw0) return null
  const candidates = [raw0, raw0.replace(/-/g, ""), GENE_ALIAS[raw0], GENE_ALIAS[raw0.replace(/-/g, "")]].filter(Boolean)
  for (const c of candidates) {
    if (GENE_INFO[c]) return { gene: c, info: GENE_INFO[c] }
  }
  // 带连字符的官方符号（如 HLA-DRA 不在表中；尝试把已知别名映射的结果再查）
  for (const c of candidates) {
    const alias = GENE_ALIAS[c]
    if (alias && GENE_INFO[alias]) return { gene: alias, info: GENE_INFO[alias] }
  }
  return null
}

function geneTableSize() {
  return Object.keys(GENE_INFO).length
}

/* ── ③ 序列工具 ── */
const COMP = {
  A: "T", T: "A", C: "G", G: "C", U: "A", N: "N",
  R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
  B: "V", V: "B", D: "H", H: "D",
}

function reverseComplement(seq) {
  return String(seq)
    .toUpperCase()
    .split("")
    .reverse()
    .map((c) => COMP[c] || c)
    .join("")
}

function transcribe(seq) {
  return String(seq).toUpperCase().replace(/T/g, "U")
}

function gcContent(seq) {
  const s = String(seq).toUpperCase().replace(/[^ACGTU]/g, "")
  if (!s.length) return 0
  const gc = (s.match(/[GC]/g) || []).length
  return Math.round((gc / s.length) * 1000) / 10
}

/** 序列分析摘要：长度 / GC% / 反向互补 / RNA 转录 */
function analyzeSequence(seq) {
  const s = String(seq).toUpperCase().replace(/[^ACGTUNRYWSKMBDHV]/g, "")
  if (s.length < 4) return null
  return { seq: s, length: s.length, gc: gcContent(s), rc: reverseComplement(s), rna: transcribe(s) }
}

/* ══════════════════════════════════════════════════════════════
   v0.6.0：页面实体提取（"扫描本页" / 自动高亮共用）
   从任意文本中找出：已知基因、基因别名、rsID、GEO、PMID、DOI、坐标变异
   ══════════════════════════════════════════════════════════════ */

/** 转义正则特殊字符 */
function escRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * 从文本中提取可查询实体（去重 + 按出现次数排序）
 * @param {string} text 页面文本
 * @param {number} limit 最多返回条数
 * @returns {{q:string,type:string,count:number}[]}
 */
function extractEntities(text, limit = 40) {
  const t = String(text || "")
  if (!t) return []
  const hits = new Map()
  const add = (q, type) => {
    if (!q) return
    const key = `${String(q).toUpperCase()}|${type}`
    const cur = hits.get(key)
    if (cur) cur.count++
    else hits.set(key, { q: String(q), type, count: 1 })
  }

  // ① 已知基因 + 别名：合并为单个正则，只扫一遍（v0.6.0 性能优化）
  const re = geneScanRe()
  re.lastIndex = 0
  let m
  while ((m = re.exec(t))) {
    if (m[0].length === 0) {
      re.lastIndex++
      continue
    }
    const raw = m[0]
    const up = raw.toUpperCase()
    const official = GENE_INFO[up] ? up : GENE_ALIAS[up] || GENE_ALIAS[up.replace(/-/g, "")] || up
    if (GENE_INFO[official]) add(official, "gene")
  }

  // ② rsID
  for (const x of t.match(/(?<![A-Za-z0-9])rs\s?\d{4,}(?![A-Za-z0-9])/gi) || [])
    add(x.replace(/\s+/g, "").toLowerCase(), "variant_rs")
  // ③ GEO / SRA 编号
  for (const x of t.match(/(?<![A-Za-z0-9])(GSE|GSM|GDS|GPL)\s?\d{3,}(?![A-Za-z0-9])/gi) || [])
    add(x.replace(/\s+/g, "").toUpperCase(), "geo")
  // ④ PMID
  for (const x of t.match(/PMID:?\s?\d{7,9}/gi) || []) add(x.replace(/PMID:?\s?/i, ""), "pmid")
  // ⑤ DOI
  for (const x of t.match(/10\.\d{4,9}\/[^\s"'<>)\]]+/g) || []) add(x.replace(/[.,;)]+$/, ""), "doi")
  // ⑥ 坐标型变异
  for (const x of t.match(/(?<![A-Za-z0-9])(?:chr)?\d{1,2}:\d{2,}\s?[ACGT]{1,}>[ACGT]{1}/gi) || [])
    add(x.replace(/\s+/g, " ").trim(), "variant_coord")

  return [...hits.values()].sort((a, b) => b.count - a.count || a.q.localeCompare(b.q)).slice(0, limit)
}

/** 基因/别名扫描正则（模块级缓存，长词优先避免短词先匹配） */
let _geneScanRe = null
function geneScanRe() {
  if (_geneScanRe) return _geneScanRe
  const words = Object.keys(GENE_INFO).concat(Object.keys(GENE_ALIAS))
  words.sort((a, b) => b.length - a.length)
  _geneScanRe = new RegExp(`(?<![A-Za-z0-9-])(?:${words.map(escRe).join("|")})(?![A-Za-z0-9-])`, "gi")
  return _geneScanRe
}

function buildHighlightTerms() {
  const terms = []
  for (const g of Object.keys(GENE_INFO)) terms.push({ q: g, type: "gene", exact: true })
  for (const alias of Object.keys(GENE_ALIAS)) terms.push({ q: alias, type: "gene", exact: true })
  return terms
}


/* ═══════════ 2/3 classify.js ═══════════ */
/**
 * classify.js —— 选中文本类型识别 + 数据库映射
 * 纯函数，无 chrome API 依赖，便于单测与复用
 * v0.4：引入类型主题色 + 基因速查表 + 序列工具（见 genedata.js）
 */
/* ── 数据库定义：{ id, label, icon, url(q) } ── */
const DBS = {
  // 基因
  ncbiGene: { label: "NCBI Gene", icon: "🧬", url: (q) => `https://www.ncbi.nlm.nih.gov/gene/?term=${enc(q)}` },
  ensembl: { label: "Ensembl", icon: "🧫", url: (q) => `https://www.ensembl.org/Multi/Search/Results?q=${enc(q)}` },
  genecards: { label: "GeneCards", icon: "🗂️", url: (q) => `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${enc(q)}` },
  uniprot: { label: "UniProt", icon: "🔬", url: (q) => `https://www.uniprot.org/uniprotkb?query=gene:${enc(q)}` },
  ncbiProtein: { label: "NCBI Protein", icon: "🧾", url: (q) => `https://www.ncbi.nlm.nih.gov/protein/?term=${enc(q)}` },
  // 文献
  pubmed: { label: "PubMed", icon: "📚", url: (q) => `https://pubmed.ncbi.nlm.nih.gov/?term=${enc(q)}` },
  europepmc: { label: "Europe PMC", icon: "📖", url: (q) => `https://europepmc.org/search?query=${enc(q)}` },
  // GEO / 数据集
  geo: { label: "GEO 数据集", icon: "📦", url: (q) => `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${enc(q)}` },
  sra: { label: "SRA Run Selector", icon: "🗄️", url: (q) => `https://www.ncbi.nlm.nih.gov/Traces/study/?acc=${enc(q)}` },
  arrayexpress: { label: "ArrayExpress", icon: "📊", url: (q) => `https://www.ebi.ac.uk/biostudies/arrayexpress/studies?query=${enc(q)}` },
  // 变异
  dbsnp: { label: "dbSNP", icon: "🔎", url: (q) => `https://www.ncbi.nlm.nih.gov/snp/${enc(rsCore(q))}` },
  clinvar: { label: "ClinVar", icon: "🏥", url: (q) => `https://www.ncbi.nlm.nih.gov/clinvar/?term=${enc(clinvarTerm(q))}` },
  gnomad: { label: "gnomAD", icon: "🌍", url: (q) => `https://gnomad.broadinstitute.org/variant/${enc(toGnomad(q))}?dataset=gnomad_r4` },
  varsome: { label: "VarSome", icon: "🧪", url: (q) => `https://varsome.com/variant/hg38/${enc(toGnomad(q))}` },
  franklin: { label: "Franklin", icon: "🧠", url: (q) => `https://franklin.genoox.com/clinical-db/variant/${enc(toGnomad(q))}` },
  // 基因组区间 / 序列
  ucsc: { label: "UCSC Genome Browser", icon: "🗺️", url: (q) => `https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=${enc(regionNorm(q))}` },
  blast: { label: "NCBI BLAST", icon: "🚀", url: (q) => `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE_TYPE=BlastSearch&USER_FORMAT_DEFAULTS=on&SET_AND_ORGANISM=on&QUERY=${enc(q)}` },
  // 文献工具
  zotero: { label: "在 Zotero 中查找", icon: "📗", zotero: true, url: (q) => `zotero://select/items/0_${enc(q)}` },
  // 通用
  ncbiAll: { label: "NCBI 全库检索", icon: "🔍", url: (q) => `https://www.ncbi.nlm.nih.gov/search/all/?term=${enc(q)}` },
  googleScholar: { label: "Google Scholar", icon: "🎓", url: (q) => `https://scholar.google.com/scholar?q=${enc(q)}` },
}

function enc(s) {
  return encodeURIComponent(s)
}

/* ── 查询词归一化（让 VCF / 坐标 / rsID 各种写法都能被目标库识别） ── */

/** 取 rsID 核心：rs80357906 / "rs80357906 (ClinVar)" → 80357906 */
function rsCore(q) {
  const m = String(q).match(/rs\s*(\d+)/i)
  return m ? m[1] : String(q).trim()
}

/** 坐标归一化成 gnomAD / VarSome 需要的 CHROM-POS-REF-ALT */
function toGnomad(q) {
  const s = String(q).trim()
  // 已是 17-7676154-C-T 形式
  if (/^(chr)?([0-9]{1,2}|[XYM]|MT)-?\d+-[ACGTN]+-[ACGTN]+$/i.test(s)) {
    return s.replace(/^chr/i, "").replace(/:|-/g, (m, i) => (i === 0 && m === ":" ? "-" : "-")).replace(/-+/g, "-")
  }
  // chr17:7676154C>T / chr17:7676154 C>T / chr17:g.7676154C>T
  const m = s.match(/^(?:chr)?([0-9]{1,2}|[XYM]|MT)[:\-]g?\.?\s*(\d+)\s*[:\-_]?\s*([ACGTN]+)\s*[>\/\-_]\s*([ACGTN]+)/i)
  if (m) return `${m[1]}-${m[2]}-${m[3].toUpperCase()}-${m[4].toUpperCase()}`
  // chr17:7676154（只有位置）→ gnomAD 不支持纯位置，退回原串（ClinVar/UCSC 可处理）
  return s.replace(/^chr/i, "").replace(":", "-")
}

/** ClinVar 检索词：rsID 直接搜，坐标转 "17:7676154" */
function clinvarTerm(q) {
  const s = String(q).trim()
  if (/^rs\d+/i.test(s)) return s.match(/rs\d+/i)[0]
  const m = s.match(/^(?:chr)?([0-9]{1,2}|[XYM]|MT)[:\-]g?\.?(\d+)/i)
  if (m) return `${m[1]}:${m[2]}`
  return s
}

/** UCSC position 参数 */
function regionNorm(q) {
  return String(q).trim().replace(/^chr/i, "chr").replace(/\s+/g, "")
}

/* ── VCF 记录解析（v0.3） ── */

/**
 * 解析一行 VCF（TAB 或空格分隔，至少到 ALT）：CHROM POS ID REF ALT ...
 * 返回 { chrom, pos, id, ref, alts, query, kind } 或 null
 */
function parseVcfLine(line) {
  const f = String(line).trim().split(/\s+/)
  if (f.length < 4) return null
  const [chromRaw, pos, id, ref, alt] = f
  if (!/^(chr)?([0-9]{1,2}|[XYM]|MT)$/i.test(chromRaw)) return null
  if (!/^\d{2,}$/.test(pos)) return null
  if (!/^[ACGTNacgtn.]+$/.test(ref)) return null
  const chrom = chromRaw.replace(/^chr/i, "").toUpperCase()
  const alts = (alt || "")
    .split(",")
    .map((a) => a.toUpperCase())
    .filter((a) => /^[ACGTN<>*]+$/.test(a))
  if (!alts.length && !/^rs\d+$/i.test(id)) return null
  const rid = id && id !== "." && /^rs\d+$/i.test(id) ? id.toLowerCase() : ""
  const kind = rid ? "rsid" : "coord"
  const query = rid ? rid : `${chrom}-${pos}-${ref.toUpperCase()}-${alts[0] || "N"}`
  return { chrom, pos: Number(pos), id: rid, ref: ref.toUpperCase(), alts, query, kind, raw: f.join("\t") }
}

/** 判断一段文本是否为 VCF（≥1 行合法记录） */
function isVcfText(text) {
  const lines = String(text).trim().split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"))
  return lines.length >= 1 && lines.every((l) => parseVcfLine(l) !== null)
}

/** 从多行文本中提取 VCF 记录（忽略 ## header 与空行） */
function parseVcfText(text) {
  return String(text)
    .split(/\r?\n/)
    .map((l) => (l.startsWith("#") ? null : parseVcfLine(l)))
    .filter(Boolean)
    .slice(0, 50)
}

/* ── 各类型的推荐库（顺序即菜单顺序，第一个为"首选"） ── */
const TYPES = {
  gene: { name: "基因", emoji: "🧬", dbs: ["ncbiGene", "ensembl", "genecards", "uniprot", "pubmed", "ncbiProtein"] },
  variant_rs: { name: "SNP (rsID)", emoji: "🔎", dbs: ["dbsnp", "clinvar", "gnomad", "varsome", "franklin"] },
  variant_hgvs: { name: "变异 (HGVS)", emoji: "🧪", dbs: ["clinvar", "gnomad", "varsome", "franklin"] },
  variant_coord: { name: "变异 (坐标)", emoji: "🌍", dbs: ["gnomad", "clinvar", "varsome", "ucsc"] },
  variant_vcf: { name: "VCF 记录", emoji: "🧾", dbs: ["gnomad", "clinvar", "dbsnp", "varsome", "ucsc"] },
  geo: { name: "GEO 数据集", emoji: "📦", dbs: ["geo", "sra", "arrayexpress", "pubmed"] },
  pmid: { name: "文献 (PMID)", emoji: "📚", dbs: ["pubmed", "europepmc", "googleScholar", "zotero"] },
  doi: { name: "文献 (DOI)", emoji: "🔖", dbs: ["europepmc", "pubmed", "googleScholar", "zotero"] },
  region: { name: "基因组区间", emoji: "🗺️", dbs: ["ucsc", "ensembl"] },
  sequence: { name: "核酸序列", emoji: "🚀", dbs: ["blast", "ncbiAll"] },
  unknown: { name: "通用查询", emoji: "🔍", dbs: ["ncbiAll", "pubmed", "googleScholar", "ensembl", "genecards"] },
}

/** 兜底：任何类型的菜单末尾都提供通用检索（防误判后无路可走） */
const FALLBACK_DBS = ["ncbiAll", "googleScholar"]

/* ── 正则规则库 ── */
const RULES = [
  // GEO / SRA 系列编号
  { type: "geo", re: /^(GSE|GSM|GDS|GPL|GSE\d+)\d{2,}$/i },
  // PubMed ID：PMID 前缀或纯数字（7-9 位，避免把年份/统计数字误判）
  { type: "pmid", re: /^(PMID:?\s*)?\d{7,9}$/i },
  // DOI
  { type: "doi", re: /^10\.\d{4,9}\/\S+$/i },
  // rsID
  { type: "variant_rs", re: /^rs\d{3,}$/i },
  // 坐标型变异：chr17:7676154C>T / chr17:7676154 C>T / 17-7676154-C-T / chr1:g.12345A>G
  { type: "variant_coord", re: /^(chr)?[0-9XYM]{1,2}[:\-](g\.)?\d{2,}([\s:\-_]*[ACGTN]+[>\-_][ACGTN]+)?$/i },
  // 区间：chr1:12345-12400 / chr1:12345..12400
  { type: "region", re: /^(chr)?[0-9XYM]{1,2}:\d{2,}[-–.]{1,2}\d{2,}$/i },
  // 小 RNA / 非编码基因命名：miR-21 / let-7a / LINC00473 / SNORD15A / HLA-DRA / IGHV1-2
  { type: "gene", re: /^(miR|MIR|let-7|LINC|SNORD|SNORA|HLA|IGH|IGK|IGL|TRB|TRA|TRG|TRD)[-\s]?[A-Za-z0-9]{1,10}$/i },
  // HGVS：c.68_69del / p.Val600Glu / NM_007294.4:c.68_69del
  { type: "variant_hgvs", re: /^([A-Z]{1,2}_\d{6,}(\.\d+)?:)?([cpgmnr]\.\S+|[cpgmnr]\.\d+.*(del|ins|dup|inv|>)|p\.\(?[A-Z][a-z]{2}\d+[A-Z][a-z]{2}\)?)$/i },
  // 常规基因符号：BRCA1 / TP53 / CD274 / ABCB1
  { type: "gene", re: /^[A-Z][A-Z0-9]{1,9}([-.][A-Z0-9]+)?$/ },
  // 核酸序列：≥20 位纯 ATCGN（避免短串误判）
  { type: "sequence", re: /^[ACGTUNacgtun]{20,}$/ },
]

/**
 * 识别选中文本类型，返回 { type, name, emoji, dbs, query, vcf? }
 */
function classify(raw) {
  const q = (raw || "").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
  if (!q) return null

  // ① VCF 行优先（CHROM POS ID REF ALT ...）→ 归一化为 gnomAD/ClinVar 可直接吃的查询词
  const vcf = parseVcfLine(q)
  if (vcf) {
    const t = TYPES.variant_vcf
    return { type: "variant_vcf", name: t.name, emoji: t.emoji, dbs: t.dbs, query: vcf.query, vcf, color: TYPE_COLORS.variant_vcf }
  }

  // ② 其余按正则规则
  for (const rule of RULES) {
    if (rule.re.test(q)) {
      const t = TYPES[rule.type]
      return { type: rule.type, name: t.name, emoji: t.emoji, dbs: t.dbs, query: q, color: TYPE_COLORS[rule.type] || TYPE_COLORS.unknown }
    }
  }
  const t = TYPES.unknown
  return { type: "unknown", name: t.name, emoji: t.emoji, dbs: t.dbs, query: q, color: TYPE_COLORS.unknown }
}

/**
 * 是否看起来"值得查询"（过短/纯空白/纯中文长句 → 不显示菜单）
 */
function isQueryable(raw) {
  const q = (raw || "").trim()
  if (q.length < 2 || q.length > 200) return false
  if (/^[\u4e00-\u9fa5\s，。、；：！？]+$/.test(q)) return false // 纯中文（长句）
  return true
}



/* ═══════════ 3/3 background.js ═══════════ */
/**
 * background.js —— MV3 service worker（v0.4.1）
 * 职责：右键菜单（固定结构 + 智能标题，避免 onShown 重建导致菜单不显示）、
 *      批量/VCF 路由、Zotero 联动、历史存储、消息接口、浮层注册
 *
 * v0.4.1 关键修复：不再在 onShown 里 removeAll + 重建（Edge/Chrome 上会因时序问题
 * 导致菜单不显示），改为「安装时创建固定菜单 + onShown 只更新标题/可见性」。
 */
const ROOT = "biolookup-root"
const MAX_HISTORY = 500
const FLOAT_SCRIPT_ID = "biolookup-float"
const FLOAT_MATCHES = ["http://*/*", "https://*/*"]
const ZOTERO_MATCHES = ["http://127.0.0.1:23119/*"]

/* ── 固定菜单结构（永远存在，避免动态重建） ── */
const FIXED_DBS = [
  "ncbiGene",
  "ensembl",
  "genecards",
  "uniprot",
  "dbsnp",
  "clinvar",
  "gnomad",
  "varsome",
  "geo",
  "pubmed",
  "ncbiAll",
]

function createMenus() {
  const __diag = { ts: Date.now(), total: 0, errors: [] }
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: ROOT, title: "生信快查（选中文本后可用）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:auto", parentId: ROOT, title: "🎯 智能跳转（按识别类型选首选库）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:all", parentId: ROOT, title: "🚀 一键全开（最多 5 个相关库）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "sep1", parentId: ROOT, type: "separator", contexts: ["selection"] })
    for (const dbId of FIXED_DBS) {
      const db = DBS[dbId]
      if (!db) continue
      __diag.total++
      chrome.contextMenus.create({ id: `db:${dbId}`, parentId: ROOT, title: `${db.icon} ${db.label}`, contexts: ["selection"] }, () => {
        if (chrome.runtime.lastError) __diag.errors.push(`${dbId}: ${chrome.runtime.lastError.message}`)
      })
    }
    chrome.contextMenus.create({ id: "sep2", parentId: ROOT, type: "separator", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:batch", parentId: ROOT, title: "📚 批量查询（多行 / VCF 选中时）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:zotero", parentId: ROOT, title: "📗 在 Zotero 中查找（PMID / DOI）", contexts: ["selection"] })
    __diag.total += 5
    setTimeout(() => {
      chrome.storage.local.set({ menuDiag: __diag }).catch(() => {})
    }, 400)
  })
}

/* ── 启动兜底：无论何种原因导致菜单缺失，SW 启动即创建 ── */
try {
  createMenus()
} catch (e) {
  /* 忽略：稍后 onInstalled/onStartup 还会再试 */
}

/* ── 自定义库（内存缓存，避免 onShown 异步读盘） ── */
let customCache = []
let customLoaded = false

async function loadCustomCache() {
  const { customDbs = [] } = await chrome.storage.local.get("customDbs")
  customCache = Array.isArray(customDbs) ? customDbs : []
  customLoaded = true
  for (const cd of customCache) {
    DBS[`custom:${cd.id}`] = {
      label: cd.label,
      icon: cd.icon || "⭐",
      custom: true,
      url: (q) => String(cd.template).replace(/\{q\}/g, encodeURIComponent(q)),
    }
  }
}

chrome.storage?.onChanged?.addListener((changes, area) => {
  if (area === "local" && changes.customDbs) loadCustomCache()
})

/** 合并自定义库 + 兜底库 */
function withCustom(c) {
  const extra = []
  if (customLoaded) {
    for (const cd of customCache) {
      const types = cd.types && cd.types.length ? cd.types : ["*"]
      if (!types.includes("*") && !types.includes(c.type)) continue
      extra.push(`custom:${cd.id}`)
    }
  }
  const out = [...c.dbs, ...extra]
  if (c.type !== "unknown") {
    for (const f of FALLBACK_DBS) if (!out.includes(f)) out.push(f)
  }
  return { ...c, dbs: out }
}

/* ── 安装 / 启动 ── */
chrome.runtime?.onInstalled?.addListener(async () => {
  createMenus()
  const { history, customDbs } = await chrome.storage.local.get(["history", "customDbs"])
  if (!Array.isArray(history)) await chrome.storage.local.set({ history: [] })
  if (!Array.isArray(customDbs)) await chrome.storage.local.set({ customDbs: [] })
  await loadCustomCache()
  await updateBadge()
  await syncFloatScript()
})

chrome.runtime?.onStartup?.addListener(async () => {
  createMenus() // SW 被回收后重启时确保菜单存在
  await loadCustomCache()
  updateBadge()
  syncFloatScript()
})

/* ── 菜单显示前：只更新标题与可见性（不重建） ──
 * 注意：contextMenus.onShown 需要 Chrome/Edge 116+。若该 API 不存在，
 * 下面的注册会被跳过（脚本不崩溃），菜单保持常显、点击时照样按类型智能路由。
 */
let lastKey = ""

chrome.contextMenus?.onShown?.addListener((info) => {
  const text = info.selectionText || ""
  const queryable = isQueryable(text)
  const c = queryable ? classify(text) : null

  if (!queryable || !c) {
    // 选中内容不适合查询 → 隐藏菜单
    chrome.contextMenus.update(ROOT, { visible: false }, () => chrome.contextMenus.refresh())
    lastKey = ""
    return
  }

  const vcfRows = parseVcfText(text)
  const isVcf = vcfRows.length > 1
  const isBatch = !isVcf && parseBatch(text).length > 1
  const key = `${isVcf ? "VCF" + vcfRows.length : isBatch ? "BATCH" : c.type}|${text.slice(0, 60)}`
  if (key === lastKey) {
    chrome.contextMenus.update(ROOT, { visible: true }, () => chrome.contextMenus.refresh())
    return
  }
  lastKey = key

  const color = c.color || TYPE_COLORS.unknown
  const label = isVcf
    ? `🧾 VCF ${vcfRows.length} 条变异`
    : isBatch
      ? `📚 批量 ${parseBatch(text).length} 条`
      : `${c.emoji} ${c.name}「${truncate(c.query, 18)}」`

  const updates = [
    { id: ROOT, title: `生信快查 · ${label}`, visible: true },
    { id: "act:auto", title: `🎯 智能跳转（首选 ${DBS[withCustom(c).dbs[0]]?.label || "库"}）`, visible: true },
    { id: "act:all", title: `🚀 一键全开（${Math.min(withCustom(c).dbs.length, 5)} 个相关库）`, visible: true },
    { id: "act:batch", title: `📚 批量查询（当前 ${isVcf ? vcfRows.length : isBatch ? parseBatch(text).length : 1} 条）`, visible: true },
    { id: "act:zotero", title: "📗 在 Zotero 中查找（PMID / DOI）", visible: c.type === "pmid" || c.type === "doi" },
  ]
  chrome.contextMenus.update(ROOT, { title: `生信快查 · ${label}`, visible: true }, () => {
    for (const u of updates.slice(1)) {
      chrome.contextMenus.update(u.id, { title: u.title, visible: u.visible }, () => {})
    }
    chrome.contextMenus.refresh()
  })
})

function truncate(s, n) {
  return String(s).length > n ? String(s).slice(0, n) + "…" : String(s)
}

/** 把多行/分隔符文本拆成查询条目（最多 20 条） */
function parseBatch(text) {
  return String(text)
    .split(/[\n\r,;，；\t|]+/)
    .map((s) => s.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, ""))
    .filter((s) => s.length >= 2 && s.length <= 200)
    .slice(0, 20)
}

/* ── 点击处理 ── */
chrome.contextMenus?.onClicked?.addListener(async (info) => {
  const id = String(info.menuItemId || "")
  const text = (info.selectionText || "").trim()
  const c = classify(text)
  if (!c) return
  const merged = withCustom(c)

  // 批量 / VCF
  if (id === "act:batch") {
    const vcfRows = parseVcfText(text)
    if (vcfRows.length > 1) await runVcfBatch(text, "auto")
    else await runBatch(text, "auto")
    return
  }

  // Zotero
  if (id === "act:zotero") {
    const r = await searchZotero(c.query)
    if (r.key) {
      await chrome.tabs.create({ url: `zotero://select/library/items/${r.key}` })
      await addHistory(c, "zotero")
    } else {
      flashBadge("✗", "#f472b6")
    }
    return
  }

  // 一键全开
  if (id === "act:all") {
    merged.dbs.slice(0, 5).forEach((dbId, i) => {
      const db = DBS[dbId]
      if (!db) return
      setTimeout(() => chrome.tabs.create({ url: db.url(c.query), active: false }), i * 120)
    })
    await addHistory(c, "ALL")
    return
  }

  // 智能跳转
  if (id === "act:auto") {
    const dbId = merged.dbs[0]
    const db = DBS[dbId]
    if (!db) return
    await chrome.tabs.create({ url: db.url(c.query) })
    await addHistory(c, dbId)
    return
  }

  // 指定数据库
  if (id.startsWith("db:")) {
    const dbId = id.slice(3)
    const db = DBS[dbId]
    if (!db) return
    if (db.zotero) {
      const r = await searchZotero(c.query)
      if (r.key) {
        await chrome.tabs.create({ url: `zotero://select/library/items/${r.key}` })
        await addHistory(c, "zotero")
      } else flashBadge("✗", "#f472b6")
      return
    }
    await chrome.tabs.create({ url: db.url(c.query) })
    await addHistory(c, dbId)
  }
})

function flashBadge(text, color) {
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color })
  setTimeout(() => updateBadge(), 2200)
}

/* ── 批量查询（普通清单） ── */
async function runBatch(text, mode) {
  const items = parseBatch(text)
  if (!items.length) return
  const opened = []
  items.forEach((q, i) => {
    const c = withCustom(classify(q))
    let dbKey = c.dbs[0]
    if (mode && mode !== "auto" && DBS[mode]) dbKey = mode
    const db = DBS[dbKey]
    if (!db) return
    opened.push({ q, c, dbKey })
    setTimeout(() => chrome.tabs.create({ url: db.url(c.query), active: false }), i * 150)
  })
  await pushHistory(
    opened.map(({ q, c, dbKey }) => ({
      q,
      type: c.type,
      typeName: c.name,
      emoji: c.emoji,
      db: dbKey,
      dbLabel: `${DBS[dbKey]?.label || dbKey}（批量）`,
      ts: Date.now(),
    })),
  )
}

/* ── VCF 批量注释 ── */
async function runVcfBatch(text, target) {
  const rows = parseVcfText(text)
  if (!rows.length) return
  const used = rows.slice(0, 15)

  if (target === "csv") {
    const header = "CHROM,POS,ID,REF,ALT,gnomAD_query,original"
    const body = used
      .map((r) => [r.chrom, r.pos, r.id || ".", r.ref, r.alts.join("|"), r.query, r.raw || ""].map((v) => `"${v}"`).join(","))
      .join("\n")
    await downloadCsv("\uFEFF" + header + "\n" + body, `vcf-queries-${new Date().toISOString().slice(0, 10)}.csv`)
    return
  }

  const dbFor = (r) => {
    if (target === "gnomad") return "gnomad"
    if (target === "clinvar") return "clinvar"
    if (target === "varsome") return "varsome"
    return r.kind === "rsid" ? "dbsnp" : "gnomad"
  }
  used.forEach((r, i) => {
    const db = DBS[dbFor(r)]
    if (!db) return
    setTimeout(() => chrome.tabs.create({ url: db.url(r.query), active: false }), i * 150)
  })
  await pushHistory([
    {
      q: `VCF × ${used.length}（${used[0].query}…）`,
      type: "variant_vcf",
      typeName: "VCF 批量",
      emoji: "🧾",
      db: target,
      dbLabel: `VCF 批量 → ${target}`,
      ts: Date.now(),
    },
  ])
}

/** CSV 下载（MV3 SW 无 DOM/createObjectURL，必须用 chrome.downloads） */
async function downloadCsv(text, filename) {
  const url = "data:text/csv;charset=utf-8," + encodeURIComponent(text)
  try {
    await chrome.downloads.download({ url, filename, saveAs: false })
    flashBadge("⬇", "#64ffda")
  } catch (e) {
    flashBadge("✗", "#f472b6")
  }
}

/* ── Zotero 联动 ── */
async function searchZotero(query) {
  const granted = await chrome.permissions.contains({ origins: ZOTERO_MATCHES })
  if (!granted) return { error: "需要开启 Zotero 联动（设置页）" }
  try {
    const res = await fetch(
      `http://127.0.0.1:23119/api/users/0/items?q=${encodeURIComponent(query)}&limit=5&format=json`,
      { headers: { "Zotero-Allowed-Request": "1" } },
    )
    if (!res.ok) return { error: `Zotero 返回 ${res.status}` }
    const items = await res.json()
    if (!Array.isArray(items) || !items.length) return { error: "本地 Zotero 库中未找到" }
    const first = items[0]
    return { key: first.key || first.data?.key, count: items.length }
  } catch (e) {
    return { error: "无法连接本地 Zotero（请确认 Zotero 已运行且开启 API）" }
  }
}

/* ── 消息接口（浮层 / 面板） ── */
chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    try {
      if (msg?.type === "classify") {
        if (!isQueryable(msg.text)) return sendResponse({ ok: false })
        const c = withCustom(classify(msg.text))
        const dbs = c.dbs
          .map((id) => {
            const db = DBS[id]
            if (!db) return null
            return { id, label: db.label, icon: db.icon, url: db.url(c.query) }
          })
          .filter(Boolean)
        const gene = c.type === "gene" ? lookupGene(c.query) : null
        const seq = c.type === "sequence" ? analyzeSequence(c.query) : null
        sendResponse({ ok: true, data: { ...c, dbs, gene, seq } })
        return
      }
      if (msg?.type === "openDb" || msg?.type === "openAll") {
        const c = withCustom(classify(msg.query))
        const ids = msg.type === "openDb" ? [msg.dbId] : msg.dbIds
        ids.forEach((id, i) => {
          const db = DBS[id]
          if (!db) return
          setTimeout(() => chrome.tabs.create({ url: db.url(c.query), active: false }), i * 130)
        })
        await addHistory(c, msg.type === "openDb" ? msg.dbId : "ALL")
        sendResponse({ ok: true })
        return
      }
      if (msg?.type === "runBatch") {
        const vcfRows = parseVcfText(msg.text)
        if (vcfRows.length > 1) await runVcfBatch(msg.text, msg.mode && msg.mode !== "auto" ? msg.mode : "auto")
        else await runBatch(msg.text, msg.mode || "auto")
        sendResponse({ ok: true })
        return
      }
      if (msg?.type === "menu:rebuild") {
        createMenus()
        flashBadge("✓", "#64ffda")
        sendResponse({ ok: true })
        return
      }
      // v0.6.0：扫描当前页面，提取基因 / rsID / 变异 / PMID / 数据集编号
      if (msg?.type === "scanPage") {
        let tab = null
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
          tab = tabs && tabs[0]
        } catch (e) {
          tab = null
        }
        if (!tab || !tab.id) return sendResponse({ ok: false, error: "无法获取当前标签页" })
        const injected = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => (document.body ? String(document.body.innerText).slice(0, 300000) : ""),
        })
        const text = (injected && injected[0] && injected[0].result) || ""
        if (!text) return sendResponse({ ok: false, error: "当前页面没有可扫描的文本" })
        const items = extractEntities(text, 60)
        sendResponse({ ok: true, items, url: tab.url || "", title: tab.title || "" })
        return
      }
      // v0.6.0：页面自动高亮开关（复用浮层的网页访问授权）
      if (msg?.type === "setHighlight") {
        await chrome.storage.local.set({ highlightEnabled: !!msg.enabled })
        const ok = await syncFloatScript()
        sendResponse({ ok })
        return
      }
      if (msg?.type === "highlightStatus") {
        const { highlightEnabled = false } = await chrome.storage.local.get("highlightEnabled")
        const granted = await chrome.permissions.contains({ origins: FLOAT_MATCHES })
        sendResponse({ ok: true, enabled: highlightEnabled, granted })
        return
      }
      // v0.6.0：供 content.js 取高亮词表（基因表 + 别名）
      if (msg?.type === "getHighlightTerms") {
        sendResponse({ ok: true, terms: Object.keys(GENE_INFO).concat(Object.keys(GENE_ALIAS)) })
        return
      }
      if (msg?.type === "setFloat") {
        await chrome.storage.local.set({ floatEnabled: !!msg.enabled })
        const ok = await syncFloatScript()
        sendResponse({ ok })
        return
      }
      if (msg?.type === "floatStatus") {
        const { floatEnabled = false } = await chrome.storage.local.get("floatEnabled")
        const granted = await chrome.permissions.contains({ origins: FLOAT_MATCHES })
        sendResponse({ ok: true, enabled: floatEnabled, granted })
        return
      }
      sendResponse({ ok: false })
    } catch (e) {
      sendResponse({ ok: false, error: String(e) })
    }
  })()
  return true
})

/* ── 页面脚本注册（浮层 + 高亮共用同一个 content.js） ── */
async function syncFloatScript() {
  const { floatEnabled = false, highlightEnabled = false } = await chrome.storage.local.get(["floatEnabled", "highlightEnabled"])
  const need = floatEnabled || highlightEnabled
  const granted = await chrome.permissions.contains({ origins: FLOAT_MATCHES })
  const registered = await chrome.scripting.getRegisteredContentScripts().catch(() => [])
  const has = registered.some((s) => s.id === FLOAT_SCRIPT_ID)

  if (need && granted && !has) {
    await chrome.scripting.registerContentScripts([
      { id: FLOAT_SCRIPT_ID, matches: FLOAT_MATCHES, js: ["content.js"], runAt: "document_idle", allFrames: false },
    ])
    try {
      const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] })
      await Promise.all(
        tabs.map((t) =>
          t.id ? chrome.scripting.executeScript({ target: { tabId: t.id }, files: ["content.js"] }).catch(() => {}) : Promise.resolve(),
        ),
      )
    } catch (e) {
      /* 受限页面注入失败可忽略 */
    }
    return true
  }
  if ((!need || !granted) && has) {
    await chrome.scripting.unregisterContentScripts({ ids: [FLOAT_SCRIPT_ID] })
    return false
  }
  return need && granted
}

/* ── 历史与徽章 ── */
async function addHistory(c, dbId) {
  await pushHistory([
    {
      q: c.query,
      type: c.type,
      typeName: c.name,
      emoji: c.emoji,
      db: dbId,
      dbLabel: dbId === "ALL" ? "全部库" : DBS[dbId]?.label || dbId,
      ts: Date.now(),
    },
  ])
}

async function pushHistory(entries) {
  if (!entries.length) return
  const { history = [] } = await chrome.storage.local.get("history")
  const keys = new Set(entries.map((e) => `${e.q}|${e.db}`))
  const rest = history.filter((h) => !keys.has(`${h.q}|${h.db}`))
  const next = [...entries.reverse(), ...rest].slice(0, MAX_HISTORY)
  await chrome.storage.local.set({ history: next })
  await updateBadge()
}

async function updateBadge() {
  const { history = [] } = await chrome.storage.local.get("history")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const n = history.filter((h) => h.ts >= today.getTime()).length
  chrome.action.setBadgeText({ text: n > 0 ? String(n) : "" })
  chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" })
}

