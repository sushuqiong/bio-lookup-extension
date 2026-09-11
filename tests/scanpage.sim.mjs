/**
 * 扫描本页（scanPage）消息链路测试：
 * 模拟 popup → background → chrome.scripting.executeScript → extractEntities 全流程
 * 运行：node tests/scanpage.sim.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, "..")

const PAGE_TEXT = `BRCA1 germline variants and TP53 mutations were analysed in 320 patients.
Expression profiles from GSE123456 and GSE654321 were re-analysed.
Variant rs80357906 was validated; rs429358 was also genotyped.
Coordinate chr17:7676154 C>T showed low population frequency.
See PMID: 12345678 and doi 10.1038/s41586-020-2008-3 for details.
CD274 (PD-L1) and HER2 expression correlated with response. BRCA1 again.`

let execCalls = []
let responses = []

globalThis.chrome = {
  runtime: {
    onInstalled: { addListener: () => {} },
    onStartup: { addListener: () => {} },
    onMessage: { addListener: (fn) => (messageHandler = fn) },
    getManifest: () => ({ version: "0.6.1" }),
    lastError: null,
  },
  contextMenus: {
    removeAll: (cb) => cb && cb(),
    create: () => {},
    update: () => {},
    refresh: () => {},
    onShown: { addListener: () => {} },
    onClicked: { addListener: () => {} },
  },
  storage: { local: { get: async () => ({}), set: async () => {} }, onChanged: { addListener: () => {} } },
  action: { setBadgeText: () => {}, setBadgeBackgroundColor: () => {} },
  tabs: {
    query: async () => [{ id: 42, url: "https://pubmed.ncbi.nlm.nih.gov/12345678/", title: "A paper" }],
    create: () => {},
  },
  scripting: {
    executeScript: async (opts) => {
      execCalls.push(opts)
      // 注意：func 是"在页面上下文执行"的函数，Node 里没有 document，不能真的调用它。
      // 这里只检查它的形态（自包含、无外部引用），直接返回模拟的页面文本。
      return [{ result: PAGE_TEXT }]
    },
    registerContentScripts: async () => {},
    getRegisteredContentScripts: async () => [],
    unregisterContentScripts: async () => {},
  },
  permissions: { contains: async () => false },
  downloads: { download: async () => {} },
}

let messageHandler = null

const tmp = path.join(root, "_scanpage_tmp.mjs")
fs.copyFileSync(path.join(root, "background.bundle.js"), tmp)
await import("file://" + tmp.replace(/\\/g, "/") + "?t=" + Date.now())
fs.unlinkSync(tmp)

let pass = 0, fail = 0
const check = (c, label) => { if (c) { pass++; console.log(`  ✅ ${label}`) } else { fail++; console.log(`  ❌ ${label}`) } }

function send(msg) {
  return new Promise((resolve) => {
    messageHandler(msg, {}, resolve)
  })
}

console.log("① scanPage 消息链路")
const res = await send({ type: "scanPage" })
check(res && res.ok === true, "返回 ok")
check(execCalls.length === 1, "调用了 chrome.scripting.executeScript 一次")
check(execCalls[0] && execCalls[0].target && typeof execCalls[0].target.tabId === "number", "指定了 tabId")
check(execCalls[0] && typeof execCalls[0].func === "function", "以 func 形式注入（自包含函数）")
const funcSrc = execCalls[0] ? String(execCalls[0].func) : ""
check(/document\.body/.test(funcSrc), "注入函数读取 document.body（页面上下文）")
check(!/extractEntities|PAGE_TEXT|GENE_INFO/.test(funcSrc), "注入函数不含外部变量引用（MV3 要求自包含）")
check(res.title === "A paper" && res.url.includes("pubmed"), "回传页面 URL 与标题")

console.log("\n② 提取结果质量")
const items = res.items || []
const qs = items.map((i) => i.q.toUpperCase())
check(items.length >= 8, `提取到 ${items.length} 个实体`)
check(qs.includes("BRCA1"), "BRCA1")
check(qs.includes("TP53"), "TP53")
check(qs.includes("ERBB2"), "HER2 → ERBB2 别名解析")
check(qs.includes("GSE123456") && qs.includes("GSE654321"), "两个 GEO 编号")
check(qs.includes("RS80357906") && qs.includes("RS429358"), "两个 rsID")
check(qs.includes("12345678"), "PMID")
check(items.some((i) => i.type === "doi"), "DOI")
check(items.some((i) => i.type === "variant_coord"), "坐标变异")
const brca1 = items.find((i) => i.q.toUpperCase() === "BRCA1")
check(brca1 && brca1.count === 2, `BRCA1 计数 = ${brca1 && brca1.count}（文本中出现 2 次）`)
check(items[0].count >= items[items.length - 1].count, "按出现次数降序")

console.log("\n③ 异常路径")
const savedQuery = chrome.tabs.query
chrome.tabs.query = async () => []
const r2 = await send({ type: "scanPage" })
check(r2 && r2.ok === false && r2.error, `无标签页时返回错误：${r2 && r2.error}`)
chrome.tabs.query = async () => [{ id: 7, url: "chrome://newtab", title: "新标签页" }]
const savedExec = chrome.scripting.executeScript
chrome.scripting.executeScript = async () => [{ result: "" }]
const r3 = await send({ type: "scanPage" })
check(r3 && r3.ok === false, `页面无文本时优雅返回：${r3 && r3.error}`)
chrome.tabs.query = savedQuery
chrome.scripting.executeScript = savedExec

console.log("\n④ 高亮词表接口")
const r4 = await send({ type: "getHighlightTerms" })
check(r4 && r4.ok && Array.isArray(r4.terms), "返回词表数组")
check(r4.terms.length >= 100, `词表含 ${r4.terms.length} 个词条`)
check(r4.terms.includes("BRCA1") && r4.terms.includes("HER2"), "含基因与别名")

console.log(`\n扫描链路测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
