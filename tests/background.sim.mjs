/**
 * 模拟 Chrome API 运行 background.js，验证：
 * ① 模块能否加载（顶层代码是否有错）
 * ② onInstalled 触发时菜单项是否全部创建成功
 * ③ onShown（选中 BRCA1）时 update 是否正常、ROOT 是否变为可见
 * 运行：node tests/background.sim.mjs
 */
const log = []
const created = []
const updates = []
const handlers = {}

globalThis.chrome = {
  contextMenus: {
    removeAll: (cb) => { log.push("removeAll"); created.length = 0; cb && cb() },
    create: (opts, cb) => { created.push(opts); cb && cb() },
    update: (id, opts, cb) => { updates.push({ id, opts }); cb && cb() },
    refresh: () => { log.push("refresh") },
    onShown: { addListener: (fn) => (handlers.shown = fn) },
    onClicked: { addListener: (fn) => (handlers.clicked = fn) },
  },
  runtime: {
    onInstalled: { addListener: (fn) => (handlers.installed = fn) },
    onStartup: { addListener: (fn) => (handlers.startup = fn) },
    onMessage: { addListener: (fn) => (handlers.message = fn) },
    getManifest: () => ({ version: "0.4.2" }),
    lastError: null,
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {},
    },
    onChanged: { addListener: () => {} },
  },
  action: {
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
  },
  tabs: { create: () => {}, query: async () => [] },
  scripting: {
    registerContentScripts: async () => {},
    getRegisteredContentScripts: async () => [],
    unregisterContentScripts: async () => {},
    executeScript: async () => {},
  },
  permissions: { contains: async () => false },
  downloads: { download: async () => {} },
}

let pass = 0
let fail = 0
const check = (cond, label) => {
  if (cond) { pass++; console.log(`  ✅ ${label}`) }
  else { fail++; console.log(`  ❌ ${label}`) }
}

console.log("① 加载 background.js（检查顶层代码有没有错）…")
try {
  await import("../background.js")
  check(true, "模块加载成功（无顶层错误）")
} catch (e) {
  check(false, `模块加载失败：${e.message}`)
  console.log(e.stack)
  process.exit(1)
}

console.log("\n② 模拟扩展安装（onInstalled）…")
try {
  await handlers.installed()
  check(created.length > 0, `创建了 ${created.length} 个菜单项`)
  const root = created.find((c) => c.id === "biolookup-root")
  check(!!root, "根菜单 biolookup-root 存在")
  check(root && root.contexts && root.contexts.includes("selection"), "根菜单 contexts 含 selection")
  const ids = created.map((c) => c.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  check(dupes.length === 0, `无重复 id${dupes.length ? "（重复：" + dupes.join(",") + "）" : ""}`)
  const parents = created.filter((c) => c.parentId).map((c) => c.parentId)
  const missingParent = [...new Set(parents)].filter((p) => !ids.includes(p))
  check(missingParent.length === 0, `所有 parentId 都存在${missingParent.length ? "（缺失：" + missingParent.join(",") + "）" : ""}`)
  console.log(`     菜单结构：${created.filter((c) => c.id === "biolookup-root" || c.parentId === "biolookup-root").length} 项（含分隔符）`)
} catch (e) {
  check(false, `onInstalled 抛错：${e.message}`)
  console.log(e.stack)
}

console.log("\n③ 模拟选中 BRCA1 右键（onShown）…")
try {
  handlers.shown({ selectionText: "BRCA1", menuItemId: undefined }, {})
  await new Promise((r) => setTimeout(r, 60))
  const rootUpdate = updates.find((u) => u.id === "biolookup-root")
  check(!!rootUpdate, "更新了根菜单（标题/可见性）")
  check(rootUpdate && rootUpdate.opts.visible === true, "根菜单被设为可见")
  check(rootUpdate && /基因/.test(rootUpdate.opts.title || ""), `根菜单标题含识别结果：${rootUpdate?.opts?.title}`)
  const refreshCalls = log.filter((l) => l === "refresh").length
  check(refreshCalls > 0, `调用了 refresh()（${refreshCalls} 次）`)
  check(updates.some((u) => u.id === "act:auto"), "更新了「智能跳转」项")
  check(updates.some((u) => u.id === "act:batch"), "更新了「批量查询」项")
} catch (e) {
  check(false, `onShown 抛错：${e.message}`)
  console.log(e.stack)
}

console.log("\n④ 模拟选中非查询文本（普通中文句子）…")
try {
  updates.length = 0
  handlers.shown({ selectionText: "这是一段很长的中文句子不应该被识别" }, {})
  await new Promise((r) => setTimeout(r, 30))
  const rootUpdate = updates.find((u) => u.id === "biolookup-root")
  check(rootUpdate && rootUpdate.opts.visible === false, "不适合查询的文本 → 菜单隐藏（visible:false）")
} catch (e) {
  check(false, `onShown(非查询文本) 抛错：${e.message}`)
}

console.log("\n⑤ 模拟选中 VCF 多行…")
try {
  updates.length = 0
  handlers.shown({ selectionText: "17\t7676154\trs80357906\tC\tT\nchr1\t12345\t.\tA\tG" }, {})
  await new Promise((r) => setTimeout(r, 30))
  const rootUpdate = updates.find((u) => u.id === "biolookup-root")
  check(rootUpdate && /VCF/.test(rootUpdate.opts.title || ""), `VCF 标题正确：${rootUpdate?.opts?.title}`)
} catch (e) {
  check(false, `onShown(VCF) 抛错：${e.message}`)
}

console.log(`\n模拟测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
