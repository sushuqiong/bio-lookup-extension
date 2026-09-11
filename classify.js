/**
 * classify.js —— 选中文本类型识别 + 数据库映射
 * 纯函数，无 chrome API 依赖，便于单测与复用
 * v0.4：引入类型主题色 + 基因速查表 + 序列工具（见 genedata.js）
 */
import { TYPE_COLORS } from "./genedata.js"

export * from "./genedata.js"

/* ── 数据库定义：{ id, label, icon, url(q) } ── */
export const DBS = {
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
export function rsCore(q) {
  const m = String(q).match(/rs\s*(\d+)/i)
  return m ? m[1] : String(q).trim()
}

/** 坐标归一化成 gnomAD / VarSome 需要的 CHROM-POS-REF-ALT */
export function toGnomad(q) {
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
export function clinvarTerm(q) {
  const s = String(q).trim()
  if (/^rs\d+/i.test(s)) return s.match(/rs\d+/i)[0]
  const m = s.match(/^(?:chr)?([0-9]{1,2}|[XYM]|MT)[:\-]g?\.?(\d+)/i)
  if (m) return `${m[1]}:${m[2]}`
  return s
}

/** UCSC position 参数 */
export function regionNorm(q) {
  return String(q).trim().replace(/^chr/i, "chr").replace(/\s+/g, "")
}

/* ── VCF 记录解析（v0.3） ── */

/**
 * 解析一行 VCF（TAB 或空格分隔，至少到 ALT）：CHROM POS ID REF ALT ...
 * 返回 { chrom, pos, id, ref, alts, query, kind } 或 null
 */
export function parseVcfLine(line) {
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
export function isVcfText(text) {
  const lines = String(text).trim().split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"))
  return lines.length >= 1 && lines.every((l) => parseVcfLine(l) !== null)
}

/** 从多行文本中提取 VCF 记录（忽略 ## header 与空行） */
export function parseVcfText(text) {
  return String(text)
    .split(/\r?\n/)
    .map((l) => (l.startsWith("#") ? null : parseVcfLine(l)))
    .filter(Boolean)
    .slice(0, 50)
}

/* ── 各类型的推荐库（顺序即菜单顺序，第一个为"首选"） ── */
export const TYPES = {
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
export const FALLBACK_DBS = ["ncbiAll", "googleScholar"]

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
export function classify(raw) {
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
export function isQueryable(raw) {
  const q = (raw || "").trim()
  if (q.length < 2 || q.length > 200) return false
  if (/^[\u4e00-\u9fa5\s，。、；：！？]+$/.test(q)) return false // 纯中文（长句）
  return true
}

export { enc }
