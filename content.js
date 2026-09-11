/**
 * content.js —— 页面内浮层：双击选中文本 → 弹出查询卡片
 * v0.4：类型主题色 + 基因速查信息 + 序列工具 + 光晕动效
 * 仅在用户于设置页开启「页面浮层」并授权后动态注入（optional_host_permissions）
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
      --tc: #64ffda;
      position: fixed;
      min-width: 268px;
      max-width: 348px;
      padding: 13px 15px;
      border-radius: 15px;
      background:
        radial-gradient(220px 120px at 88% -12%, color-mix(in srgb, var(--tc) 26%, transparent), transparent 70%),
        linear-gradient(150deg, rgba(16, 27, 69, 0.975), rgba(24, 36, 86, 0.975));
      border: 1px solid color-mix(in srgb, var(--tc) 42%, transparent);
      box-shadow:
        0 20px 52px rgba(7, 13, 31, 0.58),
        0 0 0 1px rgba(255, 255, 255, 0.045) inset,
        0 0 26px color-mix(in srgb, var(--tc) 22%, transparent);
      font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
      color: #e6f1ff;
      font-size: 13px;
      backdrop-filter: blur(10px);
      animation: pop 0.22s cubic-bezier(0.34, 1.5, 0.64, 1);
      z-index: 2147483647;
      overflow: hidden;
    }
    /* 顶部流光 */
    .card::before {
      content: "";
      position: absolute;
      top: 0; left: -40%; right: -40%;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, var(--tc), transparent);
      animation: sheen 3.6s ease-in-out infinite;
    }
    @keyframes sheen {
      0% { transform: translateX(-40%); opacity: 0; }
      40% { opacity: 0.9; }
      100% { transform: translateX(40%); opacity: 0; }
    }
    @keyframes pop { from { opacity: 0; transform: translateY(8px) scale(0.95); } to { opacity: 1; transform: none; } }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
    .type { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12.5px; letter-spacing: 0.02em; color: var(--tc); text-shadow: 0 0 14px color-mix(in srgb, var(--tc) 50%, transparent); }
    .type .emoji { font-size: 15px; animation: bob 2.6s ease-in-out infinite; }
    @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    .q { font-family: ui-monospace, Consolas, monospace; color: #e6f1ff; font-size: 12px; word-break: break-all; opacity: 0.92; }
    .close {
      flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(255,255,255,0.08); color: rgba(230,241,255,0.7); font-size: 12px; line-height: 1;
      transition: all 0.2s ease;
    }
    .close:hover { background: rgba(244,114,182,0.28); color: #fff; transform: rotate(90deg); }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 10px; border-radius: 999px; cursor: pointer;
      border: 1px solid color-mix(in srgb, var(--tc) 34%, transparent);
      background: color-mix(in srgb, var(--tc) 12%, transparent);
      color: color-mix(in srgb, var(--tc) 82%, #ffffff);
      font-size: 11.5px;
      transition: all 0.16s ease;
      position: relative; overflow: hidden;
    }
    .chip::after {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.3) 50%, transparent 68%);
      transform: translateX(-120%); transition: transform 0.5s ease;
    }
    .chip:hover::after { transform: translateX(120%); }
    .chip:hover { background: linear-gradient(135deg, var(--tc), color-mix(in srgb, var(--tc) 40%, #4f46e5)); color: #071018; border-color: transparent; transform: translateY(-1px); }
    /* 基因速查 */
    .gene { margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(230,241,255,0.1); }
    .gene-head { display: flex; align-items: baseline; gap: 7px; margin-bottom: 7px; }
    .gene-sym { font-family: ui-monospace, Consolas, monospace; font-weight: 800; font-size: 13px; color: var(--tc); }
    .gene-cn { font-size: 10.5px; color: rgba(226,232,255,0.6); }
    .gene-row { display: flex; gap: 7px; margin-top: 5px; font-size: 10.5px; align-items: flex-start; }
    .gene-label { flex-shrink: 0; width: 48px; color: rgba(226,232,255,0.5); }
    .tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .tags span {
      padding: 2px 7px; border-radius: 999px; font-size: 10px;
      border: 1px solid color-mix(in srgb, var(--tc) 30%, transparent);
      background: color-mix(in srgb, var(--tc) 10%, transparent);
      color: color-mix(in srgb, var(--tc) 78%, #ffffff);
    }
    .gene-path { color: rgba(230,241,255,0.9); }
    /* 序列工具 */
    .seq { margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(230,241,255,0.1); }
    .seq-row { display: flex; align-items: center; gap: 7px; margin-top: 5px; font-size: 10.5px; }
    .seq-label { flex-shrink: 0; width: 48px; color: rgba(226,232,255,0.5); }
    .seq code {
      flex: 1; min-width: 0; font-family: ui-monospace, Consolas, monospace; font-size: 10px;
      color: #fdba74; background: rgba(249,115,22,0.12); border-radius: 5px; padding: 3px 6px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .seq-copy {
      flex-shrink: 0; padding: 2px 8px; border-radius: 5px; cursor: pointer;
      border: 1px solid rgba(249,115,22,0.34); background: transparent; color: #fdba74; font-size: 10px;
    }
    .seq-copy:hover { background: rgba(249,115,22,0.2); }
    .row { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(230,241,255,0.1); }
    .all { flex: 1; padding: 6px 10px; border-radius: 9px; cursor: pointer; font-size: 11.5px; font-weight: 700;
      border: 1px solid color-mix(in srgb, var(--tc) 36%, transparent); background: color-mix(in srgb, var(--tc) 12%, transparent); color: var(--tc); }
    .all:hover { background: color-mix(in srgb, var(--tc) 24%, transparent); }
    .copy { padding: 6px 10px; border-radius: 9px; cursor: pointer; font-size: 11.5px;
      border: 1px solid rgba(230,241,255,0.14); background: transparent; color: rgba(230,241,255,0.72); }
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

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
  }

  function show(x, y, data) {
    ensureHost()
    card.style.setProperty("--tc", data.color || "#64ffda")

    const geneBlock =
      data.gene && data.gene.info
        ? `<div class="gene">
            <div class="gene-head"><span class="gene-sym">${esc(data.gene.gene)}</span><span class="gene-cn">${esc(data.gene.info.cn)}</span></div>
            <div class="gene-row"><span class="gene-label">相关癌种</span><span class="tags">${data.gene.info.cancers
              .map((c) => `<span>${esc(c)}</span>`)
              .join("")}</span></div>
            <div class="gene-row"><span class="gene-label">主要通路</span><span class="gene-path">${esc(data.gene.info.pathway)}</span></div>
          </div>`
        : ""

    const seqBlock =
      data.seq
        ? `<div class="seq">
            <div class="seq-row"><span class="seq-label">长度 / GC</span><span class="gene-path">${data.seq.length} bp · ${data.seq.gc}%</span></div>
            <div class="seq-row"><span class="seq-label">反向互补</span><code class="rc">${esc(data.seq.rc)}</code><button class="seq-copy" data-t="rc">复制</button></div>
            <div class="seq-row"><span class="seq-label">RNA 转录</span><code class="rna">${esc(data.seq.rna)}</code><button class="seq-copy" data-t="rna">复制</button></div>
          </div>`
        : ""

    card.innerHTML = `
      <div class="head">
        <span class="type"><span class="emoji">${data.emoji}</span>${esc(data.name)}<span class="q">${esc(data.query)}</span></span>
        <button class="close" title="关闭">✕</button>
      </div>
      <div class="chips">
        ${data.dbs.slice(0, 6).map((d) => `<button class="chip" data-db="${d.id}">${d.icon} ${esc(d.label)}</button>`).join("")}
      </div>
      ${geneBlock}
      ${seqBlock}
      <div class="row">
        <button class="all">🚀 全开（${Math.min(data.dbs.length, 5)} 个）</button>
        <button class="copy">复制</button>
      </div>
      <div class="hint">生信快查 · 双击选中文本可再次唤起</div>
    `
    card.hidden = false

    // 位置：优先鼠标右下，越界回收
    const pad = 10
    const rect = { w: 350, h: data.gene || data.seq ? 300 : 170 }
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
    card.querySelectorAll(".seq-copy").forEach((btn) => {
      btn.addEventListener("click", () => {
        const el = card.querySelector(`code.${btn.dataset.t}`)
        navigator.clipboard.writeText(el.textContent).then(
          () => {
            btn.textContent = "✓"
            setTimeout(() => (btn.textContent = "复制"), 1100)
          },
          () => {},
        )
      })
    })
  }

  document.addEventListener(
    "dblclick",
    (e) => {
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
        /* Extension context invalidated：扩展更新/重载后旧脚本会抛错，忽略即可 */
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
    clearTimeout(hideTimer)
    hideTimer = setTimeout(hide, 120)
  })
})()
