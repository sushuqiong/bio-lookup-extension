# 生信快查 · Bio Lookup

[**中文**](README.md) | [English](README.en.md)

![release](https://img.shields.io/github/v/release/sushuqiong/bio-lookup-extension?color=16a34a)
![license](https://img.shields.io/github/license/sushuqiong/bio-lookup-extension?color=16a34a)
![manifest](https://img.shields.io/badge/Manifest-V3-16a34a)
![tests](https://img.shields.io/badge/tests-169%20passing-16a34a)
![size](https://img.shields.io/badge/package-56%20KB-16a34a)

> 选中基因名 / GEO 编号 / 变异位点 / rsID / PMID，**右键一键跳转 15+ 生信数据库**——智能识别类型、**内置 98 个肿瘤相关基因速查表**、VCF 批量注释、**序列工具**、Zotero 联动、页面浮层、批量查询、自定义数据库、**查询统计**与历史导出。

Chrome / Edge 浏览器扩展（Manifest V3）· 零依赖零构建 · **明亮自然山水主题** · 默认不读网页 · 无追踪

## ⬇️ 下载安装（30 秒，无需编译、无需 Node）

1. **下载**：[点这里下载最新版 zip](https://github.com/sushuqiong/bio-lookup-extension/releases/latest) （文件名 `bio-lookup-extension-vX.Y.Z.zip`）
2. **解压**到任意文件夹
3. 打开浏览器的扩展页：
   - Microsoft Edge → 地址栏输入 `edge://extensions`
   - Google Chrome → 地址栏输入 `chrome://extensions`
4. 打开「**开发人员模式**」（Edge 在左侧栏最底部；Chrome 在右上角）
5. 点「**加载解压缩的扩展程序**」→ 选中第 2 步**解压出来的文件夹**（不是 zip）

> 要求：桌面版 Chrome / Edge **116 或更高版本**。

**装好后测一下**：随便打开一个网页 → 选中 `BRCA1` → 右键 → 应看到「生信快查 · 🧬 基因「BRCA1」」。

### 更新到新版本
下载新 zip 解压覆盖原文件夹 → 回到扩展页点该扩展的**刷新**图标 🔄 即可。



| 🔍 **扫描本页**（v0.6.0） | 🖍️ **网页基因自动高亮**（v0.6.0） |
|---|---|
| ![扫描本页](docs/store/shot7-scan.png) | ![自动高亮](docs/store/shot8-highlight.png) |

| 智能识别 + 基因速查 | 右键菜单 | VCF 批量注释 |
|---|---|---|
| ![查询面板](docs/store/shot2-history.png) | ![右键菜单](docs/store/shot1-context-menu.png) | ![VCF](docs/store/shot3-vcf.png) |

| 批量查询 | 查询统计 | 页面浮层 |
|---|---|---|
| ![批量](docs/store/shot5-batch.png) | ![统计](docs/store/shot6-stats.png) | ![浮层](docs/store/shot4-float.png) |


> 更多界面图见 `docs/store/`（右键菜单 / 历史面板 / VCF 批量 / 页面浮层 / 基因速查 / 统计看板）

---

## 🆕 v0.6.0 新功能

### 🔍 扫描本页（借鉴 Zotero Connector 的"抓取页面"）
点面板里的 **「🔍 扫描本页」**，一键提取当前网页里所有 **基因 / rsID / 变异 / GEO 编号 / PMID / DOI**，
自动去重计数后填入批量面板——读论文时不用再一个个复制粘贴，一次把整页的基因查完。

> 使用 `activeTab` 权限：**只在你点击按钮时**读取当前页，平时完全不碰网页内容。

### 🖍️ 网页基因自动高亮（可选，默认关闭）
开启后，网页里出现的**已知基因名 / rsID / 数据集编号**会自动加绿色下划线标记，
**点一下即弹出查询卡片**。只标记本地词表内的高置信目标（113 个词条 + 编号格式），单页上限 150 处，
且**点击即查、不联网**。设置页可随时开关，切换后无需刷新页面。

### 🌏 国际化与社区规范
- 新增 **英文 README**（`README.en.md`）与 **CHANGELOG**（完整版本记录）
- 新增 **GitHub Issue 模板**（Bug 报告会引导你填浏览器版本 + 错误信息，定位更快）

## 🆕 v0.5.0 稳定性修复 + 明亮自然主题

### 🐞 修复：某些环境下右键菜单不出现
**根因**：`chrome.contextMenus.onShown`（Chrome/Edge 116+ 引入的 API）在部分环境下为 `undefined`，
而它在**顶层代码**里被直接调用 → 抛错 `Cannot read properties of undefined (reading 'addListener')`
→ **后续注册 `onInstalled`（负责创建菜单）的代码根本没执行** → 菜单永不出现。

**修复**：
1. 所有 chrome API 监听注册改为**防御式可选链**（6 处）
2. 新增**启动兜底**：service worker 一启动就尝试创建菜单
3. `onShown` 缺失时**优雅降级**——菜单常显、点击仍按识别类型智能路由，核心功能不受影响
4. 新增**降级场景测试**（模拟 API 缺失）与**模拟运行测试**（模拟 Chrome API 跑完整后台逻辑）

> 如果你遇到同类问题：`edge://extensions` → 点卡片上的「错误」展开即可看到具体报错；本扩展另在**设置页**提供「🔧 重新创建右键菜单」按钮与菜单诊断信息（创建时间/项数/错误数）。

### 🎨 主题：明亮自然山水丛林
- 浅色自然背景：晨空渐变 + 暖阳光斑 + 缓缓飘动的云
- **内联 SVG 山水丛林**背景层（层叠远山 + 松林剪影 + 水面反光），纯 CSS/SVG，**零外部图片依赖**
- 主色：森林绿 / 草绿 / 暖阳金；卡片白色玻璃质感，文字深绿
- 类型主题色在浅色底上自动压暗（`color-mix`），保证可读性
- popup 面板 / 设置页 / 页面浮层**三处统一**

## 🆕 v0.4.3 稳定性修复

| # | 问题 | 修复 |
|---|---|---|
| 1 | 点扩展图标后**三个面板内容重叠**（查询/批量/统计同时渲染） | `display:flex` 覆盖了 `hidden` 属性 → 加 `[hidden]{display:none!important}`；已用 headless 渲染 + OCR 验证 |
| 2 | 选中文本右键**看不到扩展菜单** | v0.4.0 在 `onShown` 里 `removeAll`+重建（异步时序问题会清空菜单）→ 改为**固定菜单 + 智能标题**；并加「🔧 重新创建右键菜单」按钮 |
| 3 | 服务脚本潜在兼容风险 | **service worker 改为单文件**（`background.bundle.js`，构建时合并 genedata+classify+background，去掉 ESM 语法），消除 `type:"module"` 的兼容问题 |
| 4 | 出问题难自查 | 菜单创建结果写入 `storage.menuDiag`，**设置页直接显示**「上次创建时间 / 项数 / 错误数」 |

## 🆕 v0.4 新功能

### 🎨 类型主题色系统（色彩贯穿全局）
11 种识别类型各有专属主题色，颜色贯穿**右键菜单标题 → 面板识别提示 → 数据库按钮 → 历史记录条目 → 浮层卡片边框 → 统计图表**：

| 类型 | 色 | 类型 | 色 |
|---|---|---|---|
| 🧬 基因 | 青绿 `#64ffda` | 📦 GEO | 金橙 `#fbbf24` |
| 🔎 SNP (rsID) | 玫红 `#f472b6` | 📚 文献 | 蓝 `#60a5fa` |
| 🌍 变异 (坐标) | 天蓝 `#38bdf8` | 🔖 DOI | 淡紫 `#c084fc` |
| 🧾 VCF | 紫 `#a78bfa` | 🚀 序列 | 橙 `#f97316` |

看一眼颜色就知道自己查的是什么类型。

### 🧬 内置 98 个肿瘤相关基因速查表（原创数据）
选中/输入基因名后，除了一键跳库，**立刻显示该基因的相关癌种与主要通路**——纯本地数据，不联网、不请求外部 API：
- `BRCA1` → 乳腺癌 · 卵巢癌 · 前列腺癌 · 胰腺癌 | 同源重组修复 HRR
- `CD274` → 泛癌免疫治疗标志 · 肺癌 · 胃癌 | 免疫检查点
- `CLDN18` → 胃癌 · 食管胃结合部癌 | 治疗靶点
- 覆盖靶向治疗（EGFR/ALK/BRAF…）、免疫检查点（PD-L1/PD-1/LAG3/TIGIT…）、MMR/HRR 通路、化疗敏感性（DPYD/UGT1A1/TYMS…）
- 支持别名：`HER2`→ERBB2、`PD-L1`→CD274、`p53`→TP53、`CLDN18.2`→CLDN18

### 🔬 序列工具（选中核酸序列即算）
选中一段 DNA 序列（≥4 bp），面板直接给出：**长度 / GC 含量 / 反向互补链 / RNA 转录**，一键复制——不用再开网页工具。

### 📊 查询统计看板
第三个标签页汇总：总查询数 / 今日 / 类型数 / 库数 + **类型分布条形图**（按类型色）+ **常用数据库 Top 5** + **高频查询词云**（点击可重查）。

### ✨ 动效与视觉
背景极光缓慢流动、logo 呼吸光晕、按钮光扫、卡片弹入、历史项错峰淡入、统计条形增长动画、浮层顶部流光——全部遵循 `prefers-reduced-motion`。

## 🆕 v0.3 新功能

### 🧾 VCF 批量注释（核心新功能）
在网页上**直接选中一段 VCF**（多行，含 `##` header 也没关系）→ 右键菜单变成 VCF 模式：

```
##fileformat=VCFv4.2
#CHROM  POS       ID          REF  ALT
17      7676154   rs80357906  C    T
chr1    12345     .           A    G
2       54321     .           G    A
```

菜单提供：
| 选项 | 行为 |
|---|---|
| 🌍 全部查 gnomAD | 每行按 `CHROM-POS-REF-ALT` 规范格式打开 gnomAD variant 页 |
| 🏥 全部查 ClinVar | 每行转 `17:7676154` 坐标 term 检索 |
| 🧪 全部查 VarSome | 同 gnomAD 规范格式（hg38） |
| 🚀 **智能路由** | 有 rsID 的走 dbSNP，其余走 gnomAD（**一条命令查完混合清单**） |
| ⬇️ 导出规范化查询词 | CSV（CHROM/POS/ID/REF/ALT/gnomAD_query/原行），便于留档或喂给别的工具 |

**关键点**：插件会把 VCF 字段**归一化**成各库能直接识别的格式——`chr17:7676154 C>T`、`chr17:7676154C>T`、`17-7676154-C-T` 三种写法都能转成 gnomAD 需要的 `17-7676154-C-T`。

### 📗 Zotero 联动
选中 `PMID: 12345678` 或 DOI → 右键「📗 在 Zotero 中查找」→ 调用**本机 Zotero API**（127.0.0.1:23119）搜索 → 命中则直接 `zotero://select` 跳转并选中该条目。

前置条件：Zotero 7 运行中 + `设置 → 高级 → 允许其他应用与本机 Zotero 通讯`；插件侧在设置页一键开启（`optional_host_permissions`，只访问本机回环地址）。

### 🐛 对抗性审查修复（v0.3 一并处理）

我做了一轮自审（前端视角），发现并修复：

| # | 问题 | 严重度 | 修复 |
|---|---|---|---|
| 1 | popup 里"全部打开"重查用 `setTimeout`，**popup 一关就中断**（只能开 1 个标签） | 🔴 | 改由 background 执行 |
| 2 | 导入自定义库**未校验 URL 协议**，恶意配置可注入 `javascript:` | 🔴 | 导入时强校验 `^https?://` + 跳过计数提示 |
| 3 | `onShown` 异步读 storage → 菜单可能闪烁/延迟 | 🟡 | 自定义库改内存缓存 + `storage.onChanged` 同步 |
| 4 | 开启浮层后**已打开的页面不生效**（动态注册只对新页面） | 🟡 | 开启时 `executeScript` 立即注入所有 http(s) 标签 |
| 5 | 识别误判无退路（如 `COVID` 被当基因） | 🟡 | 所有类型菜单末尾自动追加 **🔍 NCBI 全库检索 / Google Scholar** |
| 6 | 扩展重载后 content script `sendMessage` 静默失败 | 🟡 | `chrome.runtime.lastError` + try/catch 兜底 |
| 7 | 键盘用户无法唤起浮层 | 🟡 | 加 `Alt+Shift+B` 快捷键打开面板 |

**v0.3.1 追加修复（第二轮审查）**

| # | 问题 | 严重度 | 修复 |
|---|---|---|---|
| 8 | VCF CSV 导出用 `data:` URL + `chrome.tabs.create` → **现代 Chrome/Edge 禁止顶层导航到 `data:`，导出必然失败**（SW 也无 DOM/createObjectURL） | 🔴 | 改用 `chrome.downloads.download()`（`downloads` 权限），SW 环境下唯一可靠路径 |
| 9 | `minimum_chrome_version: 102` 但动态菜单依赖 `contextMenus.onShown`（**需要 116+**）→ 老版本菜单不更新 | 🟡 | 提升至 `116` |

## ⚠️ 已知限制（诚实声明）

| 限制 | 原因 | 影响 |
|---|---|---|
| 大写英文单词可能误判为基因（如 `COVID`、`MISSING`）、7–9 位数字可能误判为 PMID（如样本量、金额） | 正则识别的固有假阳性，无外部词表 | 菜单会给出"基因/文献"库；**每类菜单末尾都有兜底「NCBI 全库检索 / Google Scholar」可退回** |
| 浮层在 `chrome://` 页面、PDF 阅读器、扩展商店页不生效 | 浏览器禁止在这些页面注入脚本 | 右键菜单在普通网页仍可用 |
| 内嵌浏览器（VS Code 内置、Zotero 内置）中右键菜单可能不响应 | `contextMenus` 仅工作于 Chrome 内核宿主 | 请在系统浏览器中使用 |
| Zotero 联动需 Zotero 7 运行且手动开启「允许其他应用通讯」 | Zotero 本地 API 的准入门槛 | 未开启时菜单项存在但会提示（badge 显示 ✗） |
| 批量/VCF 打开上限 15–20 条 | 防止一次性开爆浏览器标签 | 菜单标题已显示实际条数 |
| 仅支持桌面版 Chrome/Edge 116+ | MV3 桌面扩展 | 移动端浏览器不支持扩展 |

> 测试环境说明：本项目在 Node 下完成识别引擎的 67 项自动化测试，但**插件的浏览器内交互（右键菜单/浮层/下载）需在真实浏览器中人工验证**——欢迎实测后提 Issue。


---

## 🎯 创新点在哪里

同类插件（GeneLens、BioSearch、gnomAD 单库插件等，GitHub 上多为 ⭐0–3）普遍是**"一个功能 + 固定菜单"**：要么只认基因、要么菜单里塞满所有库让你自己找、要么没有历史。

Bio Lookup 的四个差异点：

| # | 创新 | 具体表现 | 对研究者的意义 |
|---|---|---|---|
| 1 | **先识别，再给菜单** | 正则引擎判别 9 类对象（基因 / GEO / rsID / HGVS / 坐标 / 区间 / PMID / DOI / 核酸序列），**右键菜单只列出与该类型相关的库** | 选中 rsID 时不会看到 UniProt 这种无关项，减少决策成本 |
| 2 | **一键全开（比对式查询）** | 一次点击并行打开最多 5 个相关库的**后台标签** | 变异解读要同时看 dbSNP + gnomAD 频率 + ClinVar 致病性——这是生信/临床的真实工作流，其他插件没有 |
| 3 | **批量查询** | 粘贴论文里的基因列表 / 变异清单（每行一条，最多 20 条），**按各自类型**自动路由到首选库 | 复现一篇论文的基因集、查一批候选变异，从 20 次手动操作变成 1 次 |
| 4 | **查询历史 + 可导出** | 记录查询词 / 识别类型 / 目标库 / 时间，可搜索、按类型筛选、点击重查、**导出 CSV** | 方法学与可追溯：写 Methods 或回看分析过程时能拿出"我查过哪些位点、用的哪个库" |
| 5 | **内置基因速查表（原创数据）** | 98 个肿瘤/临床相关基因的**相关癌种 + 主要通路 + 中文名**，选中即显示，纯本地 | 选中基因不用再切标签页查"这个基因跟什么癌有关"；临床与科研都能用 |
| 6 | **序列工具 + 类型主题色** | 选中 DNA 序列即算长度/GC/反向互补/RNA；11 类对象各配主题色贯穿全局 | 少开一个序列工具网页；看一眼颜色就知道自己在查什么类型 |

另外两点工程层面的克制：
- **权限最小化**：默认只申请 `contextMenus` + `storage`，**不读任何网页内容**；页面浮层是可选功能，开启时才通过 `optional_host_permissions` 申请
- **数据不出本地**：历史与自定义配置只存 `chrome.storage.local`，无服务器、无遥测

---

## ✨ 功能一览

| 功能 | 说明 |
|---|---|
| 🔍 智能类型识别 | 9 类对象正则判别，**169 项自动化测试**（识别引擎 67 + 数据层 26 + 扫描/高亮 21 + 后台模拟 32，全部可离线运行） |
| 🖱️ 动态右键菜单 | 菜单标题显示识别结果（如「🧬 基因「BRCA1」」），只列相关库 |
| 🚀 一键全开 | 单次查询并行打开 5 个相关库（后台标签，带限流） |
| 🎈 页面浮层 | **双击**任意网页上的基因/rsID/坐标 → 鼠标旁弹出查询卡片（Shadow DOM 隔离，不污染页面） |
| 📚 批量查询 | 粘贴多行清单 → 预览识别结果 → 一次打开；可按类型分组或指定统一库 |
| ⭐ 自定义数据库 | 用 `{q}` 模板添加自己的库（实验室镜像 / 公司内部系统 / 中文数据库），可指定适用类型，支持导入导出配置 |
| 🕘 查询历史 | 搜索 / 类型筛选 / 点击重查 / 复制 / **导出 CSV** |
| 🔢 徽章计数 | 图标显示今日查询次数 |

---

## 🚀 安装（Chrome / Edge）

### 方式一：Releases 下载（推荐）

1. 到 [Releases](https://github.com/sushuqiong/bio-lookup-extension/releases) 下载 `bio-lookup-extension-v0.2.0.zip` 并**解压**
2. Chrome 打开 `chrome://extensions`；**Edge 打开 `edge://extensions`**
3. 开启「**开发者模式**」
4. 点「**加载已解压的扩展程序**」→ 选择解压出的文件夹
5. 建议把图标固定到工具栏

> Edge 基于 Chromium，原生兼容，无需任何改动。

### 方式二：克隆源码

```bash
git clone https://github.com/sushuqiong/bio-lookup-extension.git
cd bio-lookup-extension
node tests/classify.test.mjs   # 跑识别引擎测试
# 然后按上面步骤 2-4 加载本目录
```

---

## 🖱️ 怎么用

### 1. 基础：右键查询
在任意网页选中文本（如 `BRCA1`）→ 右键 → 菜单顶部出现 **「生信快查 · 🧬 基因「BRCA1」」** → 展开选择数据库即可跳转。

### 2. 比对：一键全开
同一菜单里选 **「🚀 一键全开（6 个库 · 后台标签）」**——适合变异解读：dbSNP + gnomAD + ClinVar + VarSome 一次开好，逐个看。

### 3. 浮层：双击即查（可选，需授权）
设置页 → 打开「页面浮层」→ 在网页上**双击** `rs80357906` → 鼠标旁弹出卡片 → 点卡片上的库直接跳转。卡片用 Shadow DOM 实现，不会与页面样式打架。

### 4. 批量：清单式查询
点扩展图标 → **📚 批量查询** 标签 → 粘贴：
```
TP53
BRCA1
rs80357906
GSE123456
chr17:7676154 C>T
```
→ 预览区显示每条被识别成什么 → 选「各自动类型 · 首选库」或「指定统一数据库」→ **🚀 批量打开**（后台标签，最多 20 条）。

### 5. 自定义：接入你自己的库
点扩展图标右上 **⚙️** → 「添加自定义数据库」：
- 名称：`实验室 BLAST 镜像`
- URL 模板：`https://my-lab.org/blast?seq={q}`（`{q}` 会被替换成查询词并自动 URL 编码）
- 适用类型：Ctrl/Cmd 多选（不选=全部类型）

添加后会出现在**右键菜单和浮层卡片里**（排在官方库之后，标注"（自定义）"）。配置可导入导出，方便多台电脑同步。

### 6. 留痕：历史与导出
点图标 → **🕘 查询历史** → 搜索/筛选 → 点任意条目**重查** → 底部 **⬇️ 导出 CSV**（含查询词、类型、数据库、时间）。

---

## 🗄️ 内置数据库（15+）

| 类型 | 数据库 |
|---|---|
| 基因 | NCBI Gene · Ensembl · GeneCards · UniProt · NCBI Protein · PubMed |
| SNP (rsID) | dbSNP · ClinVar · gnomAD · VarSome · Franklin |
| 变异 (HGVS) | ClinVar · gnomAD · VarSome · Franklin |
| 变异 (坐标) | gnomAD · ClinVar · VarSome · UCSC |
| GEO / 数据集 | GEO · SRA Run Selector · ArrayExpress · PubMed |
| 文献 | PubMed · Europe PMC · Google Scholar · **Zotero（本机库）** |
| 区间 / 序列 | UCSC Genome Browser · Ensembl · NCBI BLAST |

## 🧠 识别规则示例

| 输入 | 识别为 |
|---|---|
| `BRCA1` `TP53` `miR-21` `let-7a` `HLA-DRA` `LINC00473` | 🧬 基因 |
| `GSE123456` `GSM1234567` `GPL570` | 📦 GEO 数据集 |
| `rs80357906` | 🔎 SNP (rsID) |
| `chr17:7676154 C>T` `17-7676154-C-T` | 🌍 变异 (坐标) |
| `NM_007294.4:c.68_69del` `p.Val600Glu` | 🧪 变异 (HGVS) |
| `chr1:12345-12400` | 🗺️ 基因组区间 |
| `PMID: 12345678` | 📚 文献 |
| `17	7676154	rs80357906	C	T` | 🧾 VCF 记录（自动归一化为 `rs80357906` 或 `17-7676154-C-T`） |
| `10.1038/s41586-020-2008-3` | 🔖 DOI |
| 20+ 位 `ATCGN` 串 | 🚀 核酸序列 |

---

## 🔐 权限说明

| 权限 | 用途 | 必需 |
|---|---|---|
| `contextMenus` | 显示右键菜单 | ✅ |
| `storage` | 本地保存历史与自定义配置 | ✅ |
| `scripting` | 动态注册/注销页面浮层脚本 | ✅（浮层用） |
| `downloads` | 保存 VCF 规范化查询词 CSV | ✅（导出用） |
| `optional_host_permissions`（http/https） | **仅在你开启页面浮层时**申请，用于注入浮层 | ❌ 默认不申请 |
| `optional_host_permissions`（127.0.0.1:23119） | **仅在你开启 Zotero 联动时**申请，只访问本机 Zotero API | ❌ 默认不申请 |

**无网络请求**（除你自己触发的数据库跳转）、**无遥测**、**不读网页内容**（除非你主动开启浮层）。

## 🛠️ 开发

```
bio-lookup-extension/
├── manifest.json          # MV3 配置（权限最小化 + optional host permissions）
├── classify.js            # 类型识别 + 数据库映射（纯函数，可单测）
├── background.js          # service worker：动态菜单 / 批量路由 / 消息接口 / 浮层注册
├── content.js             # 页面浮层（Shadow DOM 隔离）
├── popup.html/.css/.js    # 历史 + 批量查询面板
├── options.html/.js       # 设置：浮层开关 + 自定义数据库管理
├── icons/                 # 16/48/128
├── build.py               # 构建：合并三模块 → background.bundle.js（消除 ESM 兼容风险）
├── CHANGELOG.md           # 版本变更记录
├── README.en.md           # English README
├── tests/                 # 自动化测试（识别 / 数据 / 后台模拟 / 降级场景，共 101 项）
└── docs/                  # 演示图
```

改完代码后在 `chrome://extensions`（或 `edge://extensions`）点扩展卡片上的「刷新」图标即可生效。

## 🗺️ Roadmap

- [x] v0.1：智能识别 + 动态菜单 + 全开 + 历史
- [x] v0.2：页面浮层 + 批量查询 + 自定义数据库 + CSV 导出
- [x] v0.3：**VCF 批量注释**（字段解析 + 坐标归一化 + 智能路由 + CSV 导出）、**Zotero 联动**（本机 API 搜索 + 跳转选中）、7 项对抗性审查修复
- [ ] v0.4：i18n（English UI）、商店上架（Edge Add-ons / Chrome Web Store）
- [ ] v1.0：支持多基因组合查询、与实验室 LIMS / 内部数据库对接

## 📄 License

MIT © sushuqiong
