# Edge Add-ons 上架提交材料（可直接复制粘贴）

> 本文件包含 Microsoft Edge Add-ons 提交时需要的**全部文案与材料清单**。
> 提交入口：https://partner.microsoft.com/dashboard/microsoftedge/overview

---

## 📦 一、提交包（现成的）

| 材料 | 位置 | 状态 |
|---|---|---|
| **扩展包 zip** | `bio-lookup-extension-v0.3.1.zip`（或用仓库 v0.3.1 Release 附件） | ✅ 已打包（12 文件，32KB） |
| 扩展图标 128×128 | `icons/icon128.png` | ✅ |
| **截图 1**（右键菜单） | `docs/store/shot1-context-menu.png` | ✅ 1280×800 |
| **截图 2**（历史面板） | `docs/store/shot2-history.png` | ✅ 1280×800 |
| **截图 3**（VCF 批量） | `docs/store/shot3-vcf.png` | ✅ 1280×800 |
| **截图 4**（页面浮层） | `docs/store/shot4-float.png` | ✅ 1280×800 |
| 小促销图 440×280 | `docs/store/promo-small-440x280.png` | ✅ |
| 大促销图 1400×560 | `docs/store/promo-large-1400x560.png` | ✅ |
| **隐私政策 URL** | https://sushuqiong.github.io/bio-lookup-extension/privacy.html | ✅ 已上线 |
| **官方网站 URL** | https://sushuqiong.github.io/bio-lookup-extension/ | ✅ 已上线 |
| **支持 URL** | https://github.com/sushuqiong/bio-lookup-extension/issues | ✅ |
| 更新日志 URL | https://github.com/sushuqiong/bio-lookup-extension/releases | ✅ |

---

## 二、基本信息（逐字段复制）

### 显示名称（45 字符内）
```
生信快查 · Bio Lookup
```

### 英文名称（如提交英文 listing）
```
Bio Lookup - Gene & Variant Quick Search
```

### 简短描述（132 字符内）
```
选中基因名 / GEO 编号 / rsID / 变异位点 / PMID，右键一键跳转 NCBI、Ensembl、gnomAD、ClinVar 等 15+ 生信数据库，自动保存查询历史。
```

英文版：
```
Select a gene, GEO ID, rsID, variant or PMID and jump to 15+ bio databases (NCBI, Ensembl, gnomAD, ClinVar) with one right-click. Saves query history.
```

### 分类
```
生产力 / Productivity
```
（次选：开发者工具 / Developer tools）

### 语言
```
中文（简体）· English
```

### 搜索关键词（Edge 最多 7 个）
```
生物信息学
生信
基因查询
变异注释
gnomAD
ClinVar
PubMed
```

英文关键词：
```
bioinformatics, gene lookup, variant annotation, gnomAD, ClinVar, PubMed, research
```

---

## 三、详细描述（复制全文）

```
【一句话】选中基因名 / GEO 编号 / rsID / 变异位点 / PMID，右键一键跳转 15+ 生信数据库，自动保存查询历史。

■ 为什么做这个
做生信和医学研究时，一个基因名要在 NCBI Gene、Ensembl、GeneCards、UniProt、PubMed 之间反复开 5 个标签页；一个 rsID 要在 dbSNP、gnomAD、ClinVar、VarSome 之间来回跳。现有插件要么只支持基因，要么菜单塞满所有库。
Bio Lookup 换了个思路：先识别你选中是什么，再只给你看相关的库。

■ 核心功能
• 9 类对象智能识别：基因 / GEO / rsID / 变异（HGVS · 坐标 · VCF）/ 基因组区间 / PMID / DOI / 核酸序列
• 动态右键菜单：菜单只列出与该类型相关的数据库，不堆砌无关选项
• 一键全开：变异解读需同时看人群频率 + 致病性 + 原始记录——一次点击并行打开最多 5 个相关库的后台标签
• VCF 批量注释：直接选中一段 VCF，按 CHROM/POS/REF/ALT 解析并归一化为 gnomAD 标准格式，一条命令查完整个变异清单；支持导出规范化查询词 CSV
• 批量查询：粘贴论文里的基因列表 / 变异清单，按各自类型自动路由到首选库
• 页面浮层（可选）：双击网页上的基因名或 rsID，鼠标旁弹出查询卡片
• Zotero 联动（可选）：选中 PMID / DOI 在本地 Zotero 库中查找并跳转选中
• 自定义数据库：用 {q} 模板接入实验室镜像 / 内部系统，可限定适用类型，配置可导入导出
• 查询历史：自动记录查询词 / 类型 / 目标库 / 时间，可搜索、按类型筛选、点击重查、导出 CSV
• 快捷键 Alt+Shift+B 快速打开面板

■ 支持的数据库（15+）
• 基因：NCBI Gene、Ensembl、GeneCards、UniProt、NCBI Protein、PubMed
• SNP / 变异：dbSNP、ClinVar、gnomAD、VarSome、Franklin、UCSC Genome Browser
• 数据集：GEO、SRA Run Selector、ArrayExpress
• 文献：PubMed、Europe PMC、Google Scholar、Zotero（本机库）
• 序列：NCBI BLAST

■ 识别示例
BRCA1 / TP53 / miR-21 → 基因
GSE123456 / GPL570 → GEO 数据集
rs80357906 → SNP (rsID)
chr17:7676154 C>T / 17-7676154-C-T → 变异（坐标）
NM_007294.4:c.68_69del / p.Val600Glu → 变异（HGVS）
17  7676154  rs80357906  C  T → VCF 记录（自动归一化）
PMID: 12345678 → 文献
10.1038/s41586-020-2008-3 → DOI

■ 隐私承诺
• 不收集任何数据：无账号、无统计 SDK、无遥测代码
• 默认不读取网页内容：核心功能只需右键菜单 + 本地存储权限
• 页面浮层与 Zotero 联动均为可选功能，由你主动开启时才申请权限，关闭即撤销
• 所有查询历史与配置仅保存在你的浏览器本地，卸载即清除
• 完全开源，声明可通过阅读代码自行验证

■ 适合谁
生信分析人员、医学研究者、临床医生、遗传咨询相关工作者、生物医学研究生——任何每天要在多个数据库之间反复跳转的人。

■ 开源
MIT License · https://github.com/sushuqiong/bio-lookup-extension
```

---

## 四、权限用途说明（提交表单会逐项询问，照抄）

| 权限 | 提交时填写的用途说明 |
|---|---|
| `contextMenus` | 在用户选中文本后显示右键查询菜单（扩展的核心交互方式）。不读取页面内容。 |
| `storage` | 在本地浏览器中保存用户的查询历史与自定义数据库配置。数据不上传任何服务器。 |
| `scripting` | 仅在用户主动开启「页面浮层」功能时，动态注册/注销用于显示查询卡片的脚本。默认不启用。 |
| `downloads` | 将 VCF 批量注释结果导出为 CSV 文件保存到本地（用户主动点击导出时触发）。 |
| `http/https` 网页访问（**可选权限**） | 仅当用户主动开启「页面浮层」时申请，用于在网页上显示查询卡片。默认不申请，关闭开关即撤销。 |
| `127.0.0.1:23119`（**可选权限**） | 仅当用户主动开启「Zotero 联动」时申请，用于访问用户**本机**运行的 Zotero API。默认不申请。 |

---

## 五、数据收集声明（Data Collection，提交表单会问）

| 问题 | 选择 |
|---|---|
| Does your extension collect or transmit personal data? | **No**（不收集、不传输） |
| 是否收集个人身份信息 / 健康信息 / 财务信息 / 认证信息 / 个人通信 / 位置 / 网页浏览记录 / 用户活动？ | **全部选 No** |
| 是否向第三方出售或传输数据？ | **No** |
| 是否使用或传输数据用于确定信用度或贷款目的？ | **No** |
| 隐私政策 URL | `https://sushuqiong.github.io/bio-lookup-extension/privacy.html` |

> 说明：扩展只在用户主动点击菜单项时由浏览器直接打开目标数据库网页，扩展自身无后端、不经过任何中间服务器。

---

## 六、提交步骤（Microsoft Partner Center）

1. 打开 https://partner.microsoft.com/dashboard/microsoftedge/overview
2. 用你的 **Microsoft 账号**登录（免费注册，无需付费；个人账号即可）
3. 「Create new extension」→ 上传 `bio-lookup-extension-v0.3.1.zip`
4. 填写上面**第二节**的「基本信息」（名称/简短描述/分类/语言/关键词）
5. 粘贴**第三节**的「详细描述」
6. 上传截图（`shot1` ~ `shot4`，至少 1 张，建议 4 张全上）与小/大促销图
7. 填写**第四节**的权限用途说明（表单会按权限逐项询问）
8. 填写**第五节**的数据收集声明 + 隐私政策 URL
9. 填「支持的网站」「官方网站」URL
10. 保存 → 提交审核（Status: In review）
11. 审核周期通常 **1–7 个工作日**（Edge 相对 Chrome 更快）
12. 通过后你会获得一个 `microsoftedge.microsoft.com/addons/detail/...` 链接 —— 任何人点一下即可安装，**自动更新**，不再需要开发人员模式

> ⚠️ 常见被拒原因（我们已规避）：缺隐私政策 URL（✅ 已有）、权限说明不清（✅ 已逐项写明）、描述与功能不符（✅ 一致）、截图含未实现功能（✅ 全部为真实界面复刻）。

---

## 七、后续（Chrome Web Store，可选）

Chrome 上架流程几乎相同，但需**一次性 $5 开发者注册费**：
1. https://chrome.google.com/webstore/devconsole → 支付 $5
2. 上传同一个 zip + 复用上面全部文案与截图
3. 隐私政策 URL 同 `privacy.html`
4. **额外需要**：在 manifest 或商店后台填写「数据用途（Data usage）」表单（我们已按"不收集"准备，直接选 No 即可）

---

## 八、版本更新流程（上架后）

改代码 → 更新 `manifest.json` 的 `version` → 重新打包 zip → 在 Partner Center 上传新包 → 提交审核。用户端自动更新。
