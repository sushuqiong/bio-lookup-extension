/**
 * genedata.js —— v0.4 数据层
 * ① 类型主题色 ② 内置肿瘤/临床相关基因速查表 ③ 序列工具
 * 纯数据 + 纯函数，可单测，无 chrome API 依赖
 */

/* ── ① 类型主题色（色彩贯穿菜单/历史/卡片/浮层/统计） ── */
export const TYPE_COLORS = {
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
export const GENE_INFO = {
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
export const GENE_ALIAS = {
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
export function lookupGene(raw) {
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

export function geneTableSize() {
  return Object.keys(GENE_INFO).length
}

/* ── ③ 序列工具 ── */
const COMP = {
  A: "T", T: "A", C: "G", G: "C", U: "A", N: "N",
  R: "Y", Y: "R", S: "S", W: "W", K: "M", M: "K",
  B: "V", V: "B", D: "H", H: "D",
}

export function reverseComplement(seq) {
  return String(seq)
    .toUpperCase()
    .split("")
    .reverse()
    .map((c) => COMP[c] || c)
    .join("")
}

export function transcribe(seq) {
  return String(seq).toUpperCase().replace(/T/g, "U")
}

export function gcContent(seq) {
  const s = String(seq).toUpperCase().replace(/[^ACGTU]/g, "")
  if (!s.length) return 0
  const gc = (s.match(/[GC]/g) || []).length
  return Math.round((gc / s.length) * 1000) / 10
}

/** 序列分析摘要：长度 / GC% / 反向互补 / RNA 转录 */
export function analyzeSequence(seq) {
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
export function extractEntities(text, limit = 40) {
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

  const upper = t.toUpperCase()

  // ① 已知基因（严格词边界，避免子串误匹配）
  for (const g of Object.keys(GENE_INFO)) {
    const re = new RegExp(`(?<![A-Z0-9])${escRe(g)}(?![A-Z0-9])`, "gi")
    const m = upper.match(re)
    if (m) for (let i = 0; i < m.length; i++) add(g, "gene")
  }
  // ② 基因别名（HER2 / PD-L1 / p53 等）
  for (const [alias, official] of Object.entries(GENE_ALIAS)) {
    const re = new RegExp(`(?<![A-Z0-9-])${escRe(alias)}(?![A-Z0-9-])`, "gi")
    const m = upper.match(re)
    if (m) for (let i = 0; i < m.length; i++) add(official, "gene")
  }
  // ③ rsID
  for (const m of t.match(/(?<![A-Za-z0-9])rs\s?\d{4,}(?![A-Za-z0-9])/gi) || []) add(m.replace(/\s+/g, "").toLowerCase(), "variant_rs")
  // ④ GEO / SRA 编号
  for (const m of t.match(/(?<![A-Za-z0-9])(GSE|GSM|GDS|GPL)\s?\d{3,}(?![A-Za-z0-9])/gi) || [])
    add(m.replace(/\s+/g, "").toUpperCase(), "geo")
  // ⑤ PMID
  for (const m of t.match(/PMID:?\s?\d{7,9}/gi) || []) add(m.replace(/PMID:?\s?/i, ""), "pmid")
  // ⑥ DOI
  for (const m of t.match(/10\.\d{4,9}\/[^\s"'<>)\]]+/g) || []) add(m.replace(/[.,;)]+$/, ""), "doi")
  // ⑦ 坐标型变异（chr17:7676154 C>T 等）
  for (const m of t.match(/(?<![A-Za-z0-9])(?:chr)?\d{1,2}:\d{2,}\s?[ACGT]{1,}>[ACGT]{1}/gi) || [])
    add(m.replace(/\s+/g, " ").trim(), "variant_coord")

  return [...hits.values()].sort((a, b) => b.count - a.count || a.q.localeCompare(b.q)).slice(0, limit)
}

/** 页面高亮用的高置信目标集合（仅返回"明确能识别"的词，避免误标） */
export function buildHighlightTerms() {
  const terms = []
  for (const g of Object.keys(GENE_INFO)) terms.push({ q: g, type: "gene", exact: true })
  for (const alias of Object.keys(GENE_ALIAS)) terms.push({ q: alias, type: "gene", exact: true })
  return terms
}
