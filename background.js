/**
 * background.js —— MV3 service worker
 * 职责：动态右键菜单（按选中文本类型只显示相关数据库）+ 查询历史存储 + 徽章计数
 */
import { classify, isQueryable, DBS, parseVcfText, FALLBACK_DBS, TYPE_COLORS, lookupGene, analyzeSequence } from "./classify.js"

const ROOT = "biolookup-root"
const MAX_HISTORY = 500
const FLOAT_SCRIPT_ID = "biolookup-float"
const FLOAT_MATCHES = ["http://*/*", "https://*/*"]
const ZOTERO_MATCHES = ["http://127.0.0.1:23119/*"]

/* ── 自定义数据库：内存缓存（避免 onShown 时异步读盘导致菜单闪烁） ── */
let customCache = []
let customLoaded = false

async function loadCustomCache() {
  const { customDbs = [] } = await chrome.storage.local.get("customDbs")
  customCache = Array.isArray(customDbs) ? customDbs : []
  customLoaded = true
  // 同步注册到 DBS（URL 模板展开）
  for (const cd of customCache) {
    DBS[`custom:${cd.id}`] = {
      label: cd.label,
      icon: cd.icon || "⭐",
      custom: true,
      url: (q) => String(cd.template).replace(/\{q\}/g, encodeURIComponent(q)),
    }
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.customDbs) loadCustomCache()
})

/** 把自定义库按类型合并进推荐列表，并追加兜底通用检索 */
function withCustom(c) {
  if (!customLoaded) return { ...c, dbs: mergeFallback(c.dbs, c.type) }
  const extra = []
  for (const cd of customCache) {
    const types = cd.types && cd.types.length ? cd.types : ["*"]
    if (!types.includes("*") && !types.includes(c.type)) continue
    extra.push(`custom:${cd.id}`)
  }
  return { ...c, dbs: mergeFallback([...c.dbs, ...extra], c.type) }
}

/** 追加兜底库（防误判后无路可走），去重 */
function mergeFallback(dbs, type) {
  const out = [...dbs]
  for (const f of FALLBACK_DBS) {
    if (type === "unknown") break // unknown 已包含通用库
    if (!out.includes(f)) out.push(f)
  }
  return out
}

/* ── 安装：创建根菜单 + 初始化存储 ── */
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ROOT,
      title: "生信快查",
      contexts: ["selection"],
    })
  })
  const { history, customDbs } = await chrome.storage.local.get(["history", "customDbs"])
  if (!Array.isArray(history)) await chrome.storage.local.set({ history: [] })
  if (!Array.isArray(customDbs)) await chrome.storage.local.set({ customDbs: [] })
  await loadCustomCache()
  await updateBadge()
  await syncFloatScript()
})

chrome.runtime.onStartup?.addListener(async () => {
  await loadCustomCache()
  updateBadge()
  syncFloatScript()
})

/* ── 动态菜单：每次右键显示前，按类型重建（同步，避免闪烁） ── */
let lastKey = ""

chrome.contextMenus.onShown.addListener((info) => {
  const text = info.selectionText || ""
  if (!isQueryable(text)) {
    chrome.contextMenus.update(ROOT, { visible: false }, () => chrome.contextMenus.refresh())
    return
  }
  const vcfRows = parseVcfText(text)
  const isVcf = vcfRows.length > 1
  const isBatch = !isVcf && parseBatch(text).length > 1
  const key = `${isVcf ? "VCF" + vcfRows.length : isBatch ? "BATCH" : classify(text).type}|${text.slice(0, 60)}`
  if (key === lastKey) {
    chrome.contextMenus.update(ROOT, { visible: true }, () => chrome.contextMenus.refresh())
    return
  }
  lastKey = key
  chrome.contextMenus.removeAll(() => {
    if (isVcf) buildVcfMenu(vcfRows)
    else if (isBatch) buildBatchMenu(text)
    else buildMenus(withCustom(classify(text)))
    chrome.contextMenus.refresh()
  })
})

/** VCF 多行菜单：批量注释 */
function buildVcfMenu(rows) {
  chrome.contextMenus.create({
    id: ROOT,
    title: `生信快查 · 🧾 VCF ${rows.length} 条变异`,
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "vcf:gnomad",
    parentId: ROOT,
    title: `🌍 全部查 gnomAD（${rows.length} 条）`,
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "vcf:clinvar",
    parentId: ROOT,
    title: `🏥 全部查 ClinVar（${rows.length} 条）`,
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "vcf:varsome",
    parentId: ROOT,
    title: `🧪 全部查 VarSome（${rows.length} 条）`,
    contexts: ["selection"],
  })
  chrome.contextMenus.create({ id: "sep1", parentId: ROOT, type: "separator", contexts: ["selection"] })
  const rsCount = rows.filter((r) => r.kind === "rsid").length
  chrome.contextMenus.create({
    id: "vcf:auto",
    parentId: ROOT,
    title: `🚀 智能路由（${rsCount} 个 rsID 走 dbSNP，其余走 gnomAD）`,
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "vcf:csv",
    parentId: ROOT,
    title: "⬇️ 导出规范化查询词（CSV）",
    contexts: ["selection"],
  })
}

function buildMenus(c) {
  chrome.contextMenus.create({
    id: ROOT,
    title: `生信快查 · ${c.emoji} ${c.name}「${truncate(c.query, 18)}」`,
    contexts: ["selection"],
  })
  c.dbs.forEach((dbId) => {
    const db = DBS[dbId]
    if (!db) return
    chrome.contextMenus.create({
      id: `db:${dbId}`,
      parentId: ROOT,
      title: `${db.icon} ${db.label}${db.custom ? "（自定义）" : ""}`,
      contexts: ["selection"],
    })
  })
  chrome.contextMenus.create({ id: "sep1", parentId: ROOT, type: "separator", contexts: ["selection"] })
  chrome.contextMenus.create({
    id: "openall",
    parentId: ROOT,
    title: `🚀 一键全开（${Math.min(c.dbs.length, 5)} 个库 · 后台标签）`,
    contexts: ["selection"],
  })
}

/** 批量菜单：多行选中 → 每行按其类型打开首选库 */
function buildBatchMenu(text) {
  const items = parseBatch(text)
  chrome.contextMenus.create({
    id: ROOT,
    title: `生信快查 · 📚 批量查询 ${items.length} 条`,
    contexts: ["selection"],
  })
  chrome.contextMenus.create({
    id: "batch:auto",
    parentId: ROOT,
    title: "🚀 各自动类型 · 打开首选库",
    contexts: ["selection"],
  })
  chrome.contextMenus.create({ id: "sep1", parentId: ROOT, type: "separator", contexts: ["selection"] })
  const groups = {}
  items.forEach((q) => {
    const c = classify(q)
    groups[c.type] = groups[c.type] || { name: c.name, emoji: c.emoji, n: 0, first: c.dbs[0] }
    groups[c.type].n++
  })
  Object.entries(groups).forEach(([type, g]) => {
    chrome.contextMenus.create({
      id: `batch:type:${type}`,
      parentId: ROOT,
      title: `${g.emoji} ${g.name} × ${g.n}`,
      contexts: ["selection"],
    })
  })
}

/** 把多行/分隔符文本拆成查询条目（最多 20 条） */
function parseBatch(text) {
  return String(text)
    .split(/[\n\r,;，；\t|]+/)
    .map((s) => s.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, ""))
    .filter((s) => s.length >= 2 && s.length <= 200)
    .slice(0, 20)
}

/** 批量执行：后台标签依次打开（限流，避免一次开爆） */
async function runBatch(text, mode) {
  const items = parseBatch(text)
  if (!items.length) return
  let opened = 0
  items.forEach((q, i) => {
    const c = classify(q)
    let dbKey = c.dbs[0]
    if (mode && mode.startsWith("type:")) {
      const wantType = mode.slice(5)
      if (c.type !== wantType) return
      dbKey = c.dbs[0]
    }
    const db = DBS[dbKey]
    if (!db) return
    opened++
    setTimeout(() => {
      chrome.tabs.create({ url: db.url(q), active: false })
    }, i * 150)
  })
  const { history = [] } = await chrome.storage.local.get("history")
  const now = Date.now()
  const newEntries = items.slice(0, opened).map((q) => {
    const c = classify(q)
    return {
      q,
      type: c.type,
      typeName: c.name,
      emoji: c.emoji,
      db: c.dbs[0],
      dbLabel: `${DBS[c.dbs[0]]?.label || c.dbs[0]}（批量）`,
      ts: now,
    }
  })
  await chrome.storage.local.set({ history: [...newEntries.reverse(), ...history].slice(0, MAX_HISTORY) })
  await updateBadge()
}

/* ── VCF 批量注释：把每条变异的规范查询词路由到目标库 ── */
async function runVcfBatch(text, target) {
  const rows = parseVcfText(text)
  if (!rows.length) return
  const limit = 15
  const used = rows.slice(0, limit)

  if (target === "csv") {
    // 导出规范化查询词：CHROM,POS,ID,REF,ALT,gnomAD_query,VCF原行
    const header = "CHROM,POS,ID,REF,ALT,gnomAD_query,original"
    const body = used
      .map((r) => [r.chrom, r.pos, r.id || ".", r.ref, r.alts.join("|"), r.query, r.raw || ""].map((v) => `"${v}"`).join(","))
      .join("\n")
    const csv = "\uFEFF" + header + "\n" + body
    await downloadCsv(csv, `vcf-queries-${new Date().toISOString().slice(0, 10)}.csv`)
    return
  }

  const dbFor = (r) => {
    if (target === "gnomad") return "gnomad"
    if (target === "clinvar") return "clinvar"
    if (target === "varsome") return "varsome"
    // auto：rsID 优先 dbSNP，其余 gnomAD
    return r.kind === "rsid" ? "dbsnp" : "gnomad"
  }

  used.forEach((r, i) => {
    const dbId = dbFor(r)
    const db = DBS[dbId]
    if (!db) return
    setTimeout(() => chrome.tabs.create({ url: db.url(r.query), active: false }), i * 150)
  })

  // 历史留痕：一条汇总记录
  const { history = [] } = await chrome.storage.local.get("history")
  const entry = {
    q: `VCF × ${used.length}（${used[0].query}…）`,
    type: "variant_vcf",
    typeName: "VCF 批量",
    emoji: "🧾",
    db: target,
    dbLabel: `VCF 批量 → ${target}`,
    ts: Date.now(),
  }
  await chrome.storage.local.set({ history: [entry, ...history].slice(0, MAX_HISTORY) })
  await updateBadge()
}

/** 用 chrome.downloads 保存 CSV
 * 修复 v0.3.0 缺陷：MV3 service worker 既无 DOM（不能 <a download>）也无 URL.createObjectURL，
 * 且现代 Chrome/Edge 禁止顶层导航到 data: URL（旧写法 chrome.tabs.create({url:"data:..."}) 会失败）。
 * chrome.downloads.download() 接受 data: URL（下载而非导航），是 SW 环境下唯一可靠路径。
 */
async function downloadCsv(text, filename) {
  const url = "data:text/csv;charset=utf-8," + encodeURIComponent(text)
  try {
    await chrome.downloads.download({ url, filename, saveAs: false })
    chrome.action.setBadgeText({ text: "⬇" })
    chrome.action.setBadgeBackgroundColor({ color: "#64ffda" })
    setTimeout(() => updateBadge(), 1800)
  } catch (e) {
    chrome.action.setBadgeText({ text: "✗" })
    chrome.action.setBadgeBackgroundColor({ color: "#f472b6" })
    setTimeout(() => updateBadge(), 2200)
  }
}

/* ── Zotero 联动：查询本地 Zotero 库并跳转选中 ── */
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
    const key = first.key || (first.data && first.data.key)
    return { key, count: items.length, title: first.data?.title || "" }
  } catch (e) {
    return { error: "无法连接本地 Zotero（请确认 Zotero 已运行且开启 API）" }
  }
}

/* ── 点击处理 ── */
chrome.contextMenus.onClicked.addListener(async (info) => {
  const id = String(info.menuItemId || "")
  const text = (info.selectionText || "").trim()
  const c = classify(text)
  if (!c) return

  // VCF 批量
  if (id.startsWith("vcf:")) {
    await runVcfBatch(text, id.slice(4))
    return
  }

  if (id.startsWith("batch:")) {
    const mode = id.slice(6) === "auto" ? "auto" : id.slice(6)
    await runBatch(text, mode)
    return
  }

  if (id.startsWith("db:")) {
    const dbId = id.slice(3)
    const db = DBS[dbId]
    if (!db) return

    // Zotero 特殊处理
    if (db.zotero) {
      const r = await searchZotero(c.query)
      if (r.key) {
        await chrome.tabs.create({ url: `zotero://select/library/items/${r.key}` })
        await addHistory({ ...c, name: "文献" }, "zotero")
      } else {
        chrome.action.setBadgeText({ text: "✗" })
        chrome.action.setBadgeBackgroundColor({ color: "#f472b6" })
        setTimeout(() => updateBadge(), 2200)
      }
      return
    }

    await chrome.tabs.create({ url: db.url(c.query) })
    await addHistory(c, dbId)
    return
  }

  if (id === "openall") {
    const list = c.dbs.slice(0, 5)
    list.forEach((dbId, i) => {
      const db = DBS[dbId]
      if (!db) return
      setTimeout(() => {
        chrome.tabs.create({ url: db.url(c.query), active: false })
      }, i * 120)
    })
    await addHistory(c, "ALL")
  }
})

/* ── 消息接口（供 content script 浮层 / popup 使用） ── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  ;(async () => {
    try {
      if (msg?.type === "classify") {
        if (!isQueryable(msg.text)) return sendResponse({ ok: false })
        const c = await withCustom(classify(msg.text))
        const dbs = c.dbs
          .map((id) => {
            const db = DBS[id]
            if (!db) return null
            return { id, label: db.label, icon: db.icon, url: db.url(c.query) }
          })
          .filter(Boolean)
        // v0.4：附带基因速查 / 序列分析（供页面浮层展示）
        const gene = c.type === "gene" ? lookupGene(c.query) : null
        const seq = c.type === "sequence" ? analyzeSequence(c.query) : null
        sendResponse({ ok: true, data: { ...c, dbs, gene, seq } })
        return
      }
      if (msg?.type === "openDb" || msg?.type === "openAll") {
        const c = await withCustom(classify(msg.query))
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
        await runBatch(msg.text, msg.mode || "auto")
        sendResponse({ ok: true })
        return
      }
      if (msg?.type === "setFloat") {
        await chrome.storage.local.set({ floatEnabled: !!msg.enabled })
        const ok = await syncFloatScript(true)
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
  return true // 异步响应
})

/* ── 页面浮层：按开关动态注册 / 注销 content script ── */
async function syncFloatScript(forceRequest) {
  const { floatEnabled = false } = await chrome.storage.local.get("floatEnabled")
  const granted = await chrome.permissions.contains({ origins: FLOAT_MATCHES })
  const registered = await chrome.scripting.getRegisteredContentScripts().catch(() => [])
  const has = registered.some((s) => s.id === FLOAT_SCRIPT_ID)

  if (floatEnabled && granted && !has) {
    await chrome.scripting.registerContentScripts([
      {
        id: FLOAT_SCRIPT_ID,
        matches: FLOAT_MATCHES,
        js: ["content.js"],
        runAt: "document_idle",
        allFrames: false,
      },
    ])
    // 修复体验：动态注册只对新页面生效，这里立即注入所有已打开的页面
    try {
      const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] })
      await Promise.all(
        tabs.map((t) =>
          t.id
            ? chrome.scripting.executeScript({ target: { tabId: t.id }, files: ["content.js"] }).catch(() => {})
            : Promise.resolve(),
        ),
      )
    } catch (e) {
      /* 部分页面（商店页/受限页）注入失败可忽略 */
    }
    return true
  }
  if ((!floatEnabled || !granted) && has) {
    await chrome.scripting.unregisterContentScripts({ ids: [FLOAT_SCRIPT_ID] })
    return floatEnabled && granted
  }
  return floatEnabled && granted
}

/* ── 历史记录 ── */
async function addHistory(c, dbId) {
  const { history = [] } = await chrome.storage.local.get("history")
  const entry = {
    q: c.query,
    type: c.type,
    typeName: c.name,
    emoji: c.emoji,
    db: dbId,
    dbLabel: dbId === "ALL" ? "全部库" : DBS[dbId]?.label || dbId,
    ts: Date.now(),
  }
  // 同一查询+库：更新时间并置顶（去重）
  const rest = history.filter((h) => !(h.q === entry.q && h.db === entry.db))
  rest.unshift(entry)
  await chrome.storage.local.set({ history: rest.slice(0, MAX_HISTORY) })
  await updateBadge()
}

async function updateBadge() {
  const { history = [] } = await chrome.storage.local.get("history")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = history.filter((h) => h.ts >= today.getTime()).length
  const text = todayCount > 0 ? String(todayCount) : ""
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" })
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s
}
