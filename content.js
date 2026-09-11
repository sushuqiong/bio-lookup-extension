/**
 * content.js —— 页面内浮层：双击选中文本 → 弹出查询卡片
 * 仅在用户于 popup 中开启「页面浮层」并授权后动态注入（optional_host_permissions）
 * 使用 Shadow DOM 隔离样式，绝不污染宿主页面
 */
;(function () {
  if (window.__bioLookupInjected) return
  window.__bioLookupInjected = true

  const HOST_ID = "biolookup-float-host"
  let shadow = null
  let card = null
  let hideTimer = null

  const STYLE = `
    :host { all: initial; }
    .card {
      position: fixed;
      min-width: 250px;
      max-width: 320px;
      padding: 12px 14px;
      border-radius: 14px;
      background: linear-gradient(150deg, rgba(16, 27, 69, 0.97), rgba(24, 36, 86, 0.97));
      border: 1px solid rgba(100, 255, 218, 0.28);
      box-shadow: 0 18px 48px rgba(7, 13, 31, 0.55), 0 0 0 1px rgba(255,255,255,0.04) inset;
      font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
      color: #e6f1ff;
      font-size: 13px;
      backdrop-filter: blur(10px);
      animation: pop 0.18s cubic-bezier(0.34, 1.5, 0.64, 1);
      z-index: 2147483647;
    }
    @keyframes pop { from { opacity: 0; transform: translateY(6px) scale(0.96); } to { opacity: 1; transform: none; } }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
    .type { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12.5px; letter-spacing: 0.02em; }
    .type .emoji { font-size: 15px; }
    .q { font-family: ui-monospace, Consolas, monospace; color: #64ffda; font-size: 12px; word-break: break-all; }
    .close {
      flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(255,255,255,0.08); color: rgba(230,241,255,0.7); font-size: 12px; line-height: 1;
    }
    .close:hover { background: rgba(244,114,182,0.25); color: #fff; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 10px; border-radius: 999px; cursor: pointer;
      border: 1px solid rgba(167, 139, 250, 0.35);
      background: rgba(167, 139, 250, 0.12);
      color: #c4b5fd; font-size: 11.5px;
      transition: all 0.16s ease;
    }
    .chip:hover { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; border-color: transparent; transform: translateY(-1px); }
    .row { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(230,241,255,0.1); }
    .all { flex: 1; padding: 6px 10px; border-radius: 9px; border: 1px solid rgba(100,255,218,0.3); background: rgba(100,255,218,0.08); color: #64ffda; cursor: pointer; font-size: 11.5px; font-weight: 600; }
    .all:hover { background: rgba(100,255,218,0.18); }
    .copy { padding: 6px 10px; border-radius: 9px; border: 1px solid rgba(230,241,255,0.14); background: transparent; color: rgba(230,241,255,0.72); cursor: pointer; font-size: 11.5px; }
    .copy:hover { color: #e6f1ff; background: rgba(255,255,255,0.08); }
    .hint { margin-top: 7px; font-size: 10px; color: rgba(226,232,255,0.42); text-align: right; }
  `

  function ensureHost() {
    if (shadow) return
    const host = document.createElement("div")
    host.id = HOST_ID
    document.documentElement.appendChild(host)
    shadow = host.attachShadow({ mode: "open" })
    const style = document.createElement("style")
    style.textContent = STYLE
    shadow.appendChild(style)
    card = document.createElement("div")
    card.className = "card"
    card.hidden = true
    shadow.appendChild(card)
  }

  function hide() {
    if (card) card.hidden = true
  }

  function show(x, y, data) {
    ensureHost()
    card.innerHTML = `
      <div class="head">
        <span class="type"><span class="emoji">${data.emoji}</span>${data.name}<span class="q">${escapeHtml(data.query)}</span></span>
        <button class="close" title="关闭">✕</button>
      </div>
      <div class="chips">
        ${data.dbs
          .slice(0, 6)
          .map((d) => `<button class="chip" data-db="${d.id}">${d.icon} ${d.label}</button>`)
          .join("")}
      </div>
      <div class="row">
        <button class="all">🚀 全开（${Math.min(data.dbs.length, 5)} 个）</button>
        <button class="copy">复制</button>
      </div>
      <div class="hint">生信快查 · 双击选中文本可再次唤起</div>
    `
    card.hidden = false
    // 位置：优先鼠标右下，越界则回收
    const pad = 10
    const rect = { w: 320, h: 150 }
    let left = x + 14
    let top = y + 14
    if (left + rect.w > window.innerWidth - pad) left = Math.max(pad, x - rect.w - 14)
    if (top + rect.h > window.innerHeight - pad) top = Math.max(pad, y - rect.h - 14)
    card.style.left = `${left}px`
    card.style.top = `${top}px`

    card.querySelector(".close").addEventListener("click", hide)
    card.querySelector(".copy").addEventListener("click", () => {
      navigator.clipboard.writeText(data.query).then(
        () => {
          const btn = card.querySelector(".copy")
          btn.textContent = "已复制 ✓"
          setTimeout(() => (btn.textContent = "复制"), 1200)
        },
        () => {},
      )
    })
    card.querySelector(".all").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "openAll", query: data.query, dbIds: data.dbs.slice(0, 5).map((d) => d.id) })
      hide()
    })
    card.querySelectorAll(".chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "openDb", query: data.query, dbId: chip.dataset.db })
        hide()
      })
    })
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
  }

  document.addEventListener(
    "dblclick",
    (e) => {
      // 输入框/可编辑区域内不触发
      const t = e.target
      if (t && (t.closest("input, textarea, [contenteditable='true']") || t.isContentEditable)) return
      const sel = window.getSelection()
      const text = sel ? sel.toString().trim() : ""
      if (!text) return hide()
      try {
        chrome.runtime.sendMessage({ type: "classify", text }, (res) => {
          if (chrome.runtime.lastError) return hide() // 扩展已重载/卸载 → 静默退出
          if (!res || !res.ok || !res.data) return hide()
          show(e.clientX, e.clientY, res.data)
        })
      } catch (err) {
        // Extension context invalidated：扩展更新/重载后旧脚本会抛错，忽略即可
      }
    },
    true,
  )

  document.addEventListener("click", (e) => {
    if (!shadow || card.hidden) return
    const path = e.composedPath ? e.composedPath() : []
    const host = document.getElementById(HOST_ID)
    if (host && (path.includes(host) || e.target === host)) return
    hide()
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide()
  })

  window.addEventListener("scroll", () => {
    // 滚动时收起（避免浮层与内容错位）
    clearTimeout(hideTimer)
    hideTimer = setTimeout(hide, 120)
  })
})()
