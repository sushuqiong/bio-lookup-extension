<div align="center">

# 🧬 生信快查 · Bio Lookup

**选中基因名 / rsID / 变异位点 / GEO 编号 / PMID → 右键 → 一键跳转 15+ 生信数据库**

为生信与医学研究者做的浏览器扩展 · 零依赖 · 默认不读网页 · 无追踪

[![Edge Add-ons](https://img.shields.io/badge/Edge%20Add--ons-%E5%AE%A1%E6%A0%B8%E4%B8%AD%20In%20Review-f59e0b?style=for-the-badge)](https://microsoftedge.microsoft.com/addons/detail/ORDCKFTQ6T96)
[![Release](https://img.shields.io/github/v/release/sushuqiong/bio-lookup-extension?style=for-the-badge&color=16a34a)](https://github.com/sushuqiong/bio-lookup-extension/releases/latest)
[![License](https://img.shields.io/github/license/sushuqiong/bio-lookup-extension?style=for-the-badge&color=16a34a)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-169%20passing-16a34a?style=for-the-badge)](tests/)
[![Manifest](https://img.shields.io/badge/Manifest-V3-16a34a?style=for-the-badge)](manifest.json)
[![Size](https://img.shields.io/badge/package-58%20KB-16a34a?style=for-the-badge)](https://github.com/sushuqiong/bio-lookup-extension/releases/latest)

[**中文**](README.md) · [English](README.en.md)

<img src="docs/store/shot1-context-menu.png" width="820" alt="选中基因名右键即可查询">

</div>

---

## 💡 它解决什么问题

做生信的人每天都要重复这件事：**同一个基因名，在 5 个数据库之间复制粘贴**。

查 `BRCA1` → 开 GeneCards 看癌种、开 NCBI Gene 看条目、开 UniProt 看蛋白、开 PubMed 找文献；
查 `rs80357906` → 开 dbSNP、开 gnomAD 看频率、开 ClinVar 看致病性……
查 10 个基因，一排标签页，还记不住哪个是哪个。

**生信快查把这件事变成：选中 → 右键 → 点一下。**

---

## ⬇️ 安装（30 秒）

### 方式一 · Microsoft Edge 商店 ⏳ *（审核中，1–7 个工作日）*

> 已提交 Microsoft Edge Add-ons 审核（Store ID `ORDCKFTQ6T96`）。上线后可一键安装：
> **`https://microsoftedge.microsoft.com/addons/detail/ORDCKFTQ6T96`**
>
> ✅ 一键安装 · ✅ 自动更新 · ✅ 重启不丢 · ✅ 无需开发者模式

### 方式二 · GitHub 下载（**现在就能用**）

1. **[点此下载最新版 zip](https://github.com/sushuqiong/bio-lookup-extension/releases/latest)**（文件名形如 `bio-lookup-extension-vX.Y.Z.zip`）
2. **解压**到一个**固定位置**（例如 `C:\Users\<你>\Extensions\bio-lookup`）
3. 打开扩展页：Edge → `edge://extensions` ｜ Chrome → `chrome://extensions`
4. 打开「**开发人员模式**」（Edge 在左侧栏最底部，Chrome 在右上角）
5. 点「**加载解压缩的扩展程序**」→ 选中第 2 步**解压出来的文件夹**（不是 zip）

> [!IMPORTANT]
> **加载后请勿移动、重命名或删除该文件夹！** 浏览器记录的是文件夹的**绝对路径**，一旦移动，扩展会立即从浏览器中消失（需要重新加载）。
>
> 要求：桌面版 Chrome / Edge **116+**。

**装好后自测**：打开任意网页 → 选中 `BRCA1` → 右键 → 应出现「生信快查 · 🧬 基因「BRCA1」」

<details>
<summary><b>更新到新版本怎么做？</b></summary>

下载新 zip → 解压**覆盖原文件夹** → 回到扩展页点该扩展的**刷新图标** 🔄
（商店版则是自动更新，什么都不用做）
</details>

---

## ✨ 功能亮点

| | 功能 | 说明 |
|---|---|---|
| 🔍 | **扫描本页** | 一键提取当前网页里所有基因 / rsID / 变异 / GEO 编号 / PMID / DOI，去重计数后填入批量面板 —— 读论文时一次查完整篇 |
| 🧠 | **9 类对象智能识别** | 基因 · GEO/SRA · rsID · HGVS 变异 · 坐标变异 · VCF 行 · 基因组区间 · PMID/DOI · 核酸序列 |
| 🎯 | **菜单只列相关库** | 选中 `rs80357906` 只显示变异库，不会把所有库堆进来 |
| 🚀 | **一键全开** | 变异解读要同时看人群频率 + 致病性 + 原始记录 → 一次点击后台打开最多 5 个相关库 |
| 🧬 | **98 个肿瘤相关基因速查表** | 选中基因即显示**相关癌种 + 主要通路**（纯本地数据，不联网） |
| 🖍️ | **网页基因自动高亮**（可选） | 网页里的基因名自动标记，点一下即弹查询卡 |
| 🧾 | **VCF 批量注释** | 选中一段 VCF → 坐标归一化为 gnomAD 标准格式 → 批量查询或导出 CSV |
| 📚 | **批量查询** | 粘贴论文里的基因清单，按各自类型自动路由到首选库 |
| 🔬 | **序列工具** | DNA 序列 → 长度 / GC 含量 / 反向互补链 / RNA 转录，一键复制 |
| 📊 | **查询统计 + 历史** | 类型分布、常用库 Top 5、高频词云；历史可搜索、筛选、重查、导出 CSV |
| 📗 | **Zotero 联动**（可选） | 选中 PMID / DOI 在本地 Zotero 库中查找并跳转 |
| ⚙️ | **自定义数据库** | 用 `{q}` 模板接入实验室镜像 / 内部系统，可限定适用类型 |

<details>
<summary><b>🖼️ 点击查看全部界面截图（6 张）</b></summary>

| 智能识别 + 基因速查 | 右键菜单 | VCF 批量注释 |
|---|---|---|
| ![panel](docs/store/shot2-history.png) | ![menu](docs/store/shot1-context-menu.png) | ![vcf](docs/store/shot3-vcf.png) |

| 扫描本页 | 网页基因高亮 | 查询统计 |
|---|---|---|
| ![scan](docs/store/shot7-scan.png) | ![highlight](docs/store/shot8-highlight.png) | ![stats](docs/store/shot6-stats.png) |

</details>

---

## 🧬 内置 98 个肿瘤相关基因速查表（本地数据）

选中基因时，除了给跳转链接，还**直接告诉你这个基因是干什么的**：

| 基因 | 相关癌种 | 主要通路 |
|---|---|---|
| `BRCA1` | 乳腺癌 · 卵巢癌 · 前列腺癌 · 胰腺癌 | 同源重组修复 HRR |
| `CD274`（PD-L1） | 泛癌免疫治疗标志 · 肺癌 · 胃癌 | 免疫检查点 |
| `CLDN18` | 胃癌 · 食管胃结合部癌 | 细胞黏附 / 治疗靶点 |
| `EGFR` | 非小细胞肺癌 · 结直肠癌 · 胶质母细胞瘤 | RTK / RAS / MAPK |
| `DPYD` | 5-FU / 卡培他滨毒性 | 药物代谢 |

覆盖靶向治疗、免疫检查点、MMR/HRR 通路、化疗敏感性等方向。
**别名也认**：`HER2`→ERBB2、`PD-L1`→CD274、`p53`→TP53、`CLDN18.2`→CLDN18。

---

## 📊 支持的数据库（15+）

| 类别 | 数据库 |
|---|---|
| 🧬 基因 | NCBI Gene · Ensembl · GeneCards · UniProt · NCBI Protein · PubMed |
| 🔎 变异 | dbSNP · ClinVar · gnomAD · VarSome · Franklin · UCSC Genome Browser |
| 📦 数据集 | GEO · SRA Run Selector · ArrayExpress |
| 📚 文献 | PubMed · Europe PMC · Google Scholar · Zotero（本机库） |
| 🚀 序列 | NCBI BLAST |

---

## 🔒 隐私

- **默认不读网页内容** —— 核心功能只需右键菜单 + 本地存储权限
- 网页读取（浮层 / 高亮 / 扫描本页）全部是**按需授权**，你主动开启才生效；扫描用 `activeTab`，**只在你点按钮时**读取当前页
- 所有数据（历史 / 设置 / 自定义库）**只存在你的浏览器本地，不上传任何服务器**
- **无账号、无统计埋点、无遥测、无远程代码**
- 隐私政策：<https://sushuqiong.github.io/bio-lookup-extension/privacy.html>

---

## 🧪 测试

**169 项自动化测试**，全部可离线运行（Node 18+）：

```bash
node tests/classify.test.mjs           # 67 — 类型识别 / VCF 解析 / URL 构造
node tests/genedata.test.mjs           # 26 — 基因表 / 别名 / 序列工具
node tests/scan.test.mjs               # 21 — 页面扫描 / 高亮词表
node tests/scanpage.sim.mjs            # 23 — 「扫描本页」完整消息链路
node tests/background.sim.mjs          # 14 — 模拟 Chrome API 跑后台逻辑
node tests/background.bundle.sim.mjs   # 10 — 单文件包行为
node tests/background.degraded.sim.mjs # 8  — API 缺失时的优雅降级
```

---

## ❓ 常见问题

<details>
<summary><b>右键看不到「生信快查」菜单？</b></summary>

1. 先确认扩展已启用（`edge://extensions` 里卡片是开启状态）
2. 选中文本后再右键（菜单需要选中内容才出现）
3. 扩展设置页（点图标 → ⚙️）有「**🔧 重新创建右键菜单**」按钮，点一下即可修复
4. 该页还会显示菜单诊断信息（创建时间 / 项数 / 错误数）

</details>

<details>
<summary><b>重启浏览器后扩展消失了？</b></summary>

几乎都是**文件夹被移动/重命名/删除**导致的（浏览器记录的是绝对路径）。
把文件夹放回原位置即可恢复；若已删除，重新解压 zip 并重新加载一次。

</details>

<details>
<summary><b>页面浮层 / 自动高亮不生效？</b></summary>

这两个是**可选功能**，需要在设置页手动开启并授权；开启后**刷新一下网页**才会注入。
`chrome://`、PDF 阅读器、扩展商店页等浏览器内部页面不支持（浏览器限制）。

</details>

<details>
<summary><b>识别错了怎么办？</b></summary>

正则识别无法做到零误判（`COVID`、`MISSING` 可能被当作基因符号；7–9 位数字可能被当作 PMID）。
每个菜单末尾都附有**通用检索兜底**（NCBI 全库 / Google Scholar），不会让你无路可走。

</details>

---

## ⚠️ 已知限制

- 正则识别无法根治假阳性（见上）
- 页面浮层 / 高亮在浏览器内部页面、PDF 阅读器、VS Code / Zotero 内嵌浏览器中不生效
- 批量查询与 VCF 批量上限 15–20 条（避免一次打开几十个标签）
- Zotero 联动需要本机运行 Zotero 7 并允许其他应用通讯

---

## 🛠️ 开发与构建

<details>
<summary><b>项目结构 / 构建方式（点击展开）</b></summary>

```
manifest.json          # MV3 清单
classify.js            # 类型识别 + 数据库映射（纯函数）
genedata.js            # 类型主题色 + 98 基因表 + 序列工具 + 页面实体提取
background.js          # service worker 源码
background.bundle.js   # 构建产物：三模块合并的单文件（无 ESM，扩展实际使用）
content.js             # 页面浮层 + 网页基因高亮（按需注入）
popup.html/css/js      # 主面板（查询 / 批量 / 统计）
options.html/js        # 设置页（自定义库 / 浮层 / 高亮 / 菜单修复）
build.py               # 构建脚本：生成 background.bundle.js
tests/                 # 169 项自动化测试
docs/                  # GitHub Pages 落地页 + 隐私政策 + 商店素材
```

重新生成后台脚本：

```bash
python build.py
```

</details>

<details>
<summary><b>版本变更记录</b></summary>

见 [CHANGELOG.md](CHANGELOG.md)（含每个版本的功能与修复说明）

</details>

---

## 📄 许可与反馈

[MIT License](LICENSE) © 2026 sushuqiong

欢迎在 [**GitHub Issues**](https://github.com/sushuqiong/bio-lookup-extension/issues) 提问题、报 Bug、提需求（中文即可）。

如果它对你有用，**点个 ⭐ Star** 是最大的鼓励 🙌

<div align="center">

**为生信和临床研究的日常，省下每一次复制粘贴。**

</div>
