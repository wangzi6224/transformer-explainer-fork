# Transformer Explainer 中文版

这是我基于 [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer) fork 的中文汉化版本

**预览地址**：[https://wangzi6224.github.io/transformer-explainer-fork/](https://wangzi6224.github.io/transformer-explainer-fork/)

原项目是一个用于学习文本生成模型的交互式可视化工具。它可以在浏览器中运行 GPT-2 模型，并把 Transformer 在预测下一个 token 时涉及的关键步骤以可视化方式展示出来，包括 tokenization、embedding、attention、MLP、logits、概率分布等过程。

本 fork 的主要目标是让中文学习者更顺畅地理解 Transformer 架构和 GPT 类模型的工作方式。我对项目中的界面文案、说明文本以及中文字体渲染做了汉化和适配，尽量降低英文阅读成本，方便中文小伙伴把注意力放在模型结构和推理流程本身。

[![MIT license](http://img.shields.io/badge/license-MIT-brightgreen.svg)](http://opensource.org/licenses/MIT)
[![arxiv badge](https://img.shields.io/badge/arXiv-2408.04619-red)](https://arxiv.org/abs/2408.04619)

<a href="https://youtu.be/TFUc41G2ikY" target="_blank"><img width="100%" src="https://github.com/user-attachments/assets/0a4d8888-6555-4df5-bc71-77f1299115c3"></a>

## 项目特点

- 中文化界面：将主要界面文案、解释文本和交互提示改为中文，便于中文学习者直接使用。
- 中文字体适配：优化中文字体渲染，让可视化界面中的中文内容更清晰、自然。
- 浏览器内运行：使用浏览器端模型能力运行 GPT-2，无需单独部署后端服务。
- 交互式学习：可以输入文本，观察模型如何一步步计算并预测后续 token。
- 面向原理理解：虽然演示模型使用的是 GPT-2，但其中展示的 Transformer 结构、注意力机制和自回归文本生成流程与现代 GPT 类模型的核心原理是相通的。

## 适合谁使用

- 想直观理解 Transformer 架构的学习者
- 正在学习 GPT、LLM、注意力机制或文本生成模型的同学
- 希望用中文材料讲解 Transformer 原理的老师、博主或技术分享者
- 想通过可视化方式观察模型内部计算流程的开发者

## ❗️网络与加载说明（大陆小伙伴注意）

这个项目没有后端服务，完整推理流程都发生在浏览器中。首次打开在线预览时，浏览器大致会经历下面的加载链路：

```text
用户打开 GitHub Pages
  ↓
加载 JS/CSS 静态资源
  ↓
从 Hugging Face / Xenova 加载 tokenizer
  ↓
从 GitHub Pages 的 /model-v2/ 路径下载 63 个 ONNX 模型分片
  ↓
浏览器将模型分片合并为 Blob
  ↓
onnxruntime-web 从 jsDelivr 加载 WebAssembly runtime
  ↓
创建 InferenceSession
  ↓
在浏览器本地运行 GPT-2 推理
```

因此，除了项目本身托管在 GitHub Pages 上，运行过程中还会依赖 Hugging Face / Xenova、jsDelivr，以及部分 Google 字体服务。国内网络环境下（你懂的因素），这些资源可能会出现加载较慢、加载失败或字体回退的情况。中文用户如果遇到页面长时间停留在加载状态、tokenizer 下载失败、模型分片下载失败、wasm runtime 加载失败等问题，可以根据自己的网络环境酌情使用合适的网络访问方式后再重试。

## 本地运行

### 环境要求

- Node.js v20 或更高版本
- NPM v10 或更高版本

### 运行步骤

```bash
git clone https://github.com/wangzi6224/transformer-explainer-fork.git
cd transformer-explainer-fork
npm install
npm run dev
```

启动后，在浏览器中访问：

```text
http://localhost:5173
```

## 常用命令

```bash
# 启动本地开发服务
npm run dev

# 类型检查
npm run check

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 与原项目的关系

本项目是 [poloclub/transformer-explainer](https://github.com/poloclub/transformer-explainer) 的中文汉化 fork。原项目由 Georgia Tech 的 Polo Club 团队创建，核心功能、研究工作和交互式可视化设计均来自原项目。

本 fork 主要做了中文学习场景下的本地化改造，包括文案汉化和字体渲染适配。请优先参考原项目了解完整研究背景、论文信息和官方演示。

原项目在线演示：

http://poloclub.github.io/transformer-explainer

原项目演示视频：

https://youtu.be/TFUc41G2ikY

## 研究论文

[**Transformer Explainer: Interactive Learning of Text-Generative Models**](https://arxiv.org/abs/2408.04619)

Aeree Cho, Grace C. Kim, Alexander Karpekov, Alec Helbling, Zijie J. Wang, Seongmin Lee, Benjamin Hoover, Duen Horng Chau.  
_Poster, IEEE VIS 2024._

## 引用

如果你的研究、课程或分享中使用了这个项目，请引用原项目论文：

```bibtex
@article{cho2024transformer,
  title = {Transformer Explainer: Interactive Learning of Text-Generative Models},
  shorttitle = {Transformer Explainer},
  author = {Cho, Aeree and Kim, Grace and Karpekov, Alexander and Helbling, Alec and Wang, Zijie J. and Lee, Seongmin and Hoover, Benjamin and Chau, Duen Horng},
  journal = {IEEE VIS Poster},
  year = {2024}
}
```

## 致谢

感谢原项目作者 Aeree Cho、Grace C. Kim、Alexander Karpekov、Alec Helbling、Zijie J. Wang、Seongmin Lee、Benjamin Hoover 和 Duen Horng Chau 创建并开源 Transformer Explainer。

原项目地址：

https://github.com/poloclub/transformer-explainer

## 许可证

本项目沿用原项目的 [MIT License](LICENSE)。
