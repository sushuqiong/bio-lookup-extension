# 生信快查 · Bio Lookup

> 选中基因名 / GEO 编号 / 变异位点 / rsID / PMID，**右键一键跳转 15+ 生信数据库**，并自动保存查询历史。

Chrome / Edge 浏览器扩展（Manifest V3），零依赖、零构建、零追踪。

![预览](docs/preview.png)

## ✨ 为什么做这个

做生信和医学研究时，一个基因名要在 NCBI Gene、Ensembl、GeneCards、UniProt、PubMed 之间反复开 5 个标签页；一个 rsID 要在 dbSNP、gnomAD、ClinVar、VarSome 之间来回跳。

现有插件要么只支持基因（固定跳一个库），要么菜单里塞满所有库（每次都要自己找）。**Bio Lookup 换了个思路：先识别你选中的是什么，再只给你看相关的库。**

## 🎯 核心特性

| 特性 | 说明 |
|---|---|
| **智能类型识别** | 自动判别：基因 / GEO / rsID / 变异(HGVS·坐标) / 区间 / PMID / DOI / 核酸序列 |
| **动态右键菜单** | 菜单只显示与该类型相关的库，不堆砌无关选项 |
| **一键全开** | 一个查询并行打开最多 5 个相关数据库（后台标签，不打断当前页） |
| **查询历史** | 类型 / 库 / 时间自动记录，可搜索、按类型筛选、点击重查、复制、导出 CSV |
| **徽章计数** | 图标显示今日查询次数 |
| **隐私干净** | **不申请 `host_permissions`**，不读取任何网页内容，数据只存本地浏览器 |

## 🗄️ 支持的数据库（15+）

| 类型 | 数据库 |
|---|---|
| 基因 | NCBI Gene · Ensembl · GeneCards · UniProt · NCBI Protein · PubMed |
| SNP (rsID) | dbSNP · ClinVar · gnomAD · VarSome · Franklin |
| 变异 (HGVS) | ClinVar · gnomAD · VarSome · Franklin |
| 变异 (坐标) | gnomAD · ClinVar · VarSome · UCSC |
| GEO / 数据集 | GEO · SRA Run Selector · ArrayExpress · PubMed |
| 文献 | PubMed · Europe PMC · Google Scholar |
| 区间 / 序列 | UCSC Genome Browser · Ensembl · NCBI BLAST |

## 🚀 安装

### 方式一：加载已解压的扩展（开发者模式，推荐自用）

1. 下载本仓库（`Code → Download ZIP`）或 [Releases](https://github.com/sushuqiong/bio-lookup-extension/releases) 里的 `bio-lookup-extension-v0.1.0.zip`，解压
2. Chrome 打开 `chrome://extensions`；**Edge 打开 `edge://extensions`**
3. 打开右上角/左下的「**开发者模式**」
4. 点「**加载已解压的扩展程序**」，选择解压出的 `bio-lookup-extension` 文件夹
5. 完成 ✅（建议把图标固定到工具栏）

> Edge 用户注意：Edge 是 Chromium 内核，本扩展原生兼容，无需任何改动。

### 方式二：等商店版本

Chrome Web Store / Edge Add-ons 上架中（见 Issues）。

## 🖱️ 使用

**右键查询**：在任意网页选中文本 → 右键 → 菜单顶部出现「生信快查 · 🧬 基因「BRCA1」」→ 选择数据库即可跳转。

**一键全开**：同一个菜单里的「🚀 一键全开（5 个库 · 后台标签）」，适合快速比对多个库。

**历史面板**：点浏览器工具栏的扩展图标 → 查看/筛选/重查历史，或手动输入查询词（输入框会自动识别类型并给出推荐库 chips）。

**导出**：历史面板底部「⬇️ 导出 CSV」把查询记录导出（含查询词/类型/数据库/时间），方便写方法学时留痕。

## 🧠 识别规则示例

| 输入 | 识别为 |
|---|---|
| `BRCA1` `TP53` `miR-21` `HLA-DRA` | 🧬 基因 |
| `GSE123456` `GSM1234567` `GPL570` | 📦 GEO 数据集 |
| `rs80357906` | 🔎 SNP (rsID) |
| `chr17:7676154 C>T` `17-7676154-C-T` | 🌍 变异 (坐标) |
| `NM_007294.4:c.68_69del` `p.Val600Glu` | 🧪 变异 (HGVS) |
| `chr1:12345-12400` | 🗺️ 基因组区间 |
| `PMID: 12345678` | 📚 文献 |
| `10.1038/s41586-020-2008-3` | 🔖 DOI |
| 20+ 位 `ATCGN` 串 | 🚀 核酸序列 |

识别引擎有 34 项单元测试（`tests/classify.test.mjs`），全部通过。

## 🔐 权限说明

| 权限 | 用途 |
|---|---|
| `contextMenus` | 显示右键菜单 |
| `storage` | 保存查询历史（仅本地，不同步、不上传） |

**不申请**网页读取权限，不收集任何数据，无网络请求（除了你自己触发的数据库跳转）。

## 🛠️ 开发

```bash
git clone https://github.com/sushuqiong/bio-lookup-extension.git
cd bio-lookup-extension
node tests/classify.test.mjs   # 跑识别引擎测试
# 改完代码后在 chrome://extensions 点扩展卡片上的「刷新」图标即可生效
```

结构：
```
bio-lookup-extension/
├── manifest.json      # MV3 配置（权限最小化）
├── classify.js        # 类型识别 + 数据库映射（纯函数，可单测）
├── background.js      # service worker：动态右键菜单 + 历史存储
├── popup.html/.css/.js# 历史面板 UI（深空主题）
├── icons/             # 16/48/128 图标
└── tests/             # 识别引擎单元测试
```

## 🗺️ Roadmap

- [ ] 页面内浮层：双击基因名直接弹出小卡片（避免右键）
- [ ] 自定义数据库：允许用户添加自己的 URL 模板
- [ ] 变异批量：选中多处变异一次查询
- [ ] 与 Zotero / 文献工具联动
- [ ] i18n（English UI）

## 📄 License

MIT
