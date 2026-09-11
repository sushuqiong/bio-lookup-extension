/**
 * background.js —— MV3 service worker
 * 职责：动态右键菜单（按选中文本类型只显示相关数据库）+ 查询历史存储 + 徽章计数
 */
import { classify, isQueryable, DBS } from "./classify.js"

const ROOT = "biolookup-root"
const MAX_HISTORY = 500

/* ── 安装：创建根菜单 + 初始化存储 ── */
chrome.runtime.onInstalled.addListener(async () => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ROOT,
      title: "生信快查",
      contexts: ["selection"],
    })
  })
  const { history } = await chrome.storage.local.get("history")
  if (!Array.isArray(history)) await chrome.storage.local.set({ history: [] })
  await updateBadge()
})

chrome.runtime.onStartup?.addListener(() => updateBadge())

/* ── 动态菜单：每次右键显示前，按类型重建 ── */
let lastKey = ""

chrome.contextMenus.onShown.addListener((info) => {
  const text = info.selectionText || ""
  if (!isQueryable(text)) {
    chrome.contextMenus.update(ROOT, { visible: false }, () => chrome.contextMenus.refresh())
    return
  }
  const c = classify(text)
  if (!c) return
  const key = `${c.type}|${c.query}`
  if (key === lastKey) {
    chrome.contextMenus.update(ROOT, { visible: true }, () => chrome.contextMenus.refresh())
    return
  }
  lastKey = key
  chrome.contextMenus.removeAll(() => {
    buildMenus(c)
    chrome.contextMenus.refresh()
  })
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
      title: `${db.icon} ${db.label}`,
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

/* ── 点击处理 ── */
chrome.contextMenus.onClicked.addListener(async (info) => {
  const id = String(info.menuItemId || "")
  const text = (info.selectionText || "").trim()
  const c = classify(text)
  if (!c) return

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
