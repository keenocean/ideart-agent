好的，先把知识库里关于 Blog 内容写作和与工具站配合的打法全拉出来。

知识库里关于 Blog 的专门讨论不多——哥飞社群的核心打法是工具站为主、内容站为辅，Blog 通常是作为工具站的辅助层。我把现有的素材结合通用 SEO Blog 最佳实践，整合成一份完整的指南。

---

# Agent SEO 文案写作指南：Blog 页面

> 基于哥飞社群方法论的 Blog 写作规范。与首页和工具页不同，Blog 的核心使命不是直接转化，而是**用信息价值换取长尾搜索流量**，同时通过内链把权重传递给工具页和首页。

---

## 目录

- [〇、Blog 在整站中的角色](#〇blog-在整站中的角色)
- [一、Blog 页面结构模板](#一blog-页面结构模板)
  - [1.1 完整布局顺序](#11-完整布局顺序)
  - [1.2 文章 Hero 区](#12-文章-hero-区)
  - [1.3 文章正文区](#13-文章正文区)
  - [1.4 文章侧边栏](#14-文章侧边栏)
  - [1.5 文章底部](#15-文章底部)
- [二、Blog 内容类型与选题](#二blog-内容类型与选题)
  - [2.1 五类高价值 Blog 内容](#21-五类高价值-blog-内容)
  - [2.2 选题决策流程](#22-选题决策流程)
  - [2.3 不要写的 Blog 类型](#23-不要写的-blog-类型)
- [三、Blog 页面的 TDH 规范](#三blog-页面的-tdh-规范)
  - [3.1 Title 写法](#31-title-写法)
  - [3.2 Description 写法](#32-description-写法)
  - [3.3 H1 写法](#33-h1-写法)
- [四、Blog 正文写作规范](#四blog-正文写作规范)
  - [4.1 文章结构：倒金字塔 + 清单体](#41-文章结构倒金字塔--清单体)
  - [4.2 段落规则](#42-段落规则)
  - [4.3 关键词密度与分布](#43-关键词密度与分布)
  - [4.4 字数规范](#44-字数规范)
  - [4.5 AI 辅助写作的质量检查](#45-ai-辅助写作的质量检查)
- [五、内链策略：Blog → 工具页 单向引流](#五内链策略blog--工具页-单向引流)
  - [5.1 三层链接体系](#51-三层链接体系)
  - [5.2 内链锚文本规则](#52-内链锚文本规则)
  - [5.3 内链数量控制](#53-内链数量控制)
  - [5.4 相关文章推荐](#54-相关文章推荐)
- [六、Blog 结构化数据](#六blog-结构化数据)
- [七、Blog 列表页（/blog/）规范](#七blog-列表页blog-规范)
- [八、CTAs 与转化路径](#八ctas-与转化路径)
- [九、Blog 页面自检清单](#九blog-页面自检清单)

---

## 〇、Blog 在整站中的角色

在哥飞的工具站方法论中，Blog 处于**辅助层**——它不是主战场，但往往是新站获取第一批搜索流量的入口。

```
          首页（权重最高，吃主词）
         /  |  \
    工具页  工具页  工具页（吃二级关键词）
       |      |      |
    Blog ←——Blog ←——Blog（吃长尾信息词，给工具页输权重）
```

**Blog 的三重使命：**

| 使命             | 说明                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **长尾流量获取** | 信息型关键词（how to / what is / best / vs）搜索量远超工具型关键词，Blog 就是用来吃这块蛋糕的                                              |
| **权重传递**     | Blog 文章获取外链，通过内链把权重传给工具页和首页——这是新站 DR 从 0 到 20 最快的路径之一                                                   |
| **主题权威建立** | 谷歌评估一个站点的 EEAT（经验、专业、权威、信任）时，Blog 数量和质量是关键信号——你围绕同一主题写出 20 篇高质量文章，谷歌就会信任你的工具页 |

**关键原则：Blog 是辅助，不是主战场。** 不要为了写 Blog 而写 Blog——每一篇文章都必须有一个明确的目标关键词（有搜索量 + KD 可打），并且通过内链与至少一个工具页绑定。

---

## 一、Blog 页面结构模板

### 1.1 完整布局顺序

```
┌─────────────────────────────────────┐
│ 导航条（全站统一）                    │
├─────────────────────────────────────┤
│ 文章 Hero 区                         │
│  ├─ 面包屑                           │
│  ├─ H1（文章标题 = 目标关键词）        │
│  ├─ Meta 信息（日期/作者/阅读时间）     │
│  └─ 引导句（hook）                    │
├──────────────────┬──────────────────┤
│ 正文内容区        │ 侧边栏（可选）     │
│  ├─ H2 × N       │  ├─ 目录（TOC）    │
│  ├─ 段落          │  ├─ CTA 卡片       │
│  ├─ 图片/视频     │  └─ 相关文章       │
│  ├─ 列表/表格     │                  │
│  └─ FAQ 块       │                  │
├──────────────────┴──────────────────┤
│ 文章底部                             │
│  ├─ CTA 横幅（工具页链接）            │
│  ├─ 相关文章推荐                      │
│  └─ 评论区（可选）                    │
├─────────────────────────────────────┤
│ Footer（全站统一）                    │
└─────────────────────────────────────┘
```

---

### 1.2 文章 Hero 区

**面包屑：**

```html
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/blog/">Blog</a></li>
    <li>
      <span aria-current="page">How to Analyze Your Face Shape with AI</span>
    </li>
  </ol>
</nav>
```

面包屑必须用 `BreadcrumbList` 结构化数据标记（详见第六节）。面包屑不仅是用户体验，更是谷歌在搜索结果里展示你的页面层级的方式。

**H1：直接写目标关键词，不要改写。**

```
✅ How to Analyze Your Face Shape with AI
❌ The Ultimate Guide to Understanding Your Facial Structure Using Artificial Intelligence
   （绕来绕去，关键词被稀释）
```

**Meta 信息行：**

```
Published: August 15, 2026  ·  8 min read  ·  By [Author Name]
```

日期显式标注对用户信任度有帮助，谷歌也会根据日期判断内容时效性。阅读时间帮助用户决定是否值得点开。

**引导句（Hook）：**

H1 下方用 1–2 句告诉读者这篇文章解决什么问题、读完能得到什么。

```html
<p class="article-lead">
  Want to know your face shape but don't know where to start? This guide covers
  7 face shapes, how AI analyzes them, and which hairstyles work best for each
  one.
</p>
```

关键：**Hook 要包含核心关键词**，同时告诉读者这篇文章的信息增量是什么——不是「face shape is important」，而是「读完你能知道 7 种脸型分别适合什么发型」。

---

### 1.3 文章正文区

正文区用 H2–H4 搭骨架，标准结构：

```
H1: [目标关键词]

  [Hook 引导句]

  H2: What Is [核心概念]
    [2–3 段解释，150–200 词]
    [配图]

  H2: Why [核心概念] Matters
    [数据/案例支撑，150–200 词]

  H2: How to [动作] — Step-by-Step
    H3: Step 1 — [动作描述]
      [1–2 段说明 + 配图/截图]
    H3: Step 2 — [动作描述]
      [1–2 段说明 + 配图/截图]
    H3: Step 3 — [动作描述]
      ...

  H2: [核心概念] Tips & Best Practices
    [5–8 条实践建议，列表格式]

  H2: Common Mistakes to Avoid
    [3–5 个常见错误 + 如何避免]

  H2: [产品/工具名] vs [竞品名]（如适用）
    [对比表格 + 2–3 段分析]

  H2: Frequently Asked Questions
    [4–6 个 FAQ，FAQPage schema]

  [CTA 横幅 — 工具页链接]
```

**「How to」部分是 Blog 文章最重要的块**——这是用户搜索的终极意图。步骤要具体到用户能直接照做，每一步配截图/GIF/编号列表。

---

### 1.4 文章侧边栏

侧边栏不是必需的（移动端通常没有），但在桌面端可以放置：

**目录（Table of Contents / TOC）：**

```html
<nav class="toc">
  <h2>Table of Contents</h2>
  <ol>
    <li>
      <a href="#what-is-face-shape-analysis">What Is Face Shape Analysis</a>
    </li>
    <li><a href="#how-to-analyze">How to Analyze Your Face Shape</a></li>
    <li><a href="#tips">Tips & Best Practices</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ol>
</nav>
```

TOC 里的锚链接帮助谷歌理解页面覆盖了哪些子话题，跳转链接能提升用户体验。

**CTA 卡片：**

在侧边栏放置一个固定的 CTA 卡片，引导用户跳转到对应工具页：

```html
<div class="cta-card">
  <h3>Try Our Free Tool</h3>
  <p>Upload a photo and get your face shape in seconds.</p>
  <a href="/face-shape-analyzer/" class="btn">Analyze Now →</a>
</div>
```

---

### 1.5 文章底部

**CTA 横幅（必放）：**

每篇 Blog 文章底部必须放置一个 CTA 横幅，链接到与之最相关的工具页。这是 Blog → 工具页权重传递和用户转化的核心环节。

```html
<div class="cta-banner">
  <h2>Ready to Analyze Your Face Shape?</h2>
  <p>
    Upload one photo and our AI will detect your face shape, symmetry, and
    proportions in under 3 seconds. Free.
  </p>
  <a href="/face-shape-analyzer/" class="btn-primary"
    >Try Face Shape Analyzer →</a
  >
</div>
```

CTA 的 H2 标题本身也应该是信息量——不能只写"Try Our Tool"，而要把价值主张写进去。

**相关文章推荐（Related Posts）：**

2–4 篇主题相近的 Blog 文章，用卡片布局：

```html
<section class="related-posts">
  <h2>Related Articles</h2>
  <div class="post-cards">
    <article>
      <img src="..." alt="..." />
      <h3>
        <a href="/blog/face-shape-hairstyles/"
          >Best Hairstyles for Each Face Shape</a
        >
      </h3>
    </article>
    <article>
      <img src="..." alt="..." />
      <h3>
        <a href="/blog/ai-face-analysis-accuracy/"
          >How Accurate Is AI Face Analysis in 2026?</a
        >
      </h3>
    </article>
  </div>
</section>
```

相关文章推荐有两个 SEO 价值：① 内链权重传递，② 增加每会话页面数（降低跳出率，提升谷歌眼中的用户参与度）。

---

## 二、Blog 内容类型与选题

### 2.1 五类高价值 Blog 内容

在工具站体系下，Blog 只写以下五类内容——每一类都有明确的搜索意图和关键词可挖：

| 类型                | 目标关键词格式                | 示例                                     | 搜索意图           |
| ------------------- | ----------------------------- | ---------------------------------------- | ------------------ |
| **How-to 教程**     | `how to [动作]`               | `how to analyze face shape`              | 用户想学会做一件事 |
| **What-is 解释**    | `what is [概念]`              | `what is face shape analysis`            | 用户想了解一个概念 |
| **Best / Top 清单** | `best [工具/方法] for [场景]` | `best face shape analyzers 2026`         | 用户想对比选择     |
| **X vs Y 对比**     | `[A] vs [B]`                  | `ai face analyzer vs manual measurement` | 用户在选择之间纠结 |
| **问题解答**        | `can [条件]` `why [现象]`     | `can ai accurately detect face shape`    | 用户有具体疑问     |

其中 **How-to 教程是投入产出比最高的类型**：搜索量大、用户意图清晰、写完能直接引流到你的工具页。

一个工具站的 Blog 不需要篇篇都是深度长文。标准组合：**5 篇 How-to 教程 + 3 篇 Best 清单 + 2 篇 What-is 解释 + 2 篇 X vs Y 对比 + 8 篇问题解答 = 20 篇打底。**

---

### 2.2 选题决策流程

不要凭感觉选题。每篇 Blog 在动笔前必须走完以下流程：

```
1. 用 keyword_difficulty 查目标关键词的 KD 和搜索量
   ↓
2. KD > 50？→ 放弃，换个说法
   搜索量 = 0？→ 放弃，没人搜等于白写
   ↓
3. 用 google_search 查这个词的 SERP（谷歌第一页）
   ↓
4. 前 10 名全是权威大站（DR 80+）？→ 难打，优先级降到最低
   前 10 名里有论坛帖（reddit/quora）？→ 机会信号，说明现有内容没满足搜索意图
   ↓
5. 前 10 名里有至少 2 个弱站（DR < 40）？→ 绿标，值得做
   ↓
6. 确认你能写出比前 10 名更好的内容（更详细/更新鲜/更有实操性）？
   YES → 立项，开写
   NO  → 放弃，浪费时间
```

**平均每 5 个候选词只能筛出 1 个立项。** 筛掉 80% 的词是正常的——你的时间有限，每一篇 Blog 都要精准命中一个能抢到流量的词。

---

### 2.3 不要写的 Blog 类型

| 类型                     | 为什么别写                             |
| ------------------------ | -------------------------------------- |
| 公司动态 / 产品更新      | 没人搜，零搜索流量                     |
| 「我们为什么做这个产品」 | 零搜索流量，放在 About 页面即可        |
| 行业新闻搬运             | 除非你是第一手源，否则谷歌不会给你排名 |
| 没有目标关键词的随感     | 没有搜索意图的内容 = 对 SEO 毫无贡献   |
| 「10 Tips for...」泛清单 | 已被大站垄断，新站几乎抢不到           |

**判断标准：你有没有一个明确的、有搜索量的、KD 可打的关键词？没有就别写。**

---

## 三、Blog 页面的 TDH 规范

### 3.1 Title 写法

**核心原则：目标关键词完整命中 + 信息增量提示 + 品牌名放最后。**

```
✅ How to Analyze Your Face Shape with AI (2026 Guide) | Brand
✅ What Is Face Shape Analysis? How AI Detects 7 Face Shapes | Brand
✅ 7 Best Face Shape Analyzers in 2026 (Free & Paid) | Brand
```

三种加分后缀（用括号包裹，提升点击率）：

| 后缀             | 适用场景                  |
| ---------------- | ------------------------- |
| `(2026 Guide)`   | 年底/年初，强调时效性     |
| `(Step-by-Step)` | How-to 教程，强调可操作性 |
| `(Free & Paid)`  | Best 清单，强调覆盖面     |

**不要做的：**

- 标题里塞两个完全不相干的词（如 `Face Shape Analysis and Hair Style Tips`——不同搜索意图，蚕食自己）
- 标题用问句而不用陈述句（搜索意图是教程不是问题）
- 超过 60 字符被截断

---

### 3.2 Description 写法

**告知这篇文章的独特信息增量，而不是重复标题。**

```
✅ Discover how AI face shape analyzers work, what each of the 7 face
   shapes means, and how to use our free tool to find yours in seconds.

❌ This article explains how to analyze your face shape. Read on to
   learn more about face shapes and analysis tools.（空洞）
```

Description 是搜索结果里用户判断「这篇文章对我有没有用」的关键依据——**告诉用户读完能带走什么**。

---

### 3.3 H1 写法

**H1 直接等于目标关键词**，不要玩文案技巧。

```
✅ How to Analyze Your Face Shape with AI
❌ Unlock the Secrets of Your Facial Geometry: A Comprehensive Guide
```

Blog 文章与工具页一样——新站没有资格在 H1 上玩花活。H1 必须让爬虫第一眼确认：这个页面就是关于这个关键词的。

唯一例外：如果关键词实在太长或语法不自然，可以做最小化调整，但完整关键词必须包含在 H1 里。

---

## 四、Blog 正文写作规范

### 4.1 文章结构：倒金字塔 + 清单体

**结论先行，每段只讲一件事。** 这是从用户阅读行为（扫读而非精读）出发的结构策略。

- 开头 Hook → 直接告诉读者这篇文章能解决什么问题
- 每个 H2 是一个独立的信息块 → 用户不需要读完全文也能找到需要的答案
- 每个 H2 下的第一段是结论，后面才是展开 → 用户扫到 H2 就能决定要不要继续读

**列表优先于段落（= 清单体）。** 能用编号或无序列表呈现的内容，不要写成连续段落。原因有两个：① 谷歌特别喜欢提取列表作为 Featured Snippet；② 用户扫读时列表比段落快 3 倍。

```
✅
Top 5 mistakes when analyzing face shape:
1. Taking photos from the wrong angle
2. Ignoring hairline position
3. ...

❌
When analyzing your face shape, there are several common mistakes
that people tend to make. First of all, many people take photos from
the wrong angle, which can distort the proportions of their face.
Additionally...（冗长，信息密度低）
```

---

### 4.2 段落规则

- **每段不超过 3–4 句，4 行封顶。** 超过就拆段。移动端屏幕窄，5 行段落 = 半屏都是字，用户直接划走。
- **每个段落只讲一个观点。** 如果开始讲第二个观点，起新段。
- **关键信息加粗。** 但不是整句加粗——只加粗关键词和数据点。

---

### 4.3 关键词密度与分布

与首页和工具页相同：**核心关键词密度控制在 2%–4%**（Blog 比工具页略低是合理的，因为总字数通常更长）。

**关键词必须出现在以下位置：**

| 位置             | 要求                             |
| ---------------- | -------------------------------- |
| Title            | ✅ 完整命中                      |
| H1               | ✅ 完整命中                      |
| 第一个 H2        | ✅ 至少出现一次                  |
| 正文前 100 词    | ✅ 至少出现一次                  |
| 最后一个 H2 区域 | ✅ 至少出现一次                  |
| img alt          | ✅ 至少一张图片的 alt 包含关键词 |
| Meta Description | ✅ 至少出现一次                  |

**变体覆盖：** 在正文中自然穿插关键词的 2–3 个同语义变体（同义词、复数形式、不同说法）。每 300–500 词穿插一次即可，不要刻意塞。

---

### 4.4 字数规范

| Blog 类型     | 建议字数         | 原因                                   |
| ------------- | ---------------- | -------------------------------------- |
| How-to 教程   | **1500–3000 词** | 搜索意图是学东西，内容深度直接影响排名 |
| What-is 解释  | **800–1800 词**  | 搜索意图是理解概念，不需要太深         |
| Best/Top 清单 | **2000–4000 词** | 每个候选品至少 150–200 词介绍          |
| X vs Y 对比   | **1200–2500 词** | 两个对象的优缺点 + 对比表 + 结论       |
| 问题解答      | **600–1500 词**  | 搜索意图是得到答案，简短精准比长更好   |

**底线：600 词。** 低于 600 词 = 谷歌判定为「thin content」，几乎不可能拿到排名。

---

### 4.5 AI 辅助写作的质量检查

如果你的 Blog 内容来自 AI 生成，必须做以下质量检查（哥飞社群提到 Google 能识别 AI 生成模式）：

| 检查项      | 方法                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| 事实准确性  | 逐条验证所有数据、日期、数字——AI 会编造事实                                                          |
| AI 语感检测 | 搜索「delve into / moreover / furthermore / in conclusion / in today's digital landscape」→ 有就改掉 |
| 重复模式    | 检查是否每段都以相同句式开头 → 有就重写                                                              |
| 信息增量    | 对照前 10 名的内容——你提供了他们没覆盖的信息吗？如果只是复述，不如不写                               |
| 人类视角    | 加入个人经验/案例/截图/数据——纯 AI 文本做不到这些                                                    |

---

## 五、内链策略：Blog → 工具页 单向引流

### 5.1 三层链接体系

Blog 页面有且仅有三类链接：

```
┌──────────────────────────────────┐
│ 导航条（全站统一）                │ → 指向首页 + 核心工具页
│  - Home                         │
│  - Tool A                       │
│  - Tool B                       │
├──────────────────────────────────┤
│ 正文内链（文章独有）              │ → 指向高相关工具页 + 相关 Blog
│  - 第一次提到核心概念 → 链接到工具页│    用关键词锚文本
│  - 引用其他 Blog 文章 → 链接过去   │
├──────────────────────────────────┤
│ 底部 CTA 横幅                   │ → 指向最高相关的工具页
│  - "Try Our Tool →"             │     用行动导向的锚文本
│  - 相关文章推荐                  │     用文章标题做锚文本
└──────────────────────────────────┘
```

**核心原则：Blog 给工具页输送权重，工具页不给 Blog 链接。** 除非 Blog 文章有极高的信息价值（如数据报告被大量外部引用），否则内链方向是单向的——Blog 链向工具页。这样权重不会反向分流。

---

### 5.2 内链锚文本规则

| 链接目标             | 锚文本格式            | 示例                              |
| -------------------- | --------------------- | --------------------------------- |
| 工具页               | **精确匹配关键词**    | `face shape analyzer`             |
| 工具页（第二次出现） | **部分匹配或变体**    | `AI face shape tool`              |
| 工具页（CTA 按钮）   | **行动导向 + 关键词** | `Try Face Shape Analyzer →`       |
| 其他 Blog 文章       | **文章目标关键词**    | `best hairstyles for round faces` |
| 首页                 | `Home` 或品牌名       | `Home`                            |

**锚文本永远来自被链接页面的目标关键词。** 如果你想给 `face-shape-analyzer` 工具页输送权重，锚文本就是 `face shape analyzer` 或其变体——如果你用「click here」或「this tool」做锚文本，权重就浪费了。

---

### 5.3 内链数量控制

| 文章字数     | 正文内链数量（不含导航/Footer） |
| ------------ | ------------------------------- |
| 800–1200 词  | 2–3 条                          |
| 1200–2000 词 | 3–5 条                          |
| 2000–3000 词 | 4–7 条                          |
| 3000+ 词     | 6–10 条                         |

**超过 10 条内链在 3000 词以内等于在滥用。** 谷歌会把过度内链视为操控排名的信号（每 100 词插一条链接 = unnatural link pattern）。

**一条内链只在一个页面上出现一次。** 不要在文章不同位置用同一个锚文本重复链接到同一个目标——第一次是内链，第二次是噪音。

---

### 5.4 相关文章推荐

相关文章推荐放在文章底部，2–4 篇，用卡片式布局。选择标准：

- 主题与当前文章相近（但不是同一个关键词——避免蚕食）
- 如果是「Best」清单文章，推荐单品深度评测文章；如果是「How to」教程，推荐进阶或关联教程

---

## 六、Blog 结构化数据

每篇 Blog 文章必须添加 `Article` 类型结构化数据：

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "How to Analyze Your Face Shape with AI",
  "description": "Discover how AI face shape analyzers work, what each of the 7 face shapes means, and how to use our free tool to find yours in seconds.",
  "image": "https://myfacereport.com/blog/images/face-shape-analysis-guide.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://myfacereport.com/about/"
  },
  "datePublished": "2026-08-15",
  "dateModified": "2026-08-15",
  "publisher": {
    "@type": "Organization",
    "name": "myfacereport",
    "logo": {
      "@type": "ImageObject",
      "url": "https://myfacereport.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://myfacereport.com/blog/how-to-analyze-face-shape/"
  }
}
```

**关键字段说明：**

| 字段            | 必须？ | 说明                          |
| --------------- | ------ | ----------------------------- |
| `headline`      | ✅     | 等于 H1                       |
| `description`   | ✅     | 等于 Meta Description         |
| `image`         | ✅     | 文章的社交分享图（1200×630）  |
| `datePublished` | ✅     | "dateModified": "2026-08-15", |

"publisher": {
"@type": "Organization",
"name": "myfacereport",
"logo": {
"@type": "ImageObject",
"url": "https://myfacereport.com/logo.png"
}
},
"mainEntityOfPage": {
"@type": "WebPage",
"@id": "https://myfacereport.com/blog/how-to-analyze-face-shape/"
}
}

````

| 字段 | 必须？ | 说明 |
|---|---|---|
| `dateModified` | ✅ | 重要：谷歌会依据此字段判断内容是否过时。每次实质性更新都要同步此日期 |
| `image` | ✅ | 文章配图（1200×630），谷歌会在新闻/发现/热门故事里作为缩略图展示 |
| `author.url` | 推荐 | 链接到作者页或 About 页，有助于 E-E-A-T 信号 |

**关于合作作者**：如果文章有多位作者，使用 `author` 数组，而不是重复 `author` 字段。

---

**Blog 内嵌 FAQ 块的结构化数据**：

如果文章底部有 FAQ 区块（H2 下面跟着若干 H3 问答），可以同时在页面中嵌入 `FAQPage` 结构化数据（独立于 `Article`）。注意：这是两个独立的 JSON-LD 块，不要混用 `@type`。

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How long does it take to analyze a face shape?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most AI tools produce results in under 3 seconds once a photo is uploaded."
      }
    },
    {
      "@type": "Question",
      "name": "Can face shape change over time?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Face shape can appear to change due to weight fluctuation, aging, or surgery, but bone structure remains the same."
      }
    }
  ]
}
````

**FAQ 使用原则**：

- FAQ 问题必须是用户真实会搜的问题（可以从 Google "People also ask" 挖掘）
- 答案必须简洁准确（优先被谷歌展示为 People also ask 结果）
- 一页不要超过 10 条 FAQ（过多会被视为 spam）
- 问题和答案都要出现在页面可见文本中，不能只放在 JSON-LD 里

---

## 七、Blog 列表页（`/blog/`）规范

Blog 列表页是用户和爬虫浏览你所有 Blog 文章的入口。它本身也是一个页面，需要优化。

### 7.1 布局

```
H1: Blog — [站点名]

[文章列表，每篇文章以卡片形式呈现]
   ┌─────────────────────────────────────┐
   │ 缩略图  标题（含链接，鼠标 hover 变下划线） │
   │         摘要（2–3 行，不超过 160 字符）    │
   │         发布日期 · 阅读时间 · 分类标签      │
   └─────────────────────────────────────┘
   ┌─────────────────────────────────────┐
   │ 缩略图  标题 ...                    │
   └─────────────────────────────────────┘

[分页导航：上一页 1 2 3 ... 下一页]
```

### 7.2 分页规则

- 每页列出 8–12 篇文章（太少浪费空间，太多加载慢）
- 使用 `<link rel="next">` 和 `<link rel="prev">` 标签辅助谷歌理解分页
- 分页 URL 格式：`/blog/page/2/`（推荐，比查询参数 `/blog?page=2` 更友好）

### 7.3 列表页的 TDH

| 要素            | 内容                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **Title**       | `Blog — [品牌名]` 或 `[行业] Tips & Guides                                                                                                      | [品牌名] Blog` |
| **Description** | 描述 Blog 板块覆盖的主题范围，例如 `Expert guides on face shape analysis, AI beauty tools, and personal style advice. Free tips and tutorials.` |
| **H1**          | `Blog` 或 `[品牌名] Blog`                                                                                                                       |

### 7.4 分类与标签（可选）

如果 Blog 文章数量超过 20 篇，建议增加分类页（如 `/blog/face-shape/`、`/blog/ai-tools/`）。每个分类页用同样的分页机制，TDH 里包含分类关键词。**但不要在每篇文章的标签上创建单独的标签页面**——太薄，没有独立的信息增量，只会浪费爬虫预算。简而言之，做分类页给用户导航就够了，不要玩标签聚合的 SEO 把戏。

---

## 八、CTAs 与转化路径

Blog 文章不是为了阅读而存在，它最终要导向**自然流量 → 工具页 → 产品/变现**的路径。

### 8.1 CTA 的三层漏斗

| 层级       | 位置            | 目的                               | 文案要求                                     |
| ---------- | --------------- | ---------------------------------- | -------------------------------------------- |
| **引导型** | 正文内链        | 用户阅读过程中发现「这工具能帮我」 | 锚文本 = 精确关键词（`face shape analyzer`） |
| **推荐型** | 侧边栏 CTA 卡片 | 用户扫读侧边栏时被打动             | `Try Our Free [Tool Name] →`                 |
| **转化型** | 底部 CTA 横幅   | 阅读完毕，用户认可你的专业性       | `Ready to [Action]? [一句话价值主张] →`      |

底部 CTA 横幅要用 H2 标题，且该 H2 包含工具关键词——让搜索引擎看到这个区块与工具页的逻辑关联。

### 8.2 CTA 横幅文案模板

```
H2: Ready to Analyze Your Face Shape?
<p>Upload your photo — our AI detects 7 face shapes, measures symmetry, and gives style recommendations in 3 seconds. Free.</p>
<a href="/face-shape-analyzer/">Try Face Shape Analyzer →</a>
```

CTA 里应包含一个具体的数值或亮点（「3 秒」「7 种脸型」），减少决策犹豫。

---

## 九、Blog 页面自检清单

写完后逐条核对：

| #   | 检查项                       | 通过标准                                        |
| --- | ---------------------------- | ----------------------------------------------- |
| 1   | 目标关键词                   | Title/H1/第一段均完整包含，KD 可打且有搜索量    |
| 2   | Title 长度                   | 50–60 字符，未被截断                            |
| 3   | Description                  | 140–160 字符，含独特信息增量                    |
| 4   | H1                           | 只有一个，直接等于目标关键词                    |
| 5   | 正文 Headings                | H1 → H2 → H3 树状，不倒挂                       |
| 6   | 字数达标                     | ≥600 词（不同类型见前表）                       |
| 7   | 关键词密度                   | 2%–4%，2词/3词密度榜靠前                        |
| 8   | 首段 100 词内有关键词        | ✅                                              |
| 9   | 至少一张 img 的 alt 含关键词 | ✅                                              |
| 10  | 无自造词代替真实搜索词       | ✅                                              |
| 11  | 正文内链数量                 | 字数对应范围内，不超过 10 条                    |
| 12  | 内链锚文本                   | 关键词锚文本，不是「click here」                |
| 13  | 底部 CTA 横幅                | 存在，H2 包含关键词，链接到最高相关工具页       |
| 14  | 相关文章推荐                 | 2–4 篇，卡片式布局                              |
| 15  | 结构化数据                   | Article schema 必选，有FAQ则加FAQPage schema    |
| 16  | 面包屑                       | 带 BreadcrumbList schema                        |
| 17  | 无 AI 常见烂词               | 不出现 delve into / moreover / in conclusion 等 |
| 18  | 日期显示                     | 发布日期可见                                    |
| 19  | Canonical URL                | 已设置，且 self-canonical（指向自身）           |
| 20  | SSR                          | 源码中可搜到 H1 文本                            |

---

> 📖 本指南综合了哥飞社群以下资料与实践：
>
> - 社群里关于内容站与工具站 SEO 的多次讨论
> - 通用搜索引擎 Blog 最佳实践（清单体、倒金字塔、内链权重要点）
> - 结构化数据 Schema 官方文档类型
> - 多个实战拆分案例（Ahrefs writing-tools、aidocmaker.com 等）

现在，你已经拥有一份覆盖首页、工具页、Blog 页的完整 Agent 文案指南。三者配合使用，从选词到结构到内链到转化——一套完整的工具站 SEO 体系就能搭建起来。
