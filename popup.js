/**
 * popup.js —— 查询历史 / 批量查询 / 统计 / 基因速查 / 序列工具
 * v0.4：类型主题色贯穿、动效、统计面板
 */
import { classify, DBS, TYPE_COLORS, TYPES, lookupGene, analyzeSequence } from "./classify.js"

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
const geneCard = $("geneCard")
const seqCard = $("seqCard")

let history = []
let current = null

/* ── 工具 ── */
function toast(msg) {
  toastEl.textContent = msg
  toastEl.classList.add("show")
  clearTimeout(toast._t)
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 1600)
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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
}

/** 设置当前类型主题色（贯穿 chips/hint/卡片/历史项） */
function setTypeColor(color) {
  document.body.style.setProperty("--tc", color || TYPE_COLORS.unknown)
  document.body.style.setProperty("--tc-soft", (color || TYPE_COLORS.unknown) + "26")
}

/* ── 手动查询 + 类型识别 ── */
function renderType() {
  const raw = qInput.value.trim()
  if (!raw) {
    hint.textContent = "自动识别类型 · 未识别时走通用检索"
    dbRow.innerHTML = ""
    geneCard.hidden = true
    seqCard.hidden = true
    setTypeColor(null)
    current = null
    return
  }
  current = classify(raw)
  setTypeColor(current.color)
  hint.textContent = `${current.emoji} 识别为：${current.name}`

  // 基因速查卡
  if (current.type === "gene") {
    const g = lookupGene(raw)
    if (g) {
      $("geneName").textContent = g.gene
      $("geneCn").textContent = g.info.cn
      $("geneCancers").innerHTML = g.info.cancers.map((c) => `<span>${escapeHtml(c)}</span>`).join("")
      $("genePathway").textContent = g.info.pathway
      geneCard.hidden = false
    } else {
      geneCard.hidden = true
    }
  } else {
    geneCard.hidden = true
  }

  // 序列工具卡
  if (current.type === "sequence") {
    const a = analyzeSequence(raw)
    if (a) {
      $("seqLen").textContent = `${a.length} bp`
      $("seqGc").textContent = `${a.gc}%`
      $("seqRc").textContent = a.rc
      $("seqRna").textContent = a.rna
      seqCard.hidden = false
    } else {
      seqCard.hidden = true
    }
  } else {
    seqCard.hidden = true
  }

  dbRow.innerHTML = current.dbs
    .map((id) => {
      const db = DBS[id]
      if (!db) return ""
      return `<button class="db-chip" data-db="${id}">${db.icon} ${db.label}${db.custom ? " ⭐" : ""}</button>`
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

// 序列卡复制按钮
seqCard.addEventListener("click", async (e) => {
  const btn = e.target.closest(".mini-copy")
  if (!btn) return
  const val = $(btn.dataset.copy).textContent
  try {
    await navigator.clipboard.writeText(val)
    toast("已复制")
  } catch (err) {
    toast("复制失败")
  }
})

/* ── 历史记录写入 ── */
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

/* ── 渲染历史（带类型色 + staggered） ── */
function render() {
  const kw = filterInput.value.trim().toLowerCase()
  const type = typeFilter.value
  const rows = history.filter((h) => {
    if (type && h.type !== type) return false
    if (kw && !`${h.q} ${h.dbLabel} ${h.typeName}`.toLowerCase().includes(kw)) return false
    return true
  })

  countEl.textContent = String(history.length)
  empty.style.display = rows.length ? "none" : "block"
  empty.textContent = history.length
    ? "没有匹配的记录，换个关键词试试。"
    : "还没有查询记录。在任意网页选中基因名 / rsID / GEO 编号，右键试试。"

  list.innerHTML = rows
    .map((h, i) => {
      const color = TYPE_COLORS[h.type] || TYPE_COLORS.unknown
      return `
      <li class="item" data-i="${i}" style="--tc:${color}; animation-delay:${Math.min(i, 12) * 26}ms">
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
      </li>`
    })
    .join("")

  list.querySelectorAll(".item").forEach((li) => {
    li.addEventListener("click", (e) => {
      if (e.target.closest(".copy")) return
      const h = rows[Number(li.dataset.i)]
      if (!h) return
      if (h.db === "ALL") {
        const c = classify(h.q)
        chrome.runtime.sendMessage({ type: "openAll", query: h.q, dbIds: c.dbs.slice(0, 5) })
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

/* ── 统计面板 ── */
function renderStats() {
  const total = history.length
  const today0 = new Date()
  today0.setHours(0, 0, 0, 0)
  const today = history.filter((h) => h.ts >= today0.getTime()).length

  const typeCount = {}
  const dbCount = {}
  const wordCount = {}
  for (const h of history) {
    typeCount[h.type] = (typeCount[h.type] || 0) + 1
    const dbKey = h.dbLabel || h.db
    dbCount[dbKey] = (dbCount[dbKey] || 0) + 1
    const w = String(h.q).slice(0, 22)
    wordCount[w] = (wordCount[w] || 0) + 1
  }

  const typeEntries = Object.entries(typeCount).sort((a, b) => b[1] - a[1])
  const dbEntries = Object.entries(dbCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const words = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 14)

  $("stTotal").textContent = String(total)
  $("stToday").textContent = String(today)
  $("stTypes").textContent = String(typeEntries.length)
  $("stDbs").textContent = String(Object.keys(dbCount).length)

  const maxT = typeEntries.length ? typeEntries[0][1] : 1
  $("stTypeBars").innerHTML = typeEntries
    .map(([t, n]) => {
      const T = TYPES[t] || { name: t, emoji: "🔍" }
      const color = TYPE_COLORS[t] || TYPE_COLORS.unknown
      return `<div class="bar-row">
        <span class="bar-name">${T.emoji} ${escapeHtml(T.name)}</span>
        <span class="bar-track"><span class="bar-fill" style="--bc:${color}; width:${Math.max(6, (n / maxT) * 100)}%"></span></span>
        <span class="bar-val">${n}</span>
      </div>`
    })
    .join("") || '<p style="font-size:11.5px;color:var(--muted)">暂无数据</p>'

  const maxD = dbEntries.length ? dbEntries[0][1] : 1
  $("stDbBars").innerHTML = dbEntries
    .map(
      ([name, n]) => `<div class="bar-row">
        <span class="bar-name">${escapeHtml(name)}</span>
        <span class="bar-track"><span class="bar-fill" style="--bc:#64ffda; width:${Math.max(6, (n / maxD) * 100)}%"></span></span>
        <span class="bar-val">${n}</span>
      </div>`,
    )
    .join("") || '<p style="font-size:11.5px;color:var(--muted)">暂无数据</p>'

  $("stCloud").innerHTML =
    words.map(([w, n]) => `<span title="查询 ${n} 次">${escapeHtml(w)}${n > 1 ? ` ×${n}` : ""}</span>`).join("") ||
    '<p style="font-size:11.5px;color:var(--muted)">暂无数据</p>'
}

/* ── Tab 切换 ── */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t === tab))
    const name = tab.dataset.tab
    $("pane-history").hidden = name !== "history"
    $("pane-batch").hidden = name !== "batch"
    $("pane-stats").hidden = name !== "stats"
    if (name === "stats") renderStats()
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
      const color = c.color || TYPE_COLORS.unknown
      return `<span class="bp-item" style="--tc:${color}; border-color:${color}55; background:${color}18; color:${color}" title="${escapeHtml(c.name)}">${c.emoji}${escapeHtml(q.slice(0, 16))}</span>`
    })
    .join("")
}

batchInput.addEventListener("input", renderBatchPreview)

$("batchDb").addEventListener("change", (e) => {
  if (e.target.value) document.querySelectorAll('input[name="bmode"]').forEach((r) => (r.checked = false))
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
  const res = await chrome.runtime.sendMessage({ type: "runBatch", text, mode: dbId || "auto" })
  if (res?.ok) {
    toast(`已打开 ${items.length} 个后台标签`)
    batchInput.value = ""
    batchPreview.innerHTML = ""
    setTimeout(loadHistory, 300)
  } else {
    toast("批量执行失败")
  }
})

/* ── 导出 / 清空 ── */
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
async function loadHistory() {
  const d = await chrome.storage.local.get("history")
  history = Array.isArray(d.history) ? d.history : []
  render()
}

async function init() {
  // 版本号从 manifest 动态读取（便于确认当前装的版本）
  try {
    const v = chrome.runtime.getManifest().version
    const el = $("verLine")
    if (el) el.textContent = `BIO LOOKUP · v${v}`
  } catch (e) {
    /* ignore */
  }
  await loadHistory()
  qInput.focus()
  $("batchDb").innerHTML =
    '<option value="">或指定统一数据库…</option>' +
    Object.entries(DBS)
      .filter(([, db]) => !db.zotero)
      .map(([id, db]) => `<option value="${id}">${db.icon} ${db.label}</option>`)
      .join("")
}

init()
