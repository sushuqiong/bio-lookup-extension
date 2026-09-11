/**
 * 极端场景测试：某些 chrome API 不存在时（如 contextMenus.onShown 缺失），
 * 后台脚本必须不崩溃、且菜单仍然创建成功。
 * 运行：node tests/background.degraded.sim.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, "..")

async function loadBundle({ hasOnShown }) {
  const created = []
  const handlers = {}
  const errors = []

  globalThis.chrome = {
    contextMenus: {
      removeAll: (cb) => { created.length = 0; cb && cb() },
      create: (o, cb) => { created.push(o); cb && cb() },
      update: () => {},
      refresh: () => {},
      // onShown 可能不存在（老版本 / API 未提供）
      ...(hasOnShown ? { onShown: { addListener: (fn) => (handlers.shown = fn) } } : {}),
      onClicked: { addListener: (fn) => (handlers.clicked = fn) },
    },
    runtime: {
      onInstalled: { addListener: (fn) => (handlers.installed = fn) },
      onStartup: { addListener: (fn) => (handlers.startup = fn) },
      onMessage: { addListener: (fn) => (handlers.message = fn) },
      getManifest: () => ({ version: "0.5.0" }),
      lastError: null,
    },
    storage: {
      local: { get: async () => ({}), set: async () => {} },
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

  // 捕获所有未处理异常（模拟浏览器上报的错误）
  const onErr = (e) => errors.push(e)
  process.on("uncaughtException", onErr)

  const tmp = path.join(root, `_degraded_${hasOnShown}.mjs`)
  fs.copyFileSync(path.join(root, "background.bundle.js"), tmp)
  let loadError = null
  try {
    await import("file://" + tmp.replace(/\\/g, "/") + "?t=" + Date.now())
  } catch (e) {
    loadError = e
  }
  fs.unlinkSync(tmp)
  process.off("uncaughtException", onErr)
  return { created, handlers, errors, loadError }
}

let pass = 0, fail = 0
const check = (c, label) => { if (c) { pass++; console.log(`  ✅ ${label}`) } else { fail++; console.log(`  ❌ ${label}`) } }

console.log("场景 A：正常环境（onShown 存在）")
{
  const r = await loadBundle({ hasOnShown: true })
  check(!r.loadError, "加载无异常")
  check(r.created.length >= 15, `启动即创建菜单（${r.created.length} 项）`)
}

console.log("\n场景 B：onShown 不存在（老版本 / API 缺失）")
{
  const r = await loadBundle({ hasOnShown: false })
  check(!r.loadError, `加载无异常${r.loadError ? "：" + r.loadError.message : ""}`)
  check(r.errors.length === 0, `无未捕获异常（${r.errors.length} 个）`)
  check(r.created.length >= 15, `菜单仍然创建成功（${r.created.length} 项）——这是关键`)
  check(!!r.handlers.clicked, "onClicked 仍注册（点击可用）")
  check(!!r.handlers.installed, "onInstalled 仍注册（更新时会重建菜单）")
  if (r.handlers.clicked) {
    try {
      await r.handlers.clicked({ menuItemId: "act:auto", selectionText: "BRCA1" })
      check(true, "onShown 缺失时点击「智能跳转」仍可用")
    } catch (e) {
      check(false, `点击抛错：${e.message}`)
    }
  }
}

console.log(`\n降级场景测试：通过 ${pass} / 失败 ${fail}`)
process.exit(fail ? 1 : 0)
