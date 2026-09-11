/**
 * v0.6.0 页面扫描 / 高亮词表测试
 * 运行：node tests/scan.test.mjs
 */
import { extractEntities, buildHighlightTerms, GENE_INFO, GENE_ALIAS } from "../classify.js"

let pass = 0, fail = 0
const check = (c, label) => { if (c) { pass++; console.log(`  ✅ ${label}`) } else { fail++; console.log(`  ❌ ${label}`) } }

console.log("① 论文摘要式文本提取")
const text = `BRCA1 germline variants and TP53 mutations were analysed.
Expression data from GSE123456; variant rs80357906 was validated by Sanger.
Coordinates: chr17:7676154 C>T. See PMID: 12345678 and doi 10.1038/s41586-020-2008-3.
HER2 (ERBB2) amplification and CD274 (PD-L1) expression were also assessed.
BRCA1 was mentioned twice.`
const r = extractEntities(text)
const byQ = Object.fromEntries(r.map((x) => [x.q.toUpperCase(), x]))
check(r.length >= 7, `提取到 ${r.length} 个实体`)
check(!!byQ["BRCA1"], "BRCA1 命中")
check(byQ["BRCA1"]?.count === 2, `BRCA1 计数 = ${byQ["BRCA1"]?.count}（应为 2）`)
check(!!byQ["TP53"], "TP53 命中")
check(!!byQ["ERBB2"], "HER2 → ERBB2 别名解析")
check(!!byQ["CD274"] || !!byQ["PD-L1"], "PD-L1 / CD274 命中")
check(!!byQ["RS80357906"], "rsID 命中")
check(!!byQ["GSE123456"], "GEO 编号命中")
check(!!byQ["12345678"], "PMID 命中")
check(r.some((x) => x.type === "doi" && x.q.includes("10.1038")), "DOI 命中")
check(r.some((x) => x.type === "variant_coord"), "坐标变异命中")
check(r[0].count >= r[r.length - 1].count, "按出现次数降序排列")

console.log("\n② 边界与误报控制")
check(extractEntities("").length === 0, "空文本 → 0 条")
check(extractEntities("今天天气很好，我们去吃饭吧").length === 0, "纯中文句子 → 0 条")
// 不应把 BRCA1A / xBRCA1 之类当成 BRCA1
const r2 = extractEntities("BRCA1A and xBRCA1 and BRCA1")
check(r2.length === 1 && r2[0].q === "BRCA1", "严格词边界（BRCA1A/xBRCA1 不误报）")
// 超长文本不崩溃
check(Array.isArray(extractEntities("BRCA1 ".repeat(5000))), "超长文本可处理（5000 次重复）")
// 上限
check(extractEntities(text, 3).length <= 3, "limit 参数生效")

console.log("\n③ 高亮词表")
const terms = buildHighlightTerms()
check(terms.length === Object.keys(GENE_INFO).length + Object.keys(GENE_ALIAS).length, `词表 = 基因 ${Object.keys(GENE_INFO).length} + 别名 ${Object.keys(GENE_ALIAS).length} = ${terms.length}`)
check(terms.every((t) => t.q && t.type === "gene"), "每个词条都有内容且类型为 gene")
check(terms.some((t) => t.q === "HER2"), "别名 HER2 在词表中")
check(terms.some((t) => t.q === "BRCA1"), "基因 BRCA1 在词表中")

console.log(`\n扫描/高亮测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
