import { TYPE_COLORS, GENE_INFO, lookupGene, geneTableSize, analyzeSequence, reverseComplement, gcContent, classify } from "../classify.js"

let pass = 0, fail = 0
const eq = (a, b, label) => { if (JSON.stringify(a) === JSON.stringify(b)) pass++; else { fail++; console.log(`❌ ${label}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`) } }

// 类型色
eq(Object.keys(TYPE_COLORS).length, 11, "类型色数量")
eq(classify("BRCA1").color, "#64ffda", "基因类型色")
eq(classify("rs123456").color, "#f472b6", "SNP 类型色")
eq(classify("GSE123456").color, "#fbbf24", "GEO 类型色")

// 基因表
console.log(`基因速查表: ${geneTableSize()} 个基因`)
eq(lookupGene("BRCA1").gene, "BRCA1", "BRCA1 命中")
eq(lookupGene("brca1").gene, "BRCA1", "小写命中")
eq(lookupGene("her2").gene, "ERBB2", "别名 HER2 → ERBB2")
eq(lookupGene("PD-L1").gene, "CD274", "别名 PD-L1 → CD274")
eq(lookupGene("CLDN18.2").gene, "CLDN18", "别名 CLDN18.2 → CLDN18")
eq(lookupGene("P53").gene, "TP53", "别名 p53 → TP53")
eq(lookupGene("XYZNOTAGENE"), null, "未知基因返回 null")
eq(lookupGene("TP53").info.pathway, "p53 信号通路", "TP53 通路")
eq(lookupGene("EGFR").info.cancers.includes("非小细胞肺癌"), true, "EGFR 癌种")
eq(lookupGene("CD274").info.cancers.includes("泛癌免疫治疗标志"), true, "CD274 癌种")

// 序列工具
eq(reverseComplement("ATCG"), "CGAT", "反向互补")
eq(reverseComplement("atcg"), "CGAT", "反向互补（小写）")
eq(reverseComplement("ATNG"), "CNAT", "反向互补（含 N）")
eq(gcContent("ATCG"), 50, "GC 含量")
eq(gcContent("GGCC"), 100, "GC 含量 100%")
eq(analyzeSequence("AB"), null, "过短序列返回 null")
eq(analyzeSequence("XYZ"), null, "非核酸字符返回 null")
const an = analyzeSequence("ATCGATCGATCG")
eq(an.length, 12, "序列长度")
eq(an.gc, 50, "序列 GC%")
eq(an.rc, reverseComplement("ATCGATCGATCG"), "序列 RC")
eq(an.rna.includes("U"), true, "RNA 转录含 U")

// 防御：所有基因条目结构完整
let bad = 0
for (const [g, info] of Object.entries(GENE_INFO)) {
  if (!info.cn || !Array.isArray(info.cancers) || !info.pathway || !info.cancers.length) { bad++; console.log(`❌ ${g} 数据不完整`) }
  if (!/^[A-Z0-9.]+$/.test(g)) { bad++; console.log(`❌ ${g} 符号格式异常`) }
}
if (bad === 0) pass++; else fail++

console.log(`\n数据层测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
