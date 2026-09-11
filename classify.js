/**
 * classify.js —— 选中文本类型识别 + 数据库映射
 * 纯函数，无 chrome API 依赖，便于单测与复用
 */

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
  dbsnp: { label: "dbSNP", icon: "🔎", url: (q) => `https://www.ncbi.nlm.nih.gov/snp/${enc(q)}` },
  clinvar: { label: "ClinVar", icon: "🏥", url: (q) => (q.toLowerCase().startsWith("rs") ? `https://www.ncbi.nlm.nih.gov/clinvar/?term=${enc(q)}` : `https://www.ncbi.nlm.nih.gov/clinvar/variation/?term=${enc(q)}`) },
  gnomad: { label: "gnomAD", icon: "🌍", url: (q) => `https://gnomad.broadinstitute.org/variant/${enc(q)}?dataset=gnomad_r4` },
  varsome: { label: "VarSome", icon: "🧪", url: (q) => `https://varsome.com/variant/hg38/${enc(q)}` },
  franklin: { label: "Franklin", icon: "🧠", url: (q) => `https://franklin.genoox.com/clinical-db/variant/${enc(q)}` },
  // 基因组区间 / 序列
  ucsc: { label: "UCSC Genome Browser", icon: "🗺️", url: (q) => `https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=${enc(q)}` },
  blast: { label: "NCBI BLAST", icon: "🚀", url: (q) => `https://blast.ncbi.nlm.nih.gov/Blast.cgi?PAGE_TYPE=BlastSearch&USER_FORMAT_DEFAULTS=on&SET_AND_ORGANISM=on&QUERY=${enc(q)}` },
  // 通用
  ncbiAll: { label: "NCBI 全库", icon: "🔍", url: (q) => `https://www.ncbi.nlm.nih.gov/search/all/?term=${enc(q)}` },
  googleScholar: { label: "Google Scholar", icon: "🎓", url: (q) => `https://scholar.google.com/scholar?q=${enc(q)}` },
}

function enc(s) {
  return encodeURIComponent(s)
}

/* ── 各类型的推荐库（顺序即菜单顺序，第一个为"首选"） ── */
export const TYPES = {
  gene: { name: "基因", emoji: "🧬", dbs: ["ncbiGene", "ensembl", "genecards", "uniprot", "pubmed", "ncbiProtein"] },
  variant_rs: { name: "SNP (rsID)", emoji: "🔎", dbs: ["dbsnp", "clinvar", "gnomad", "varsome", "franklin"] },
  variant_hgvs: { name: "变异 (HGVS)", emoji: "🧪", dbs: ["clinvar", "gnomad", "varsome", "franklin"] },
  variant_coord: { name: "变异 (坐标)", emoji: "🌍", dbs: ["gnomad", "clinvar", "varsome", "ucsc"] },
  geo: { name: "GEO 数据集", emoji: "📦", dbs: ["geo", "sra", "arrayexpress", "pubmed"] },
  pmid: { name: "文献 (PMID)", emoji: "📚", dbs: ["pubmed", "europepmc", "googleScholar"] },
  doi: { name: "文献 (DOI)", emoji: "🔖", dbs: ["europepmc", "pubmed", "googleScholar"] },
  region: { name: "基因组区间", emoji: "🗺️", dbs: ["ucsc", "ensembl"] },
  sequence: { name: "核酸序列", emoji: "🚀", dbs: ["blast", "ncbiAll"] },
  unknown: { name: "通用查询", emoji: "🔍", dbs: ["ncbiAll", "pubmed", "googleScholar", "ensembl", "genecards"] },
}

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
 * 识别选中文本类型，返回 { type, name, emoji, dbs, query }
 */
export function classify(raw) {
  const q = (raw || "").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
  if (!q) return null
  for (const rule of RULES) {
    if (rule.re.test(q)) {
      const t = TYPES[rule.type]
      return { type: rule.type, name: t.name, emoji: t.emoji, dbs: t.dbs, query: q }
    }
  }
  const t = TYPES.unknown
  return { type: "unknown", name: t.name, emoji: t.emoji, dbs: t.dbs, query: q }
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
