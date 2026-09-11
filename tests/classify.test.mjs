/**
 * 识别引擎单元测试
 * 运行：node tests/classify.test.mjs
 */
import { classify, isQueryable } from "../classify.js"

const CASES = [
  // 基因
  ["BRCA1", "gene"], ["TP53", "gene"], ["CD274", "gene"], ["ABCB1", "gene"],
  ["HLA-DRA", "gene"], ["miR-21", "gene"], ["let-7a", "gene"],
  ["LINC00473", "gene"], ["SNORD15A", "gene"], ["IGHV1-2", "gene"],
  // GEO / 数据集
  ["GSE123456", "geo"], ["GSM1234567", "geo"], ["GPL570", "geo"], ["GDS1234", "geo"],
  // SNP
  ["rs1234567", "variant_rs"], ["rs80357906", "variant_rs"], ["RS12345", "variant_rs"],
  // 坐标变异
  ["chr17:7676154 C>T", "variant_coord"], ["17-7676154-C-T", "variant_coord"],
  ["chr17:7676154C>T", "variant_coord"], ["chr1:g.12345A>G", "variant_coord"],
  // 区间
  ["chr1:12345-12400", "region"], ["chr1:12345..12400", "region"],
  // HGVS
  ["NM_007294.4:c.68_69del", "variant_hgvs"], ["p.Val600Glu", "variant_hgvs"],
  ["c.68_69del", "variant_hgvs"],
  // 文献
  ["12345678", "pmid"], ["PMID: 12345678", "pmid"], ["PMID:12345678", "pmid"],
  ["10.1038/s41586-020-2008-3", "doi"],
  // 序列
  ["ATCGATCGATCGATCGATCGATCG", "sequence"],
  // 未知
  ["not a real query 这是一句话", "unknown"],
]

const QUERYABLE = [
  ["BRCA1", true], ["", false], ["a", false],
  ["这是一段很长的中文句子不应该被识别", false],
  ["TP53", true], ["x".repeat(300), false], ["不", false],
]

let pass = 0
let fail = 0

for (const [text, expected] of CASES) {
  const r = classify(text)
  if (r && r.type === expected) pass++
  else {
    fail++
    console.log(`❌ classify("${text}") = ${r?.type}，期望 ${expected}`)
  }
}

for (const [text, expected] of QUERYABLE) {
  const r = isQueryable(text)
  if (r === expected) pass++
  else {
    fail++
    console.log(`❌ isQueryable("${text.slice(0, 20)}") = ${r}，期望 ${expected}`)
  }
}

console.log(`\n识别引擎测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
