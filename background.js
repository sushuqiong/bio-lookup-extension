/**
 * background.js —— MV3 service worker
 * 职责：动态右键菜单（按选中文本类型只显示相关数据库）+ 查询历史存储 + 徽章计数
 */
import { classify, isQueryable, DBS } from "./classify.js"

const ROOT = "biolookup-root"
const MAX_HISTORY = 500
const FLOAT_SCRIPT_ID = "biolookup-float"
const FLOAT_MATCHES = ["http://*/*", "https://*/*"]

/* ── 自定义数据库：模板 {q} 占位符 ── */
async function getCustomDbs() {
  const { customDbs = [] } = await chrome.storage.local.get("customDbs")
  return Array.isArray(customDbs) ? customDbs : []
}

function customToDb(cd) {
  return {
    label: cd.label,
    icon: cd.icon || "⭐",
    url: (q) => String(cd.template).replace(/\{q\}/g, encodeURIComponent(q)),
    custom: true,
    types: cd.types && cd.types.length ? cd.types : ["*"],
  }
}

/** 把自定义库按类型合并进推荐列表（排在官方库之后、去重） */
async function withCustom(c) {
  const custom = await getCustomDbs()
  if (!custom.length) return c
  const extra = []
  for (const cd of custom) {
    const types = cd.types && cd.types.length ? cd.types : ["*"]
    if (!types.includes("*") && !types.includes(c.type)) continue
    const key = `custom:${cd.id}`
    DBS[key] = customToDb(cd)
    extra.push(key)
  }
  return { ...c, dbs: [...c.dbs, ...extra] }
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
  await updateBadge()
  await syncFloatScript()
})

chrome.runtime.onStartup?.addListener(() => {
  updateBadge()
  syncFloatScript()
})

/* ── 动态菜单：每次右键显示前，按类型重建 ── */
let lastKey = ""

chrome.contextMenus.onShown.addListener((info) => {
  const text = info.selectionText || ""
  if (!isQueryable(text)) {
    chrome.contextMenus.update(ROOT, { visible: false }, () => chrome.contextMenus.refresh())
    return
  }
  const isBatch = parseBatch(text).length > 1
  const key = `${isBatch ? "BATCH" : classify(text).type}|${text.slice(0, 60)}`
  if (key === lastKey) {
    chrome.contextMenus.update(ROOT, { visible: true }, () => chrome.contextMenus.refresh())
    return
  }
  lastKey = key
  ;(async () => {
    const c = await withCustom(classify(text))
    chrome.contextMenus.removeAll(() => {
      if (isBatch) buildBatchMenu(text)
      else buildMenus(c)
      chrome.contextMenus.refresh()
    })
  })()
})

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

/* ── 点击处理 ── */
chrome.contextMenus.onClicked.addListener(async (info) => {
  const id = String(info.menuItemId || "")
  const text = (info.selectionText || "").trim()
  const c = classify(text)
  if (!c) return

  if (id.startsWith("batch:")) {
    const mode = id.slice(6) === "auto" ? "auto" : id.slice(6)
    await runBatch(text, mode)
    return
  }

  if (id.startsWith("db:")) {
    const dbId = id.slice(3)
    const db = DBS[dbId]
    if (!db) return
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
        sendResponse({ ok: true, data: { ...c, dbs } })
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
