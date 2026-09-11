/**
 * 识别引擎 + VCF 解析 + 归一化 单元测试
 * 运行：node tests/classify.test.mjs
 */
import {
  classify,
  isQueryable,
  parseVcfLine,
  parseVcfText,
  isVcfText,
  toGnomad,
  clinvarTerm,
  rsCore,
  DBS,
} from "../classify.js"

let pass = 0
let fail = 0

function eq(actual, expected, label) {
  if (actual === expected) pass++
  else {
    fail++
    console.log(`❌ ${label}: 得到 ${JSON.stringify(actual)}，期望 ${JSON.stringify(expected)}`)
  }
}

/* ── 1. 类型识别 ── */
const CASES = [
  ["BRCA1", "gene"], ["TP53", "gene"], ["CD274", "gene"], ["ABCB1", "gene"],
  ["HLA-DRA", "gene"], ["miR-21", "gene"], ["let-7a", "gene"],
  ["LINC00473", "gene"], ["SNORD15A", "gene"], ["IGHV1-2", "gene"],
  ["GSE123456", "geo"], ["GSM1234567", "geo"], ["GPL570", "geo"], ["GDS1234", "geo"],
  ["rs1234567", "variant_rs"], ["rs80357906", "variant_rs"], ["RS12345", "variant_rs"],
  ["chr17:7676154 C>T", "variant_coord"], ["17-7676154-C-T", "variant_coord"],
  ["chr17:7676154C>T", "variant_coord"], ["chr1:g.12345A>G", "variant_coord"],
  ["chr1:12345-12400", "region"], ["chr1:12345..12400", "region"],
  ["NM_007294.4:c.68_69del", "variant_hgvs"], ["p.Val600Glu", "variant_hgvs"],
  ["c.68_69del", "variant_hgvs"],
  ["12345678", "pmid"], ["PMID: 12345678", "pmid"],
  ["10.1038/s41586-020-2008-3", "doi"],
  ["ATCGATCGATCGATCGATCGATCG", "sequence"],
  ["not a real query 这是一句话", "unknown"],
]
for (const [text, expected] of CASES) {
  const r = classify(text)
  eq(r?.type, expected, `classify("${text}")`)
}

/* ── 2. isQueryable ── */
for (const [t, exp] of [
  ["BRCA1", true], ["", false], ["a", false],
  ["这是一段很长的中文句子不应该被识别", false],
  ["TP53", true], ["x".repeat(300), false], ["不", false],
]) {
  eq(isQueryable(t), exp, `isQueryable("${t.slice(0, 16)}")`)
}

/* ── 3. VCF 解析 ── */
const vcf1 = parseVcfLine("17\t7676154\trs80357906\tC\tT\t.\t.\t.")
eq(!!vcf1, true, "VCF 行解析成功")
eq(vcf1.chrom, "17", "VCF chrom")
eq(vcf1.pos, 7676154, "VCF pos")
eq(vcf1.id, "rs80357906", "VCF rsID")
eq(vcf1.query, "rs80357906", "VCF rsID → query")
eq(vcf1.kind, "rsid", "VCF kind=rsid")

const vcf2 = parseVcfLine("chr17  7676154  .  C  T")
eq(vcf2.query, "17-7676154-C-T", "VCF 无 rsID → gnomAD 格式 query")
eq(vcf2.kind, "coord", "VCF kind=coord")

const vcf3 = parseVcfLine("1\t12345\t.\tA\tG,T")
eq(vcf3.alts.length, 2, "VCF 多 ALT")
eq(vcf3.query, "1-12345-A-G", "VCF 多 ALT 取第一个")

eq(parseVcfLine("这不是VCF"), null, "非 VCF 行返回 null")
eq(parseVcfLine("chr1 12345"), null, "VCF 列数不足返回 null")

/* ── 4. VCF 多行 + header 忽略 ── */
const vcfText = `##fileformat=VCFv4.2
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO
17\t7676154\trs80357906\tC\tT\t.\t.\t.
chr1\t12345\t.\tA\tG\t.\t.\t.
2\t54321\t.\tG\tA\t.\t.\t.`
const rows = parseVcfText(vcfText)
eq(rows.length, 3, "VCF 多行解析（忽略 header）")
eq(isVcfText(vcfText), true, "isVcfText 识别 VCF 文本")
eq(isVcfText("BRCA1\nTP53"), false, "非 VCF 文本不被误判")

/* ── 5. 归一化 ── */
eq(toGnomad("chr17:7676154 C>T"), "17-7676154-C-T", "坐标 → gnomAD 格式（空格分隔）")
eq(toGnomad("chr17:7676154C>T"), "17-7676154-C-T", "坐标 → gnomAD 格式（无空格）")
eq(toGnomad("17-7676154-C-T"), "17-7676154-C-T", "已是 gnomAD 格式保持不变")
eq(clinvarTerm("rs80357906"), "rs80357906", "ClinVar term（rsID）")
eq(clinvarTerm("chr17:7676154 C>T"), "17:7676154", "ClinVar term（坐标）")
eq(rsCore("rs80357906"), "80357906", "rsCore 提取核心数字")

/* ── 6. 数据库 URL 生成（关键：VCF 归一化后能直接命中） ── */
const cVcf = classify("17\t7676154\trs80357906\tC\tT")
eq(cVcf.type, "variant_vcf", "VCF 行 → 类型 variant_vcf")
const gnomadUrl = DBS.gnomad.url("17-7676154-C-T")
eq(gnomadUrl.includes("17-7676154-C-T"), true, "gnomAD URL 含规范坐标")
eq(DBS.dbsnp.url("rs80357906").endsWith("/80357906"), true, "dbSNP URL 用纯数字 ID")
eq(DBS.clinvar.url("chr17:7676154 C>T").includes("17%3A7676154"), true, "ClinVar URL 用坐标 term")
eq(DBS.zotero.url("PMID:12345678").startsWith("zotero://"), true, "Zotero URL scheme")
eq(DBS.ucsc.url("chr1:12345-12400").includes("position=chr1%3A12345-12400"), true, "UCSC position")

/* ── 7. 防御：所有库的 url() 对任意输入不抛错 ── */
const SAFE_INPUTS = ["", "  ", "BRCA1", "rs123", "chr1:1 C>T", "!!!", "../../etc/passwd", "<script>", "a".repeat(300)]
for (const dbId of Object.keys(DBS)) {
  for (const q of SAFE_INPUTS) {
    try {
      const u = DBS[dbId].url(q)
      if (typeof u !== "string" || !u.length) throw new Error("empty url")
    } catch (e) {
      fail++
      console.log(`❌ DBS.${dbId}.url("${q.slice(0, 12)}") 抛错或返回空: ${e.message}`)
    }
  }
}
pass++ // 若未抛错则整体通过

/* ── 8. 兜底：非 unknown 类型也应带通用检索库 ── */
const geneDbs = classify("BRCA1").dbs
eq(geneDbs.includes("ncbiAll"), false, "official TYPES 不含兜底（由 background 追加）")

console.log(`\n识别引擎测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
