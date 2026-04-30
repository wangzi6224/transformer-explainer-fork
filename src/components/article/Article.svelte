<script>
	import tailwindConfig from '../../../tailwind.config';
	import resolveConfig from 'tailwindcss/resolveConfig';
	import Katex from '~/utils/Katex.svelte';
</script>

<div id="description">
	<div class="article-section" data-click="article-intro">
		<h1>什么是 Transformer？</h1>

		<p>
			Transformer 是一种神经网络架构，从根本上改变了人工智能的发展路径。它最早由经典论文
			<a
				href="https://dl.acm.org/doi/10.5555/3295222.3295349"
				title="ACM Digital Library"
				target="_blank">《Attention is All You Need》</a
			>
			在 2017 年提出。此后它成为深度学习模型的主流架构，驱动了 OpenAI 的 <strong>GPT</strong>、Meta 的 <strong>Llama</strong> 以及 Google 的
			<strong>Gemini</strong> 等文本生成模型。除文本外，Transformer 还广泛应用于
			<a
				href="https://huggingface.co/learn/audio-course/en/chapter3/introduction"
				title="Hugging Face"
				target="_blank">语音生成</a
			>,
			<a
				href="https://huggingface.co/learn/computer-vision-course/unit3/vision-transformers/vision-transformers-for-image-classification"
				title="Hugging Face"
				target="_blank">图像识别</a
			>,
			<a href="https://elifesciences.org/articles/82819" title="eLife"
				>蛋白质结构预测</a
			>, and even
			<a
				href="https://www.deeplearning.ai/the-batch/reinforcement-learning-plus-transformers-equals-efficiency/"
				title="Deep Learning AI"
				target="_blank">博弈智能</a
			>, demonstrating its versatility across numerous domains.
		</p>
		<p>
			从原理上看，文本生成 Transformer 的核心是<strong>next-token prediction</strong>：给定用户输入，
			<em>下一个最可能出现的 token（一个词或子词）是什么</em>？Transformer 的关键创新是 self-attention，
			它让模型能在整段序列上建模，比早期架构更有效地捕捉长距离依赖关系。
		</p>
		<p>
			GPT-2 系列是典型的文本生成 Transformer。Transformer Explainer 使用
			<a href="https://huggingface.co/openai-community/gpt2" title="Hugging Face" target="_blank"
				>GPT-2</a
			>
			（small）模型，参数量约 1.24 亿。它不是最新最强的 Transformer，但与当前 SOTA 模型共享大量架构组件与核心原理，非常适合作为入门学习起点。
		</p>
	</div>

	<div class="article-section" data-click="article-overview">
		<h1>Transformer 架构总览</h1>

		<p>每个文本生成 Transformer 通常都包含以下<strong>三大关键组件</strong>：</p>
		<ol>
			<li>
				<strong class="bold-purple">Embedding</strong>：将输入文本切分为 token（词或子词），并映射为数值向量 embedding，用于承载语义信息。
			</li>
			<li>
				<strong class="bold-purple">Transformer Block</strong>：模型的核心计算单元，负责处理与变换表示。每个 block 包含：
				<ul class="">
					<li>
						<strong>Attention Mechanism</strong>：block 的关键部分，让 token 间进行信息交互，捕捉上下文与词间关系。
					</li>
					<li>
						<strong>MLP（Multilayer Perceptron）</strong>：逐 token 的前馈网络。Attention 负责跨 token 路由信息，MLP 负责细化每个 token 的内部表示。
					</li>
				</ul>
			</li>
			<li>
				<strong class="bold-purple">Output Probabilities</strong>：最后的线性层与 softmax 会将表示转为概率分布，用于预测下一个 token。
			</li>
		</ol>
	</div>

	<div class="article-section" id="embedding" data-click="article-embedding">
		<h2>Embedding（嵌入）</h2>
		<p>
			假设你要让 Transformer 生成文本，输入提示词如 <code>“数据可视化让用户能够”</code>。模型无法直接处理自然语言，必须先转成数值表示，这就是 embedding 的作用。完整流程包括：1）分词，2）查表得到 token embedding，3）加入位置信息，4）将 token 与位置编码相加，得到最终 embedding。下面逐步看每一步如何完成。
		</p>
		<div class="figure">
			<img src="./article_assets/embedding.png" width="65%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">1</span>：展开 Embedding 层后，可以看到输入提示词如何被转为向量表示。流程包括
			<span class="fig-numbering">(1)</span> Tokenization、(2) Token Embedding、(3) Positional Encoding 与 (4) Final Embedding。
		</div>
		<div class="article-subsection">
			<h3>步骤 1：Tokenization（分词）</h3>
			<p>
				Tokenization 会把输入文本拆解成更小、可处理的单位 token。token 可以是完整词，也可以是子词。例如 <code>"Data"</code> 与 <code>"visualization"</code> 可各对应一个 token，而 <code>"empowers"</code> 可能被拆成两个 token。token 词表在训练前确定，GPT-2 词表共有 <code>50,257</code> 个唯一 token。得到 token ID 后，就可以进一步查 embedding 向量。
			</p>
		</div>
		<div class="article-subsection" id="article-token-embedding">
			<h3>步骤 2：Token Embedding</h3>
			<p>
				GPT-2（small）把词表中每个 token 表示成一个 768 维向量（具体维度由模型规模决定）。这些向量组成一个形状为 <code>(50,257, 768)</code> 的矩阵，约 3900 万参数。这个高维空间让模型能表达语义：用法/含义相近的 token 在空间中更接近，不相近的 token 距离更远。
			</p>
		</div>
		<div class="article-subsection" id="article-positional-embedding">
			<h3>步骤 3：Positional Encoding（位置编码）</h3>
			<p>
				Embedding 层还需要编码 token 在输入中的位置。不同模型有不同的位置编码方法。GPT-2 采用可学习的位置编码矩阵，并将其与模型训练过程一体化学习。
			</p>

			<!-- <div class="article-subsection-l2">
	<h4>Alternative Positional Encoding Approach <strong class='attention'>[POTENTIALLY COLLAPSIBLE]</strong></h4>
	<p>
	  Other models, like the original Transformer and BERT,
	  use sinusoidal functions for positional encoding.

	  This sinusoidal encoding is deterministic and designed to reflect
	  the absolute as well as the relative position of each token.
	</p>
	<p>
	  Each position in a sequence is assigned a unique mathematical
	  representation using a combination of sine and cosine functions.

	  For a given position, the sine function represents even dimensions,
	  and the cosine function represents odd dimensions within the positional encoding vector.

	  This periodic nature ensures that each position has a consistent encoding,
	  independent of the surrounding context.
	</p>

	<p>
	  Here’s how it works:
	</p>

	<span class='attention'>
	  SINUSOIDAL POSITIONAL ENCODING EQUATION
	</span>

	<ul>
	  <li>
		<strong>Sine Function</strong>: Used for even indices of the embedding vector.
	  </li>
	  <li>
		<strong>Cosine Function</strong>: Used for odd indices of the embedding vector.
	</ul>

	<p>
	  Hover over individual encoding values in the matrix above to
	  see how it's calculated using the sins and cosine functions.
	</p>
  </div> -->
		</div>
		<div class="article-subsection">
			<h3>步骤 4：Final Embedding</h3>
			<p>
				最后，将 token encoding 与 positional encoding 相加，得到最终 embedding。这个表示同时包含了 token 语义与序列位置信息。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-transformer-block">
		<h2>Transformer Block</h2>

		<p>
			Transformer 的核心计算发生在 Transformer block 中，其中包含 multi-head self-attention 与 MLP。实际模型通常会顺序堆叠多个 block。token 表示在层间不断演化，从浅层到深层逐步形成更高阶语义。我们当前使用的 GPT-2（small）包含 <code>12</code> 个 block。
		</p>
	</div>

	<div class="article-section" id="self-attention" data-click="article-attention">
		<h3>Multi-Head Self-Attention（多头自注意力）</h3>
		<p>
			self-attention 机制让模型可以在序列内部建模 token 之间的关系，使每个 token 的表示都能感知其他 token。多头机制让模型从多个视角同时建模关系：例如某个 head 擅长短程语法依赖，另一个 head 更关注长程语义上下文。下面我们分步骤看它的计算过程。
		</p>
		<div class="article-subsection-l2">
			<h4>步骤 1：Query / Key / Value 矩阵</h4>

			<div class="figure pt-10">
				<img src="./article_assets/QKV.png" width="80%" />
				<div class="text-xs">
					<Katex
						displayMode
						math={`
		QKV_{ij} = ( \\sum_{d=1}^{768} \\text{Embedding}_{i,d} \\cdot \\text{Weights}_{d,j}) + \\text{Bias}_j
		`}
					/>
				</div>
			</div>
			<div class="figure-caption">
				图 <span class="attention">2</span>：由原始 embedding 计算 Query、Key、Value 矩阵。
			</div>

			<p>
				每个 token 的 embedding 会被映射为三个向量：
				<span class="q-color">Query (Q)</span>,
				<span class="k-color">Key (K)</span>, and
				<span class="v-color">Value (V)</span>。它们由输入 embedding 与对应可学习权重矩阵相乘得到：
				<span class="q-color">Q</span>,
				<span class="k-color">K</span>, and
				<span class="v-color">V</span>。可以用“网页搜索”类比理解：
			</p>
			<ul>
				<li>
					<strong class="q-color font-medium">Query (Q)</strong>：类似你输入搜索框的查询词，即你想“进一步了解什么”。
				</li>
				<li>
					<strong class="k-color font-medium">Key (K)</strong>：类似搜索结果页每个网页标题，代表 Query 可以对齐的候选对象。
				</li>
				<li>
					<strong class="v-color font-medium">Value (V)</strong>：类似网页正文内容。匹配到相关 Key 后，真正汇总的是对应的 Value 信息。
				</li>
			</ul>
			<p>
				通过 Q/K/V，模型可以计算 attention score，从而决定生成时每个 token 应该关注谁、关注多少。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>步骤 2：Multi-Head 拆分</h4>
			<p>
				<span class="q-color">Query</span>, <span class="k-color">key</span>, and
				<span class="v-color">Value</span>
				向量会被拆成多个 heads。在 GPT-2（small）中共有 <code>12</code> 个 heads。每个 head 独立处理一部分表示，分别学习不同句法和语义关系。多头并行能显著提升表示能力。
			</p>
		</div>
		<div class="article-subsection-l2">
			<h4>步骤 3：Masked Self-Attention</h4>
			<p>
				在每个 head 中都会执行 masked self-attention。它一方面让模型关注有效上下文，另一方面通过掩码阻止访问未来 token，保证自回归生成的因果性。
			</p>

			<div class="figure">
				<img src="./article_assets/attention.png" width="80%" align="middle" />
			</div>
			<div class="figure-caption">
				图 <span class="attention">3</span>：利用 Query、Key、Value 计算 masked self-attention。
			</div>

			<ul>
				<li>
					<strong>Dot Product</strong>：
					<span class="q-color">Query</span>
					与 <span class="k-color">Key</span> 做点积得到 <strong>attention score</strong>，形成一个反映 token 两两关系的方阵。
				</li>
				<li>
					<strong>Scaling · Mask</strong>：对分数缩放后，在上三角应用掩码，将未来位置置为负无穷，确保模型在预测下一个 token 时不会“偷看未来”。
				</li>
				<li>
					<strong>Softmax · Dropout</strong>：缩放和掩码后，经 softmax 转为概率分布，再可选地加 dropout 正则。每行和为 1，表示当前 token 对其左侧 token 的关注分配。
				</li>
			</ul>
		</div>
		<div class="article-subsection-l2">
			<h4>步骤 4：输出与拼接</h4>
			<p>
				模型将 masked self-attention 分数与
				<span class="v-color">Value</span> 矩阵相乘，得到
				<span class="purple-color">最终输出</span>。
				GPT-2 有 <code>12</code> 个 self-attention heads，分别捕捉不同关系；它们的输出会被拼接后再经过线性投影。
			</p>
		</div>
	</div>

	<div class="article-section" id="article-activation" data-click="article-mlp">
		<h3>MLP：Multi-Layer Perceptron</h3>

		<div class="figure">
			<img src="./article_assets/mlp.png" width="70%" align="middle" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">4</span>：MLP 将 self-attention 输出映射到更高维空间，以增强模型表示能力。
		</div>

		<p>
			当多头 self-attention 捕捉到输入 token 的多样关系后，拼接结果会送入 MLP 进一步提升表示能力。MLP 模块由两层线性变换组成，中间使用 <a
				href="https://en.wikipedia.org/wiki/Rectified_linear_unit#Gaussian-error_linear_unit_(GELU)"
				>GELU</a
			> 激活函数。
		</p>
		<p>
			第一层线性变换将维度从 <code>768</code> 扩展到 <code>3072</code>（4 倍）。扩展有助于在高维空间中建模更丰富、更复杂的模式。
		</p>
		<p>
			第二层线性变换再将维度压回 <code>768</code>。这一压缩步骤在保持关键非线性信息的同时，将表示恢复到可管理的规模。
		</p>
		<p>
			与跨 token 融合信息的 self-attention 不同，MLP 逐 token 独立处理，将每个 token 表示从一个空间映射到另一个空间，从而提升整体模型容量。
		</p>
	</div>

	<div class="article-section" id="article-prob" data-click="article-prob">
		<h2>输出概率</h2>
		<p>
			输入经过所有 Transformer blocks 后，会进入最终线性层，为下一 token 预测做准备。该层把表示投影到 <code>50,257</code> 维空间，对应词表中每个 token 的 <code>logit</code> 分数。随后通过 softmax 把 logits 转成和为 1 的概率分布，便于按概率采样下一个 token。
		</p>

		<div class="figure py-5">
			<img src="./article_assets/softmax.png" width="70%" />
		</div>
		<div class="figure-caption">
			图 <span class="attention">5</span>：词表中每个 token 都会基于模型输出 logits 获得一个概率，该概率决定它成为下一个词的可能性。
		</div>

		<p id="article-temperature" data-click="article-temperature">
			最后一步是从该分布中采样下一个 token。这个过程中 <code>temperature</code> 超参数非常关键。其数学形式很简单：把模型输出 logits 除以 <code>temperature</code>。
		</p>

		<ul>
			<li>
				<code>temperature = 1</code>：对 softmax 输出几乎无影响。
			</li>
			<li>
				<code>temperature &lt; 1</code>：分布更尖锐，模型更“确定”，输出更可预测。
			</li>
			<li>
				<code>temperature &gt; 1</code>：分布更平滑，随机性更高，通常会带来更“有创意”的输出。
			</li>
		</ul>

		<p id="article-sampling" data-click="article-sampling">
			此外，可使用 <code>top-k</code> 与 <code>top-p</code> 进一步控制采样：
		</p>
		<ul>
			<li>
				<code>top-k sampling</code>：只保留概率最高的 k 个候选 token，过滤低概率项。
			</li>
			<li>
				<code>top-p sampling</code>：保留累计概率超过阈值 p 的最小候选集合，在保证高概率候选的同时保留多样性。
			</li>
		</ul>
		<p>
			通过调节 <code>temperature</code>、<code>top-k</code> 与 <code>top-p</code>，你可以在稳定性与多样性之间找到适合任务需求的平衡。
		</p>
	</div>

	<div class="article-section" data-click="article-advanced-features">
		<h2>辅助架构特性</h2>

		<p>
			Transformer 还有一些提升性能的重要辅助结构。它们对总体表现很关键，尤其在训练阶段。典型包括 Layer Normalization、Dropout 与 Residual Connections：Layer Normalization 稳定训练并加速收敛；Dropout 通过随机失活降低过拟合；Residual Connections 让梯度更顺畅传播，缓解梯度消失。
		</p>
		<div class="article-subsection" id="article-ln">
			<h3>Layer Normalization</h3>

			<p>
				Layer Normalization 通过对特征维做归一化，保持激活值的均值与方差稳定，从而提升训练稳定性与收敛速度，并降低模型对初始化权重的敏感性。每个 Transformer block 中通常会在 self-attention 前和 MLP 前各使用一次。
			</p>
		</div>
		<div class="article-subsection" id="article-dropout">
			<h3>Dropout</h3>

			<p>
				Dropout 是一种经典正则化技术：训练时随机将部分连接置零，防止模型过度依赖局部特征，提升对未见数据的泛化能力。推理阶段通常关闭 dropout。
			</p>
		</div>
		<div class="article-subsection" id="article-residual">
			<h3>Residual Connections</h3>

			<p>
				Residual connection 最早在 2015 年 ResNet 中被系统化应用。它通过“捷径连接”把层输入直接加到层输出，显著缓解梯度消失问题，使深层网络更易训练。在 GPT-2 中，每个 Transformer block 内会多次使用残差路径，帮助梯度稳定回传到前层。
			</p>
		</div>
	</div>

	<div class="article-section" data-click="article-interactive-features">
		<h1>交互功能</h1>
		<p>
			Transformer Explainer 提供了丰富交互，帮助你从内部机制理解 Transformer。你可以重点体验：
		</p>

		<ul>
			<li>
				<strong>输入自定义文本</strong>，观察模型如何处理并预测下一个词，包括 attention 权重、中间计算和最终概率的形成过程。
			</li>
			<li>
				<strong>使用 temperature 滑块</strong> 控制生成随机性，体验从稳定到更有创造性的输出变化。
			</li>
			<li>
				<strong>选择 top-k / top-p 采样</strong> 调整推理阶段的采样行为，比较不同参数对概率分布与预测结果的影响。
			</li>
			<li>
				<strong>交互查看注意力图</strong>，了解模型在输入序列中如何分配注意力；悬停 token 可高亮对应权重，直观看到上下文依赖关系。
			</li>
		</ul>
	</div>

	<div class="article-section" data-click="article-video">
		<h2>视频教程</h2>
		<div class="video-container">
			<iframe
				src="https://www.youtube.com/embed/ECR4oAwocjs"
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			>
			</iframe>
		</div>
	</div>

	<div class="article-section" data-click="article-implementation">
		<h2>Transformer Explainer 如何实现？</h2>
		<p>
			Transformer Explainer 在浏览器中直接运行一个在线 GPT-2（small）模型。
			该模型基于 Andrej Karpathy 的 GPT PyTorch 实现
			<a href="https://github.com/karpathy/nanoGPT" title="Github" target="_blank"
				>nanoGPT project</a
			>
			并转换为
			<a href="https://onnxruntime.ai/" title="ONNX" target="_blank">ONNX Runtime</a>
			以实现浏览器端流畅执行。前端界面基于 JavaScript，使用
			<a href="https://kit.svelte.dev/" title="Svelte" target="_blank">Svelte</a>
			作为框架，并使用
			<a href="https://d3js.org/" title="D3" target="_blank">D3.js</a>
			构建动态图形可视化。数值会随着用户输入实时更新。
		</p>
	</div>

	<div class="article-section" data-click="article-credit">
		<h2>Transformer Explainer 由谁开发？</h2>
		<p>
			Transformer Explainer 由

			<a href="https://aereeeee.github.io/" target="_blank">Aeree Cho</a>,
			<a href="https://www.linkedin.com/in/chaeyeonggracekim/" target="_blank">Grace C. Kim</a>,
			<a href="https://alexkarpekov.com/" target="_blank">Alexander Karpekov</a>,
			<a href="https://alechelbling.com/" target="_blank">Alec Helbling</a>,
			<a href="https://zijie.wang/" target="_blank">Jay Wang</a>,
			<a href="https://seongmin.xyz/" target="_blank">Seongmin Lee</a>,
			<a href="https://bhoov.com/" target="_blank">Benjamin Hoover</a>, and
			<a href="https://poloclub.github.io/polochau/" target="_blank">Polo Chau</a>

			（佐治亚理工学院）联合开发。
		</p>
	</div>
</div>

<style lang="scss">
	a {
		color: theme('colors.blue.500');

		&:hover {
			color: theme('colors.blue.700');
		}
	}

	.bold-purple {
		color: theme('colors.purple.700');
		font-weight: bold;
	}

	code {
		color: theme('colors.gray.500');
		background-color: theme('colors.gray.50');
		font-family: theme('fontFamily.mono');
	}

	.q-color {
		color: theme('colors.blue.400');
	}

	.k-color {
		color: theme('colors.red.400');
	}

	.v-color {
		color: theme('colors.green.400');
	}

	.purple-color {
		color: theme('colors.purple.500');
	}

	.article-section {
		padding-bottom: 2rem;
	}
	.architecture-section {
		padding-top: 1rem;
	}
	.video-container {
		position: relative;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		max-width: 100%;
		background: #000;
	}

	.video-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	#description {
		padding-bottom: 3rem;
		margin-left: auto;
		margin-right: auto;
		max-width: 78ch;
	}

	#description h1 {
		color: theme('colors.purple.700');
		font-size: 2.2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h2 {
		// color: #444;
		color: theme('colors.purple.700');
		font-size: 2rem;
		font-weight: 300;
		padding-top: 1rem;
	}

	#description h3 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description h4 {
		color: theme('colors.gray.700');
		font-size: 1.6rem;
		font-weight: 200;
		padding-top: 1rem;
	}

	#description p {
		margin: 1rem 0;
	}

	#description p img {
		vertical-align: middle;
	}

	#description .figure-caption {
		font-size: 0.8rem;
		margin-top: 0.5rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	#description ol {
		margin-left: 3rem;
		list-style-type: decimal;
	}

	#description li {
		margin: 0.6rem 0;
	}

	#description p,
	#description div,
	#description li {
		color: theme('colors.gray.600');
		line-height: 1.6;
	}

	#description small {
		font-size: 0.8rem;
	}

	#description ol li img {
		vertical-align: middle;
	}

	#description .video-link {
		color: theme('colors.blue.600');
		cursor: pointer;
		font-weight: normal;
		text-decoration: none;
	}

	#description ul {
		list-style-type: disc;
		margin-left: 2.5rem;
		margin-bottom: 1rem;
	}

	#description a:hover,
	#description .video-link:hover {
		text-decoration: underline;
	}

	.figure,
	.video {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
