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
      --tc: #15803d;
      position: fixed;
      min-width: 268px;
      max-width: 348px;
      padding: 13px 15px;
      border-radius: 15px;
      background:
        radial-gradient(200px 110px at 88% -10%, color-mix(in srgb, var(--tc) 16%, transparent), transparent 70%),
        linear-gradient(160deg, rgba(255, 255, 255, 0.97), rgba(240, 253, 244, 0.96));
      border: 1px solid color-mix(in srgb, var(--tc) 38%, transparent);
      box-shadow:
        0 16px 40px rgba(20, 83, 45, 0.22),
        0 2px 8px rgba(20, 83, 45, 0.1),
        0 0 0 1px rgba(255, 255, 255, 0.7) inset;
      font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
      color: #14361f;
      font-size: 13px;
      backdrop-filter: blur(8px);
      animation: pop 0.22s cubic-bezier(0.34, 1.5, 0.64, 1);
      z-index: 2147483647;
      overflow: hidden;
    }
    /* 顶部叶脉流光 */
    .card::before {
      content: "";
      position: absolute;
      top: 0; left: -40%; right: -40%;
      height: 2px;
      background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--tc) 80%, #facc15), transparent);
      animation: sheen 3.6s ease-in-out infinite;
    }
    @keyframes sheen {
      0% { transform: translateX(-40%); opacity: 0; }
      40% { opacity: 0.95; }
      100% { transform: translateX(40%); opacity: 0; }
    }
    @keyframes pop { from { opacity: 0; transform: translateY(8px) scale(0.95); } to { opacity: 1; transform: none; } }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
    .type { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12.5px; letter-spacing: 0.02em; color: color-mix(in srgb, var(--tc) 72%, #052e16); }
    .type .emoji { font-size: 15px; animation: bob 2.6s ease-in-out infinite; }
    @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
    .q { font-family: ui-monospace, Consolas, monospace; color: #14532d; font-size: 12px; word-break: break-all; }
    .close {
      flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(20, 83, 45, 0.08); color: #4b6b58; font-size: 12px; line-height: 1;
      transition: all 0.2s ease;
    }
    .close:hover { background: rgba(190, 24, 93, 0.16); color: #be185d; transform: rotate(90deg); }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 10px; border-radius: 999px; cursor: pointer;
      border: 1px solid color-mix(in srgb, var(--tc) 34%, transparent);
      background: color-mix(in srgb, var(--tc) 10%, white);
      color: color-mix(in srgb, var(--tc) 62%, #052e16);
      font-size: 11.5px; font-weight: 600;
      transition: all 0.16s ease;
      position: relative; overflow: hidden;
    }
    .chip::after {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.7) 50%, transparent 68%);
      transform: translateX(-120%); transition: transform 0.5s ease;
    }
    .chip:hover::after { transform: translateX(120%); }
    .chip:hover { background: linear-gradient(135deg, var(--tc), #65a30d); color: #fff; border-color: transparent; transform: translateY(-1px); }
    /* 基因速查 */
    .gene { margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(20, 83, 45, 0.12); }
    .gene-head { display: flex; align-items: baseline; gap: 7px; margin-bottom: 7px; }
    .gene-sym { font-family: ui-monospace, Consolas, monospace; font-weight: 800; font-size: 13px; color: color-mix(in srgb, var(--tc) 72%, #052e16); }
    .gene-cn { font-size: 10.5px; color: #5c7a67; }
    .gene-row { display: flex; gap: 7px; margin-top: 5px; font-size: 10.5px; align-items: flex-start; }
    .gene-label { flex-shrink: 0; width: 48px; color: #7c9887; }
    .tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .tags span {
      padding: 2px 7px; border-radius: 999px; font-size: 10px;
      border: 1px solid color-mix(in srgb, var(--tc) 30%, transparent);
      background: color-mix(in srgb, var(--tc) 12%, white);
      color: color-mix(in srgb, var(--tc) 62%, #052e16);
    }
    .gene-path { color: #14361f; }
    /* 序列工具 */
    .seq { margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(20, 83, 45, 0.12); }
    .seq-row { display: flex; align-items: center; gap: 7px; margin-top: 5px; font-size: 10.5px; }
    .seq-label { flex-shrink: 0; width: 48px; color: #7c9887; }
    .seq code {
      flex: 1; min-width: 0; font-family: ui-monospace, Consolas, monospace; font-size: 10px;
      color: #9a3412; background: rgba(251, 146, 60, 0.16); border-radius: 5px; padding: 3px 6px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .seq-copy {
      flex-shrink: 0; padding: 2px 8px; border-radius: 5px; cursor: pointer;
      border: 1px solid rgba(194, 65, 12, 0.34); background: rgba(255,255,255,0.85); color: #c2410c; font-size: 10px;
    }
    .seq-copy:hover { background: rgba(251, 146, 60, 0.2); }
    .row { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(20, 83, 45, 0.12); }
    .all { flex: 1; padding: 6px 10px; border-radius: 9px; cursor: pointer; font-size: 11.5px; font-weight: 700;
      border: 1px solid color-mix(in srgb, var(--tc) 36%, transparent); background: color-mix(in srgb, var(--tc) 12%, white); color: color-mix(in srgb, var(--tc) 68%, #052e16); }
    .all:hover { background: linear-gradient(135deg, var(--tc), #65a30d); color: #fff; }
    .copy { padding: 6px 10px; border-radius: 9px; cursor: pointer; font-size: 11.5px;
      border: 1px solid rgba(20, 83, 45, 0.18); background: rgba(255,255,255,0.85); color: #4b6b58; }
    .copy:hover { color: #14532d; background: #fff; }
    .hint { margin-top: 7px; font-size: 10px; color: #8aa595; text-align: right; }
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

  /* ══════════════════════════════════════════════════════════════
     v0.6.0：页面自动高亮 —— 网页里的基因名 / rsID / 数据集编号自动标记，
     点击即弹查询卡（需在设置页开启，默认关闭）
     ══════════════════════════════════════════════════════════════ */
  const HL_CLASS = "biolookup-hl"
  const HL_MAX = 150
  let hlDone = false
  let hlEnabled = false

  const HL_STYLE = `
    .${HL_CLASS} {
      background: linear-gradient(180deg, transparent 60%, rgba(134, 239, 172, 0.7) 60%);
      border-bottom: 1.5px solid rgba(22, 163, 74, 0.7);
      border-radius: 2px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .${HL_CLASS}:hover { background: rgba(187, 247, 208, 0.95); }
  `

  function escReLocal(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  function buildHighlightRe(terms) {
    // 高置信目标：rsID / GEO·SRA 编号 / 坐标变异 / 已知基因（严格词边界）
    const genes = terms
      .filter((t) => /^[A-Za-z0-9-]{2,}$/.test(t))
      .sort((a, b) => b.length - a.length)
      .map(escReLocal)
      .join("|")
    return new RegExp(
      `(rs\\s?\\d{4,}|(?:GSE|GSM|GDS|GPL)\\s?\\d{3,}|(?:chr)?\\d{1,2}:\\d{2,}\\s?[ACGT]>[ACGT]|(?<![A-Za-z0-9_-])(?:${genes})(?![A-Za-z0-9_-]))`,
      "g",
    )
  }

  function injectHlStyle() {
    if (document.getElementById("biolookup-hl-style")) return
    const st = document.createElement("style")
    st.id = "biolookup-hl-style"
    st.textContent = HL_STYLE
    document.documentElement.appendChild(st)
  }

  function highlightPage(terms) {
    if (hlDone || !document.body) return
    const re = buildHighlightRe(terms)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const v = node.nodeValue
        if (!v || v.length < 2 || v.length > 3000) return NodeFilter.FILTER_REJECT
        const p = node.parentElement
        if (!p) return NodeFilter.FILTER_REJECT
        const tag = p.tagName
        if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "CODE", "PRE", "A"].includes(tag)) return NodeFilter.FILTER_REJECT
        if (p.closest(`.${HL_CLASS}, #${HOST_ID}`)) return NodeFilter.FILTER_REJECT
        if (p.isContentEditable) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })

    const targets = []
    let node
    while ((node = walker.nextNode())) {
      if (targets.length >= HL_MAX) break
      re.lastIndex = 0
      if (re.test(node.nodeValue)) targets.push(node)
    }

    for (const textNode of targets) {
      try {
        const frag = document.createDocumentFragment()
        const parent = textNode.parentNode
        if (!parent) continue
        let last = 0
        const text = textNode.nodeValue
        re.lastIndex = 0
        let m
        while ((m = re.exec(text))) {
          if (m[0].length === 0) break
          if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
          const span = document.createElement("span")
          span.className = HL_CLASS
          span.textContent = m[0]
          span.dataset.biolookup = "1"
          frag.appendChild(span)
          last = m.index + m[0].length
        }
        if (last === 0) continue
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
        parent.replaceChild(frag, textNode)
      } catch (err) {
        /* 单个节点失败不影响整体 */
      }
    }
    hlDone = true
  }

  function clearHighlight() {
    document.querySelectorAll(`.${HL_CLASS}`).forEach((el) => {
      const p = el.parentNode
      if (!p) return
      p.replaceChild(document.createTextNode(el.textContent), el)
      p.normalize()
    })
    hlDone = false
  }

  async function initHighlight() {
    try {
      const st = await chrome.runtime.sendMessage({ type: "highlightStatus" })
      if (!st || !st.ok || !st.enabled || !st.granted) return
      hlEnabled = true
      injectHlStyle()
      const res = await chrome.runtime.sendMessage({ type: "getHighlightTerms" })
      if (res && res.ok && Array.isArray(res.terms)) {
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", () => highlightPage(res.terms), { once: true })
        } else {
          highlightPage(res.terms)
        }
      }
    } catch (err) {
      /* 扩展未就绪时静默 */
    }
  }

  // 点击高亮词 → 弹查询卡
  document.addEventListener(
    "click",
    (e) => {
      if (!hlEnabled) return
      const el = e.target && e.target.closest ? e.target.closest(`.${HL_CLASS}`) : null
      if (!el) return
      e.preventDefault()
      e.stopPropagation()
      const q = el.textContent.trim()
      try {
        chrome.runtime.sendMessage({ type: "classify", text: q }, (res) => {
          if (chrome.runtime.lastError) return
          if (!res || !res.ok || !res.data) return
          const r = el.getBoundingClientRect()
          show(r.left, r.bottom + 4, res.data)
        })
      } catch (err) {
        /* ignore */
      }
    },
    true,
  )

  // 设置页切换开关时实时生效（无需刷新页面）
  try {
    chrome.storage.onChanged.addListener(async (changes) => {
      if (!changes.highlightEnabled) return
      if (changes.highlightEnabled.newValue) {
        hlEnabled = true
        injectHlStyle()
        const res = await chrome.runtime.sendMessage({ type: "getHighlightTerms" }).catch(() => null)
        if (res && res.ok) highlightPage(res.terms)
      } else {
        hlEnabled = false
        clearHighlight()
      }
    })
  } catch (err) {
    /* ignore */
  }

  initHighlight()

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
