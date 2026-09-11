/**
 * background.js —— MV3 service worker（v0.4.1）
 * 职责：右键菜单（固定结构 + 智能标题，避免 onShown 重建导致菜单不显示）、
 *      批量/VCF 路由、Zotero 联动、历史存储、消息接口、浮层注册
 *
 * v0.4.1 关键修复：不再在 onShown 里 removeAll + 重建（Edge/Chrome 上会因时序问题
 * 导致菜单不显示），改为「安装时创建固定菜单 + onShown 只更新标题/可见性」。
 */
import {
  classify,
  isQueryable,
  DBS,
  parseVcfText,
  FALLBACK_DBS,
  TYPE_COLORS,
  lookupGene,
  analyzeSequence,
} from "./classify.js"

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
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: ROOT, title: "生信快查（选中文本后可用）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:auto", parentId: ROOT, title: "🎯 智能跳转（按识别类型选首选库）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:all", parentId: ROOT, title: "🚀 一键全开（最多 5 个相关库）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "sep1", parentId: ROOT, type: "separator", contexts: ["selection"] })
    for (const dbId of FIXED_DBS) {
      const db = DBS[dbId]
      if (!db) continue
      chrome.contextMenus.create({ id: `db:${dbId}`, parentId: ROOT, title: `${db.icon} ${db.label}`, contexts: ["selection"] })
    }
    chrome.contextMenus.create({ id: "sep2", parentId: ROOT, type: "separator", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:batch", parentId: ROOT, title: "📚 批量查询（多行 / VCF 选中时）", contexts: ["selection"] })
    chrome.contextMenus.create({ id: "act:zotero", parentId: ROOT, title: "📗 在 Zotero 中查找（PMID / DOI）", contexts: ["selection"] })
  })
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

chrome.storage.onChanged.addListener((changes, area) => {
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
chrome.runtime.onInstalled.addListener(async () => {
  createMenus()
  const { history, customDbs } = await chrome.storage.local.get(["history", "customDbs"])
  if (!Array.isArray(history)) await chrome.storage.local.set({ history: [] })
  if (!Array.isArray(customDbs)) await chrome.storage.local.set({ customDbs: [] })
  await loadCustomCache()
  await updateBadge()
  await syncFloatScript()
})

chrome.runtime.onStartup?.addListener(async () => {
  createMenus() // SW 被回收后重启时确保菜单存在
  await loadCustomCache()
  updateBadge()
  syncFloatScript()
})

/* ── 菜单显示前：只更新标题与可见性（不重建） ── */
let lastKey = ""

chrome.contextMenus.onShown.addListener((info) => {
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
chrome.contextMenus.onClicked.addListener(async (info) => {
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
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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

/* ── 页面浮层注册 ── */
async function syncFloatScript() {
  const { floatEnabled = false } = await chrome.storage.local.get("floatEnabled")
  const granted = await chrome.permissions.contains({ origins: FLOAT_MATCHES })
  const registered = await chrome.scripting.getRegisteredContentScripts().catch(() => [])
  const has = registered.some((s) => s.id === FLOAT_SCRIPT_ID)

  if (floatEnabled && granted && !has) {
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
  if ((!floatEnabled || !granted) && has) {
    await chrome.scripting.unregisterContentScripts({ ids: [FLOAT_SCRIPT_ID] })
    return false
  }
  return floatEnabled && granted
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
