# Changelog

All notable changes to **Bio Lookup (生信快查)** are documented here.
本文件记录「生信快查」的版本变更。

---

## [0.6.2] — 2026-09-15

### 🌏 多语言声明（为商店添加中文 listing 铺路）

- 新增 `_locales/zh_CN/messages.json` 与 `_locales/en/messages.json` 文案
- manifest 增加 `default_locale: zh_CN`，并将 `name` / `description` / `action.default_title`
  改为 `__MSG_*__` 多语言引用
- 效果：扩展名称与描述按浏览器语言显示 —— 中文环境「生信快查 · Bio Lookup」，英文环境「Bio Lookup」

**为什么做这个**：Microsoft Edge 商店只允许为「**从扩展包中识别出的语言**」创建商店 listing。
此前扩展包未声明任何语言（缺少 `_locales`），商店判定只有英文 → Store listings 页面的
「Add language」下拉框被禁用 → 无法为中文用户创建中文商店页面。本版修正后，商店可识别
中/英两种语言，即可添加中文 listing。

### ✅ 验证
- Edge 官方打包校验通过（`_locales` 与 `__MSG__` 引用合法）
- 169 项自动化测试通过

---

## [商店上线] — 2026-09-12

### 🎉 Microsoft Edge Add-ons 正式上线（Live）

- 扩展已通过 Microsoft Edge Add-ons 审核并公开发布
- 商店链接：<https://microsoftedge.microsoft.com/addons/detail/nppooifacggmmpmcapgpjengdbhpjcee>
- 商店 ID `ORDCKFTQ6T96` · CRX ID `nppooifacggmmpmcapgpjengdbhpjcee`
- 现在可以**一键安装、自动更新**，不再需要开发者模式

## [0.6.1] — 2026-09-11

### ⚡ 性能
- **扫描本页提速**：113 个关键词原本逐条正则扫描整页文本，改为**合并为单个正则一次遍历**。
  实测 285 KB 页面文本：**由秒级降至 11 ms**（约 30–100 倍提升）。

### 🧪 测试与验证
- 新增 `tests/scanpage.sim.mjs`（23 项）：完整覆盖「扫描本页」消息链路
  （tab 获取 → `scripting.executeScript` 注入 → 实体提取 → 异常路径 → 高亮词表接口），
  并校验注入函数满足 MV3「自包含、不引用外部变量」的要求
- **真机验证自动高亮**：以真实 content.js 在 headless Edge 中运行，
  20 处标记全部正确、干扰项（`BRCA1A` / `xEGFR` / `GDP` / `METABOLISM`）全部排除、
  关闭时 0 处标记；像素级 A/B 对比确认高亮视觉生效（开启 8864 vs 关闭 191 绿色像素，46×）
- 测试总数 **169 项**，全部通过

---

## [0.6.0] — 2026-09-11

### ✨ 新增（借鉴 Zotero Connector / 网页标注类扩展）
- **🔍 扫描本页**：一键提取当前网页里的全部基因 / rsID / 变异 / GEO 编号 / PMID / DOI，
  去重计数后填入批量面板，一次查完。使用 `activeTab` 权限，**仅在你点击按钮时**读取当前页。
- **🖍️ 网页基因自动高亮**（可选，默认关闭）：网页里出现的已知基因 / rsID / 数据集编号自动标记，
  点击即弹查询卡片。只标记本地词表内的**高置信目标**（113 个词条 + 编号格式），单页上限 150 处。
- **英文 README**（`README.en.md`）+ 本 CHANGELOG + GitHub Issue 模板。

### 🔧 改进
- 页面浮层与自动高亮**共用同一份网页访问授权**（可选权限，按需申请）
- 设置页新增「页面自动高亮」开关，切换后**无需刷新页面**即时生效
- 新增 21 项扫描/提取测试（总计 **146 项自动化测试**）

### 📦 打包
- 11 个文件 · 56 KB · Chrome/Edge 116+

---

## [0.5.0] — 2026-09-11

### 🐞 修复：某些环境下右键菜单不出现（重要）
- **根因**：`chrome.contextMenus.onShown`（Chrome/Edge 116+ API）在部分环境为 `undefined`，
  而它在顶层代码被直接调用 → 抛错 `Cannot read properties of undefined (reading 'addListener')`
  → **后续注册 `onInstalled`（创建菜单）的代码从未执行** → 菜单永不出现。
- **修复**：所有 chrome API 监听注册改为**防御式可选链**（6 处）；新增**启动兜底**（SW 一启动就建菜单）；
  `onShown` 缺失时**优雅降级**（菜单常显，点击仍按类型智能路由）。

### 🎨 主题：明亮自然山水丛林
- 浅色自然背景（晨空渐变 + 暖阳光斑 + 飘云）
- **内联 SVG 山水丛林**背景层（层叠远山 + 松林剪影 + 水面反光）——纯 CSS/SVG，零外部图片依赖
- 主色森林绿 / 草绿 / 暖阳金；类型主题色在浅底上自动压暗保证可读性
- popup / 设置页 / 页面浮层三处统一

### ✨ 其他
- 新增降级场景测试（模拟 API 缺失）与模拟运行测试

---

## [0.4.3] — 2026-09-11

### 🔧 稳定性
- **service worker 改为单文件** `background.bundle.js`（构建脚本合并三个模块，去掉 ESM 语法），
  manifest 移除 `"type": "module"` → 消除 MV3 ESM 兼容风险
- 菜单创建自检：结果写入本地存储，**设置页可直接看到**「上次创建时间 / 项数 / 错误数」
- 设置页新增「🔧 重新创建右键菜单」按钮

---

## [0.4.2] — 2026-09-11

### 🐞 修复
- **popup 三个面板内容重叠**：`display:flex` 覆盖了 `hidden` 属性的 UA 样式 → 加 `[hidden]{display:none!important}`
- popup 版本号改为从 manifest 动态读取

---

## [0.4.1] — 2026-09-11

### 🐞 修复
- **右键菜单不显示**：不再在 `onShown` 里 `removeAll` + 重建（异步时序会清空菜单），
  改为「安装时创建固定菜单 + `onShown` 只更新标题与可见性」

---

## [0.4.0] — 2026-09-11

### ✨ 新增
- **类型主题色系统**：11 种识别类型各配主题色，贯穿菜单标题 / 面板提示 / 数据库按钮 / 历史条目 / 浮层卡片 / 统计图表
- **内置 98 个肿瘤相关基因速查表**（相关癌种 + 主要通路 + 中文名，纯本地数据）；
  别名支持 HER2→ERBB2、PD-L1→CD274、p53→TP53、CLDN18.2→CLDN18
- **序列工具**：选中 DNA 序列即得长度 / GC 含量 / 反向互补链 / RNA 转录，一键复制
- **查询统计看板**：总查询 / 今日 / 类型数 / 库数 + 类型分布条形图 + 常用库 Top 5 + 高频查询词云
- 动效：极光背景、logo 呼吸、按钮光扫、卡片弹入、历史项错峰淡入（遵循 `prefers-reduced-motion`）

---

## [0.3.1] — 2026-09-11

### 🐞 修复（对抗性审查 9 项）
- popup "全部打开" 移到 background 执行（popup 关闭即销毁 JS 上下文，原先只能开 1 个标签）
- VCF CSV 导出改用 `chrome.downloads.download()`（MV3 中 `data:` 顶层导航被禁 + SW 无 DOM）
- 导入自定义库强制校验 `^https?://`（防 `javascript:` 注入）
- `minimum_chrome_version` 102 → 116（`contextMenus.onShown` 要求）
- 自定义库改内存缓存 + `onChanged`（避免 `onShown` 异步读盘导致菜单闪烁）

---

## [0.3.0] — 2026-09-11

### ✨ 新增
- **VCF 批量注释**：解析 VCF 行并归一化坐标（`chr17:7676154 C>T` / `17-7676154-C-T` / `chr17:7676154C>T` 统一为 gnomAD 可识别格式）
- **Zotero 联动**（可选权限 `http://127.0.0.1:23119/*`）：PMID/DOI → 本地 Zotero 库检索 → `zotero://select` 跳转
- 快捷键 `Alt+Shift+B`

---

## [0.2.0] — 2026-09-11

### ✨ 新增
- **页面浮层**：双击选中文本弹查询卡片（Shadow DOM 样式隔离，可选授权）
- **自定义数据库**：`{q}` 模板 + 限定生效类型 + 配置导入导出
- popup **批量查询面板**：≤20 行、实时预览识别类型、按类型分组路由、后台标签限流

---

## [0.1.0] — 2026-09-11

### 🎉 首个版本
- 选中文本右键 → 按识别类型动态列出相关数据库（15+ 库）
- 识别 9 类对象：基因 / GEO·SRA / rsID / 变异(HGVS·坐标·VCF) / 基因组区间 / PMID / DOI / 核酸序列
- 查询历史 + 搜索 / 类型筛选 / CSV 导出
- 默认权限仅 `contextMenus` + `storage`（不读网页内容）
