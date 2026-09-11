/**
 * 验证单文件 bundle（background.bundle.js）逻辑与 module 版一致
 * 运行：node tests/background.bundle.sim.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, "..")

const log = []
const created = []
const updates = []
const handlers = {}
let stored = {}

globalThis.chrome = {
  contextMenus: {
    removeAll: (cb) => { log.push("removeAll"); created.length = 0; cb && cb() },
    create: (opts, cb) => { created.push(opts); cb && cb() },
    update: (id, opts, cb) => { updates.push({ id, opts }); cb && cb() },
    refresh: () => log.push("refresh"),
    onShown: { addListener: (fn) => (handlers.shown = fn) },
    onClicked: { addListener: (fn) => (handlers.clicked = fn) },
  },
  runtime: {
    onInstalled: { addListener: (fn) => (handlers.installed = fn) },
    onStartup: { addListener: (fn) => (handlers.startup = fn) },
    onMessage: { addListener: (fn) => (handlers.message = fn) },
    getManifest: () => ({ version: "0.4.3" }),
    lastError: null,
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async (o) => { stored = { ...stored, ...o } },
    },
    onChanged: { addListener: () => {} },
  },
  action: { setBadgeText: () => {}, setBadgeBackgroundColor: () => {} },
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
const check = (c, label) => { if (c) { pass++; console.log(`  ✅ ${label}`) } else { fail++; console.log(`  ❌ ${label}`) } }

const src = path.join(root, "background.bundle.js")
const tmp = path.join(root, "_bundle_tmp.mjs")
fs.copyFileSync(src, tmp)

console.log("① 加载 background.bundle.js（单文件，无 ESM）…")
try {
  await import("file://" + tmp.replace(/\\/g, "/") + "?t=" + Date.now())
  check(true, "单文件 SW 加载成功")
} catch (e) {
  check(false, `加载失败：${e.message}`)
  console.log(e.stack)
  fs.unlinkSync(tmp)
  process.exit(1)
}

console.log("\n② onInstalled 创建菜单…")
await handlers.installed()
await new Promise((r) => setTimeout(r, 500))
check(created.length >= 15, `创建 ${created.length} 个菜单项`)
check(created.some((c) => c.id === "biolookup-root"), "根菜单存在")
const ids = created.map((c) => c.id)
check(ids.filter((x, i) => ids.indexOf(x) !== i).length === 0, "无重复 id")
check(stored.menuDiag && stored.menuDiag.total > 0, `菜单自检已写入 storage（total=${stored.menuDiag?.total}，errors=${stored.menuDiag?.errors?.length ?? "?"}）`)

console.log("\n③ onShown 模拟（BRCA1）…")
handlers.shown({ selectionText: "BRCA1" }, {})
await new Promise((r) => setTimeout(r, 60))
const u = updates.find((x) => x.id === "biolookup-root")
check(u && u.opts.visible === true, "根菜单可见")
check(u && /基因/.test(u.opts.title), `标题：${u?.opts?.title}`)
check(log.includes("refresh"), "调用了 refresh()")

console.log("\n④ onShown（VCF 多行）…")
updates.length = 0
handlers.shown({ selectionText: "17\t7676154\trs80357906\tC\tT\nchr1\t12345\t.\tA\tG" }, {})
await new Promise((r) => setTimeout(r, 40))
check(/VCF/.test(updates.find((x) => x.id === "biolookup-root")?.opts?.title || ""), "VCF 标题正确")

console.log("\n⑤ onClicked（智能跳转）不抛错…")
try {
  await handlers.clicked({ menuItemId: "act:auto", selectionText: "BRCA1" })
  check(true, "点击「智能跳转」无异常")
} catch (e) {
  check(false, `点击抛错：${e.message}`)
}

fs.unlinkSync(tmp)
console.log(`\nbundle 模拟测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
