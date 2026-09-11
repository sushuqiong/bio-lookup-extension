/**
 * options.js —— 设置页：页面浮层开关 + 自定义数据库管理
 */
const $ = (id) => document.getElementById(id)
const toastEl = $("toast")

function toast(msg) {
  toastEl.textContent = msg
  toastEl.classList.add("show")
  clearTimeout(toast._t)
  toast._t = setTimeout(() => toastEl.classList.remove("show"), 1800)
}

/* ── 页面浮层开关 ── */
async function refreshFloat() {
  const res = await chrome.runtime.sendMessage({ type: "floatStatus" })
  const enabled = !!res?.enabled
  $("floatToggle").checked = enabled
  $("floatStatus").textContent = enabled
    ? "状态：已启用（网页注入中）"
    : res?.granted
      ? "状态：已授权，未启用"
      : "状态：未授权（开启时会弹出授权请求）"
}

$("floatToggle").addEventListener("change", async (e) => {
  const want = e.target.checked
  if (want) {
    // 需要用户手势下申请可选权限
    const granted = await chrome.permissions.request({ origins: ["http://*/*", "https://*/*"] })
    if (!granted) {
      e.target.checked = false
      toast("未获得授权，浮层未启用")
      await refreshFloat()
      return
    }
  }
  const res = await chrome.runtime.sendMessage({ type: "setFloat", enabled: want })
  toast(res?.ok ? (want ? "浮层已启用" : "浮层已关闭") : "设置失败")
  await refreshFloat()
})

/* ── 自定义数据库 ── */
async function getCustom() {
  const { customDbs = [] } = await chrome.storage.local.get("customDbs")
  return Array.isArray(customDbs) ? customDbs : []
}

async function setCustom(list) {
  await chrome.storage.local.set({ customDbs: list })
}

const TYPE_LABELS = {
  "*": "全部",
  gene: "基因",
  variant_rs: "SNP",
  variant_hgvs: "HGVS",
  variant_coord: "坐标",
  geo: "GEO",
  pmid: "文献",
  doi: "DOI",
  region: "区间",
  sequence: "序列",
}

async function renderCustom() {
  const list = await getCustom()
  $("cdEmpty").style.display = list.length ? "none" : "block"
  $("cdBody").innerHTML = list
    .map(
      (cd, i) => `
      <tr>
        <td style="font-size:16px;">${cd.icon || "⭐"}</td>
        <td>${escapeHtml(cd.label)}</td>
        <td class="mono">${escapeHtml(cd.template)}</td>
        <td>${(cd.types || ["*"]).map((t) => TYPE_LABELS[t] || t).join(" / ")}</td>
        <td><button class="btn danger" data-del="${i}" style="padding:5px 10px; font-size:11.5px;">删除</button></td>
      </tr>`,
    )
    .join("")
  $("cdBody").querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.dataset.del)
      const list2 = await getCustom()
      const removed = list2.splice(idx, 1)[0]
      await setCustom(list2)
      await renderCustom()
      toast(`已删除「${removed.label}」`)
    })
  })
}

$("addBtn").addEventListener("click", async () => {
  const label = $("cdLabel").value.trim()
  const icon = $("cdIcon").value.trim() || "⭐"
  const template = $("cdTemplate").value.trim()
  const types = Array.from($("cdTypes").selectedOptions).map((o) => o.value)

  if (!label) return toast("请填写名称")
  if (!template || !template.includes("{q}")) return toast("URL 模板必须包含 {q} 占位符")
  if (!/^https?:\/\//i.test(template)) return toast("URL 必须以 http:// 或 https:// 开头")

  const list = await getCustom()
  list.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    label,
    icon,
    template,
    types: types.includes("*") || !types.length ? ["*"] : types,
  })
  await setCustom(list)
  $("cdLabel").value = ""
  $("cdIcon").value = ""
  $("cdTemplate").value = ""
  await renderCustom()
  toast(`已添加「${label}」`)
})

/* ── 导入 / 导出配置 ── */
$("exportCd").addEventListener("click", async () => {
  const list = await getCustom()
  if (!list.length) return toast("没有自定义数据库可导出")
  const blob = new Blob([JSON.stringify({ version: 1, customDbs: list }, null, 2)], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "bio-lookup-custom-dbs.json"
  a.click()
  URL.revokeObjectURL(a.href)
  toast(`已导出 ${list.length} 条`)
})

$("importCd").addEventListener("click", () => $("importFile").click())

$("importFile").addEventListener("change", async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const data = JSON.parse(await file.text())
    const incoming = Array.isArray(data) ? data : data.customDbs
    if (!Array.isArray(incoming)) throw new Error("格式不正确")
    const list = await getCustom()
    let added = 0
    for (const cd of incoming) {
      if (!cd?.label || !cd?.template?.includes("{q}")) continue
      list.push({
        id: cd.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        label: cd.label,
        icon: cd.icon || "⭐",
        template: cd.template,
        types: cd.types?.length ? cd.types : ["*"],
      })
      added++
    }
    await setCustom(list)
    await renderCustom()
    toast(`导入 ${added} 条`)
  } catch (err) {
    toast("导入失败：" + err.message)
  }
  e.target.value = ""
})

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
}

refreshFloat()
renderCustom()
