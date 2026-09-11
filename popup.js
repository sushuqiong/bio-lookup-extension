/**
 * popup.js —— 手动查询 + 历史面板（筛选 / 重查 / 复制 / 导出）
 */
import { classify, DBS } from "./classify.js"

const $ = (id) => document.getElementById(id)
const qInput = $("q")
const hint = $("hint")
const dbRow = $("dbRow")
const list = $("list")
const empty = $("empty")
const countEl = $("count")
const filterInput = $("filter")
const typeFilter = $("typeFilter")
const toastEl = $("toast")

let history = []
let current = null // 当前输入识别结果

/* ── 工具 ── */
function toast(msg) {
  toastEl.textContent = msg
  toastEl.classList.add("show")
  clearTimeout(toast._t)
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 1500)
}

function openUrl(url) {
  chrome.tabs.create({ url })
}

function timeAgo(ts) {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return "刚刚"
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} 天前`
  return new Date(ts).toLocaleDateString("zh-CN")
}

/* ── 手动查询 ── */
function renderType() {
  const raw = qInput.value.trim()
  if (!raw) {
    hint.textContent = "自动识别类型 · 未识别时走通用检索"
    dbRow.innerHTML = ""
    current = null
    return
  }
  current = classify(raw)
  hint.textContent = `${current.emoji} 识别为：${current.name}`
  dbRow.innerHTML = current.dbs
    .map((id) => {
      const db = DBS[id]
      return `<button class="db-chip" data-db="${id}">${db.icon} ${db.label}</button>`
    })
    .join("")
}

qInput.addEventListener("input", renderType)
qInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && current) {
    const first = current.dbs[0]
    if (first && DBS[first]) {
      openUrl(DBS[first].url(current.query))
      record(current, first)
      toast(`打开 ${DBS[first].label}`)
    }
  }
})

dbRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".db-chip")
  if (!btn || !current) return
  const dbId = btn.dataset.db
  const db = DBS[dbId]
  if (!db) return
  openUrl(db.url(current.query))
  record(current, dbId)
  toast(`打开 ${db.label}`)
})

$("go").addEventListener("click", () => {
  if (!current && qInput.value.trim()) renderType()
  if (!current) return toast("请先输入查询内容")
  const first = current.dbs[0]
  if (first && DBS[first]) {
    openUrl(DBS[first].url(current.query))
    record(current, first)
  }
})

/* ── 历史记录写入（与 background 一致的去重逻辑） ── */
async function record(c, dbId) {
  const entry = {
    q: c.query,
    type: c.type,
    typeName: c.name,
    emoji: c.emoji,
    db: dbId,
    dbLabel: dbId === "ALL" ? "全部库" : DBS[dbId]?.label || dbId,
    ts: Date.now(),
  }
  history = [entry, ...history.filter((h) => !(h.q === entry.q && h.db === entry.db))]
  await chrome.storage.local.set({ history: history.slice(0, 500) })
  render()
}

/* ── 渲染历史 ── */
function render() {
  const kw = filterInput.value.trim().toLowerCase()
  const type = typeFilter.value
  const rows = history.filter((h) => {
    if (type && h.type !== type) return false
    if (kw && !(`${h.q} ${h.dbLabel} ${h.typeName}`.toLowerCase().includes(kw))) return false
    return true
  })

  countEl.textContent = String(history.length)
  empty.style.display = rows.length ? "none" : "block"
  empty.textContent = history.length
    ? "没有匹配的记录，换个关键词试试。"
    : "还没有查询记录。在任意网页选中基因名 / rsID / GEO 编号，右键试试。"

  list.innerHTML = rows
    .map(
      (h, i) => `
      <li class="item" data-i="${i}">
        <span class="emoji">${h.emoji || "🧬"}</span>
        <div class="body">
          <div class="q">${escapeHtml(h.q)}</div>
          <div class="meta">
            <span class="db">${escapeHtml(h.dbLabel)}</span>
            <span>${escapeHtml(h.typeName || "")}</span>
            <span>${timeAgo(h.ts)}</span>
          </div>
        </div>
        <button class="copy" data-copy="${escapeHtml(h.q)}" title="复制查询词">复制</button>
      </li>`,
    )
    .join("")

  // 点击项 → 重查
  list.querySelectorAll(".item").forEach((li) => {
    li.addEventListener("click", (e) => {
      if (e.target.closest(".copy")) return
      const h = rows[Number(li.dataset.i)]
      if (!h) return
      if (h.db === "ALL") {
        const c = classify(h.q)
        c.dbs.slice(0, 5).forEach((id, k) => {
          setTimeout(() => chrome.tabs.create({ url: DBS[id].url(h.q), active: false }), k * 120)
        })
      } else if (DBS[h.db]) {
        openUrl(DBS[h.db].url(h.q))
      } else {
        openUrl(`https://www.ncbi.nlm.nih.gov/search/all/?term=${encodeURIComponent(h.q)}`)
      }
      record(classify(h.q), h.db)
    })
  })

  // 复制
  list.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation()
      try {
        await navigator.clipboard.writeText(btn.dataset.copy)
        toast("已复制：" + btn.dataset.copy)
      } catch (err) {
        toast("复制失败")
      }
    })
  })
}

filterInput.addEventListener("input", render)
typeFilter.addEventListener("change", render)

/* ── 导出 CSV ── */
$("export").addEventListener("click", () => {
  if (!history.length) return toast("没有记录可导出")
  const header = "查询词,类型,数据库,时间\n"
  const rows = history
    .map((h) => `"${h.q}","${h.typeName || ""}","${h.dbLabel || ""}","${new Date(h.ts).toLocaleString("zh-CN")}"`)
    .join("\n")
  const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `bio-lookup-history-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast(`导出 ${history.length} 条记录`)
})

/* ── 清空 ── */
$("clear").addEventListener("click", async () => {
  if (!history.length) return toast("历史已经是空的")
  if (!confirm(`确定清空全部 ${history.length} 条查询历史？此操作不可撤销。`)) return
  history = []
  await chrome.storage.local.set({ history: [] })
  await chrome.action.setBadgeText({ text: "" })
  render()
  toast("已清空历史")
})

/* ── 初始化 ── */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
}

async function init() {
  const d = await chrome.storage.local.get("history")
  history = Array.isArray(d.history) ? d.history : []
  render()
  qInput.focus()
}

init()
