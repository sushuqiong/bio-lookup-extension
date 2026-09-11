# -*- coding: utf-8 -*-
"""
构建单文件 service worker（消除 MV3 ESM 兼容风险）
把 genedata.js + classify.js + background.js 合并成 background.bundle.js（无 import/export）
同时把创建菜单的结果写入 storage 供诊断。
"""
import os
import re

SRC = os.path.dirname(os.path.abspath(__file__))


def strip_module_syntax(code, keep_imports=False):
    """去掉 export / import 语句（含多行形式），转成普通脚本"""
    # 1) 移除多行/单行 import ... from "..."
    code = re.sub(r"import\s+[\s\S]*?from\s+[\"'][^\"']+[\"']\s*;?", "", code)
    # 2) 移除裸 import "..."
    code = re.sub(r"import\s+[\"'][^\"']+[\"']\s*;?", "", code)
    # 3) 移除 export * from "..."
    code = re.sub(r"export\s+\*\s+from\s+[\"'][^\"']+[\"']\s*;?", "", code)
    # 4) 移除 export { ... } / export { ... } from "..."
    code = re.sub(r"export\s*\{[\s\S]*?\}\s*(from\s+[\"'][^\"']+[\"'])?\s*;?", "", code)
    # 5) export const/function/let/class → 去掉 export 前缀
    code = re.sub(r"^(\s*)export\s+", r"\1", code, flags=re.M)
    return code


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


genedata = strip_module_syntax(read("genedata.js"))
classify = strip_module_syntax(read("classify.js"))
background = strip_module_syntax(read("background.js"))

# background.js 里的 truncate / parseBatch 是函数声明，classify.js 里没有同名 → 无冲突
bundle = f"""/**
 * background.bundle.js —— 自动生成，请勿直接编辑
 * 由 genedata.js + classify.js + background.js 合并（去掉 ESM 语法），
 * 目的是消除 MV3 service worker 使用 type:"module" 时的兼容风险。
 * 重新生成：python build.py
 */
/* ═══════════ 1/3 genedata.js ═══════════ */
{genedata}

/* ═══════════ 2/3 classify.js ═══════════ */
{classify}

/* ═══════════ 3/3 background.js ═══════════ */
{background}
"""

# 在 bundle 里注入菜单自检（写 storage 供设置页显示）
bundle = bundle.replace(
    "function createMenus() {",
    """function createMenus() {
  const __diag = { ts: Date.now(), total: 0, errors: [] }""",
)
bundle = bundle.replace(
    """      chrome.contextMenus.create({ id: `db:${dbId}`, parentId: ROOT, title: `${db.icon} ${db.label}`, contexts: ["selection"] })""",
    """      __diag.total++
      chrome.contextMenus.create({ id: `db:${dbId}`, parentId: ROOT, title: `${db.icon} ${db.label}`, contexts: ["selection"] }, () => {
        if (chrome.runtime.lastError) __diag.errors.push(`${dbId}: ${chrome.runtime.lastError.message}`)
      })""",
)
bundle = bundle.replace(
    """    chrome.contextMenus.create({ id: "act:zotero", parentId: ROOT, title: "📗 在 Zotero 中查找（PMID / DOI）", contexts: ["selection"] })
  })""",
    """    chrome.contextMenus.create({ id: "act:zotero", parentId: ROOT, title: "📗 在 Zotero 中查找（PMID / DOI）", contexts: ["selection"] })
    __diag.total += 5
    setTimeout(() => {
      chrome.storage.local.set({ menuDiag: __diag }).catch(() => {})
    }, 400)
  })""",
)

out = os.path.join(SRC, "background.bundle.js")
with open(out, "w", encoding="utf-8") as f:
    f.write(bundle)

# 语法校验
import subprocess

r = subprocess.run(["node", "--check", out], capture_output=True, text=True, shell=False)
if r.returncode == 0:
    print("✅ 已生成 background.bundle.js，语法检查通过")
    print("   行数:", len(bundle.split("\n")), "| 大小:", os.path.getsize(out), "B")
else:
    print("❌ 语法错误：")
    print(r.stderr[:1500])
