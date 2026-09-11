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
        // 修复：popup 关闭会销毁 JS 上下文，多标签打开必须交给 background
        const c = classify(h.q)
        chrome.runtime.sendMessage({
          type: "openAll",
          query: h.q,
          dbIds: c.dbs.slice(0, 5).map((id) => id),
        })
        toast("已在后台打开多个库")
        setTimeout(loadHistory, 400)
      } else if (DBS[h.db]) {
        openUrl(DBS[h.db].url(h.q))
        record(classify(h.q), h.db)
      } else {
        openUrl(`https://www.ncbi.nlm.nih.gov/search/all/?term=${encodeURIComponent(h.q)}`)
      }
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

/* ── Tab 切换 ── */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === tab))
    const name = tab.dataset.tab
    $("pane-history").hidden = name !== "history"
    $("pane-batch").hidden = name !== "batch"
  })
})

$("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage())

/* ── 批量查询 ── */
const batchInput = $("batchInput")
const batchPreview = $("batchPreview")

function parseBatchPopup(text) {
  return String(text)
    .split(/[\n\r,;，；\t|]+/)
    .map((s) => s.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, ""))
    .filter((s) => s.length >= 2 && s.length <= 200)
    .slice(0, 20)
}

function renderBatchPreview() {
  const items = parseBatchPopup(batchInput.value)
  if (!items.length) {
    batchPreview.innerHTML = ""
    return
  }
  batchPreview.innerHTML = items
    .map((q) => {
      const c = classify(q)
      const icon = c.dbs[0] && DBS[c.dbs[0]] ? DBS[c.dbs[0]].icon : "🔍"
      return `<span class="bp-item" title="${escapeHtml(c.name)} · ${escapeHtml(q)}">${c.emoji}${escapeHtml(q.slice(0, 16))}<span style="opacity:.6">${icon}</span></span>`
    })
    .join("")
}

batchInput.addEventListener("input", renderBatchPreview)

$("batchDb").addEventListener("change", (e) => {
  if (e.target.value) {
    document.querySelectorAll('input[name="bmode"]').forEach((r) => (r.checked = false))
  }
})

document.querySelectorAll('input[name="bmode"]').forEach((r) => {
  r.addEventListener("change", () => {
    if (r.checked) $("batchDb").value = ""
  })
})

$("runBatch").addEventListener("click", async () => {
  const text = batchInput.value.trim()
  if (!text) return toast("请先粘贴要查询的内容")
  const items = parseBatchPopup(text)
  if (!items.length) return toast("没有可识别的条目")
  const dbId = $("batchDb").value
  const mode = dbId ? dbId : "auto"

  const res = await chrome.runtime.sendMessage({ type: "runBatch", text, mode })
  if (res?.ok) {
    toast(`已打开 ${items.length} 个后台标签`)
    batchInput.value = ""
    batchPreview.innerHTML = ""
    setTimeout(loadHistory, 300)
  } else {
    toast("批量执行失败")
  }
})

async function loadHistory() {
  const d = await chrome.storage.local.get("history")
  history = Array.isArray(d.history) ? d.history : []
  render()
}

async function init() {
  await loadHistory()
  qInput.focus()
  // 填充批量目标库下拉
  $("batchDb").innerHTML =
    '<option value="">或指定统一数据库…</option>' +
    Object.entries(DBS)
      .map(([id, db]) => `<option value="${id}">${db.icon} ${db.label}</option>`)
      .join("")
}

init()
