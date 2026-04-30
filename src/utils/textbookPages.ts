import { get } from 'svelte/store';
import {
	expandedBlock,
	weightPopover,
	isBoundingBoxActive,
	textbookCurrentPageId,
	isExpandOrCollapseRunning,
	isFetchingModel,
	userId
} from '~/store';
import {
	highlightElements,
	removeHighlightFromElements,
	applyTransformerBoundingHeight,
	resetElementsHeight,
	highlightAttentionPath,
	removeAttentionPathHighlight,
	removeFingerFromElements
} from '~/utils/textbook';
import { drawResidualLine } from './animation';

export interface TextbookPage {
	id: string;
	title: string;
	content?: string;
	component?: any;
	timeoutId?: number;
	on: () => void;
	out: () => void;
	complete?: () => void;
}

const { drawLine, removeLine } = drawResidualLine();

export const textPages: TextbookPage[] = [
	{
		id: 'what-is-transformer',
		title: 'Transformer 是什么？',
		content: `<p><strong>Transformer</strong> 是现代 AI 的核心架构，支撑着 ChatGPT、Gemini 等模型。它在 2017 年提出，彻底改变了 AI 处理信息的方式。同一套架构既用于大规模数据训练，也用于推理生成结果。这里我们使用 GPT-2（small）作为示例：它比新模型更简单，但非常适合学习基础原理。</p>
`,
		on: () => { },
		out: () => { }
	},
	{
		id: 'how-transformers-work',
		title: 'Transformer 如何工作？',
		content: `<p>Transformer 并不神秘，它是通过不断回答下面这个问题来逐步生成文本的：</p>
	<blockquote class="question">
		"给定当前输入，最可能出现的下一个词是什么？"
	</blockquote>
	<p>这里我们会演示一个已训练模型如何生成文本。你可以输入自己的文本，或直接使用示例，然后点击<strong>生成</strong>观察过程。如果模型还没准备好，可以先切换<strong>示例</strong>体验。</p>`,
		on: () => {
			highlightElements(['.input-form']);
			if (get(isFetchingModel)) {
				highlightElements(['.input-form .select-button']);
			} else {
				highlightElements(['.input-form .generate-button']);
			}
		},
		out: () => {
			removeHighlightFromElements([
				'.input-form',
				'.input-form .select-button',
				'.input-form .generate-button'
			]);
		},
		complete: () => {
			removeFingerFromElements(['.input-form .select-button', '.input-form .generate-button']);
			if (get(textbookCurrentPageId) === 'how-transformers-work') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'how-transformers-work'
				});
			}
		}
	},
	{
		id: 'transformer-architecture',
		title: 'Transformer 架构',
		content:
			'<p>Transformer 主要由三部分组成：</p><div class="numbered-list"><div class="numbered-item"><span class="number-circle">1</span><div class="item-content"><strong>Embeddings</strong> 将文本转换为数值表示。</div></div><div class="numbered-item"><span class="number-circle">2</span><div class="item-content"><strong>Transformer blocks</strong> 通过 Self-Attention 融合信息，并由 MLP 进一步提炼。</div></div><div class="numbered-item"><span class="number-circle">3</span><div class="item-content"><strong>概率分布</strong> 决定每个候选下一个 token 的可能性。</div></div></div>',
		on: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			highlightElements(selectors);
			applyTransformerBoundingHeight(['.softmax-bounding', '.embedding-bounding']);
		},
		out: () => {
			const selectors = [
				'.step.embedding',
				'.step.softmax',
				'.transformer-bounding',
				'.transformer-bounding-title'
			];
			removeHighlightFromElements(selectors);
			resetElementsHeight(['.softmax-bounding', '.embedding-bounding']);
		}
	},
	{
		id: 'embedding',
		title: 'Embedding（嵌入）',
		content: `<p>Transformer 在处理文本前，会先把文本拆成更小的单位，并把每个单位表示成一组数字（向量）。这个过程叫 <strong>embedding</strong>；这个词既可指过程，也可指最终得到的向量。</p><p>在本工具里，每个向量会显示为一个矩形，悬停后可以看到它的维度大小。</p>`,
		on: () => {
			highlightElements(['.step.embedding .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.embedding .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.embedding .title']);
			if (get(textbookCurrentPageId) === 'embedding') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'embedding'
				});
			}
		}
	},
	{
		id: 'token-embedding',
		title: 'Token Embedding',
		content: `<p><strong>Tokenization（分词）</strong>会把输入文本拆成 token（例如完整单词或子词）。GPT-2（small）的词表有 50,257 个 token，每个 token 都有唯一 ID。</p><p>在 <strong>token embedding</strong> 阶段，每个 token 会从查找表中映射到一个 768 维向量。这些向量由训练学习得到，用于尽可能准确地表示 token 的语义。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.token-string',
				'.token-column .column.token-embedding'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'positional-encoding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'positional-encoding',
		title: 'Positional Encoding（位置编码）',
		content: `<p>在语言中，词序非常重要。<strong>Positional encoding</strong> 为每个 token 提供它在序列中的位置信息。</p><p>GPT-2 的做法是把可学习的位置向量加到 token embedding 上。更新的模型也可能使用其他方法，例如 RoPE（通过向量旋转编码位置信息）。这些方法的目标一致：让模型理解文本顺序。</p>`,
		on: function () {
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			if (get(expandedBlock).id !== 'embedding') {
				expandedBlock.set({ id: 'embedding' });
				this.timeoutId = setTimeout(() => {
					highlightElements(selectors);
				}, 500);
			} else {
				highlightElements(selectors);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			const selectors = [
				'.token-column .column.position-embedding',
				'.token-column .column.symbol'
			];
			removeHighlightFromElements(selectors);
			if (get(textbookCurrentPageId) !== 'token-embedding') expandedBlock.set({ id: null });
		}
	},
	{
		id: 'blocks',
		title: '重复堆叠的 Transformer Blocks',
		content: `<p><strong>Transformer block</strong> 是模型中最核心的处理单元，主要包含两部分：</p><ul><li><strong>Multi-head self-attention</strong>：让 token 彼此交换信息</li><li><strong>MLP</strong>：进一步提炼每个 token 的表示</li></ul><p>模型会堆叠多个 block，使 token 表示在层层传递中逐步丰富。GPT-2（small）共有 12 层。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements([
						'.transformer-bounding',
						'.step.transformer-blocks .guide',
						'.attention > .title',
						'.mlp > .title'
					]);
					highlightElements(['.transformer-bounding-title'], 'textbook-button-highlight');
					isBoundingBoxActive.set(true);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.transformer-bounding',
				'.step.transformer-blocks .guide',
				'.attention > .title',
				'.mlp > .title'
			]);
			removeHighlightFromElements(['.transformer-bounding-title'], 'textbook-button-highlight');
			isBoundingBoxActive.set(false);
		},
		complete: () => {
			removeFingerFromElements(['.transformer-bounding-title']);
			if (get(textbookCurrentPageId) === 'blocks') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'blocks'
				});
			}
		}
	},
	{
		id: 'self-attention',
		title: 'Multi-Head Self Attention（多头自注意力）',
		content:
			'<p><strong>Self-attention</strong> 让模型判断：对当前 token 来说，输入中的哪些部分最相关。这使它能够捕捉语义和依赖关系，包括相距较远的词之间的关系。</p><p>在 <strong>multi-head</strong> 机制中，模型会并行执行多个注意力过程，每个 head 关注文本中的不同模式。</p>',
		on: () => {
			highlightElements(['.step.attention']);
		},
		out: () => {
			removeHighlightFromElements(['.step.attention']);
		}
	},
	{
		id: 'qkv',
		title: 'Query / Key / Value',
		content: `
	<p>执行 self-attention 时，每个 token 的 embedding 会被变换成 
	<span class="highlight">三组新的表示</span>：
	<span class="blue">Query</span>、
	<span class="red">Key</span> 和
	<span class="green">Value</span>。
	这个变换通过不同的权重和偏置实现，这些参数会在训练中持续优化。</p>

<p>得到 Q/K/V 后，<span class="blue">Query</span> 会与 <span class="red">Key</span> 计算相关性，再用该相关性对 <span class="green">Value</span> 进行加权。</p>
`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['g.path-group.qkv', '.step.qkv .qkv-column']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.step.qkv .qkv-column']);
			if (get(textbookCurrentPageId) === 'qkv') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'qkv'
				});
			}
		}
	},

	{
		id: 'multi-head',
		title: 'Multi-head（多头）',
		content:
			'<p>在得到 <span class="blue">Q</span>、<span class="red">K</span>、<span class="green">V</span> 后，模型会将它们拆分为多个 <strong>heads</strong>（GPT-2 small 中是 12 个）。每个 head 使用自己的一组较小 Q/K/V，关注不同模式，例如语法关系、语义联系或长程依赖。</p><p>多头并行让模型能同时学习多种关系，从而获得更丰富的理解能力。</p>',
		on: () => {
			highlightAttentionPath();
			highlightElements(['.multi-head .head-title']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.multi-head .head-title']);
		},
		complete: () => {
			removeFingerFromElements(['.multi-head .head-title']);
			if (get(textbookCurrentPageId) === 'multi-head') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'multi-head'
				});
			}
		}
	},
	{
		id: 'masked-self-attention',
		title: 'Masked Self Attention（掩码自注意力）',
		content: `<p>在每个 head 中，模型会计算每个 token 对其他 token 的关注程度：</p><ul><li><strong>Dot Product</strong>：对 <span class="blue">Query</span>/<span class="red">Key</span> 向量逐项相乘并求和，得到 <span class="purple">attention scores</span>。</li><li><strong>Mask</strong>：屏蔽未来 token，避免模型“偷看”后文。</li><li><strong>Softmax</strong>：把分数转成概率，每一行和为 1，表示对前文 token 的关注分配。</li></ul>`,
		on: () => {
			highlightAttentionPath();
			highlightElements(['.attention-matrix.attention-result']);
		},
		out: () => {
			removeAttentionPathHighlight();
			removeHighlightFromElements(['.attention-matrix.attention-result']);
			expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.attention-matrix.attention-result']);
			if (get(textbookCurrentPageId) === 'masked-self-attention') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'masked-self-attention'
				});
			}
		}
	},
	{
		id: 'output-concatenation',
		title: 'Attention 输出与拼接',
		content:
			'<p>每个 head 都会将自己的 <span class="purple">attention scores</span> 与 <span class="green">Value</span> 向量相乘，得到该 head 的 attention 输出。这是结合上下文后的 token 表示。</p><p>GPT-2（small）会得到 12 组这样的输出，再将它们拼接回原始维度（768）。</p>',
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['path.to-attention-out.value-to-out', '.attention .column.out']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.attention .column.out']);
			if (get(textbookCurrentPageId) === 'output-concatenation') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-concatenation'
				});
			}
		}
	},
	{
		id: 'mlp',
		title: 'MLP（多层感知机）',
		content:
			'<p>attention 输出会进入 <strong>MLP</strong>，进一步精炼 token 表示。线性层会用学习到的权重与偏置改变 embedding 的数值与维度，随后通过非线性激活函数决定信息保留程度。</p><p>激活函数有很多种；GPT-2 使用 <strong>GELU</strong>，它会让较小值部分通过、较大值更多通过，从而兼顾细微模式和强特征。</p>',
		on: () => {
			highlightElements(['.step.mlp', '.operation-col.activation']);
		},
		out: () => {
			removeHighlightFromElements(['.step.mlp', '.operation-col.activation']);
		}
	},

	{
		id: 'output-logit',
		title: '输出 Logit',
		content: `<p>经过所有 Transformer blocks 后，最后一个 token 的输出 embedding（已融合前文上下文）会进入最终线性层，与学习到的权重相乘。</p><p>这会得到 <strong>logits</strong>：共 50,257 个分数，对应 GPT-2 词表中的每个 token，用于表示它们作为下一个 token 的相对可能性。</p>`,
		on: () => {
			highlightElements(['g.path-group.softmax', '.column.final']);
		},
		out: () => {
			removeHighlightFromElements(['g.path-group.softmax', '.column.final']);
			weightPopover.set(null);
		},
		complete: () => {
			removeFingerFromElements(['.column.final']);
			if (get(textbookCurrentPageId) === 'output-logit') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-logit'
				});
			}
		}
	},
	{
		id: 'output-probabilities',
		title: '概率分布',
		content:
			'<p>logits 只是原始分数。为了更易解释，我们会把它们转成 0 到 1 之间的<strong>概率</strong>，且总和为 1。这样就能看到每个 token 成为下一个词的可能性。</p><p>我们不一定总选概率最高的 token，也可以使用不同采样策略，在稳定性与创造性之间做平衡。</p>',
		on: () => {
			highlightElements(['.step.softmax .title']);
		},
		out: () => {
			removeHighlightFromElements(['.step.softmax .title']);
		},
		complete: () => {
			removeFingerFromElements(['.step.softmax .title']);
			if (get(textbookCurrentPageId) === 'output-probabilities') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'output-probabilities'
				});
			}
		}
	},
	{
		id: 'temperature',
		title: 'Temperature（温度）',
		content:
			'<p><strong>Temperature</strong> 的作用是在 logits 转概率前进行缩放。<strong>低温度</strong>（如 0.2）会放大高分、压低低分，使模型更倾向高概率 token，输出更<strong>可预测</strong>。<strong>高温度</strong>（如 1.0 及以上）会拉平差异，让低概率 token 也更可能被选中，输出更<strong>有创造性</strong>。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.scaled',
						'.title-box.scaled',
						'.content-box.scaled',
						'.temperature-input'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.scaled',
					'.title-box.scaled',
					'.content-box.scaled',
					'.temperature-input'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.scaled',
				'.title-box.scaled',
				'.temperature-input',
				'.content-box.scaled'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.temperature-input']);
			if (get(textbookCurrentPageId) === 'temperature') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'temperature'
				});
			}
		}
	},
	{
		id: 'sampling',
		title: '采样策略',
		content:
			'<p>最后我们需要一个策略来选下一个 token。常见做法包括：贪心搜索（Greedy）直接选最高分；<strong>Top-k</strong> 只保留概率最高的 k 个 token；<strong>Top-p</strong> 保留累计概率至少为 p 的最小候选集合，从而提前过滤低可能项。</p><p>随后再用 softmax 将剩余 logits 转为概率，并从允许集合中按概率随机采样一个 token。</p>',
		on: function () {
			if (get(expandedBlock).id !== 'softmax') {
				expandedBlock.set({ id: 'softmax' });
				this.timeoutId = setTimeout(() => {
					highlightElements([
						'.formula-step.sampling',
						'.title-box.sampling',
						'.sampling-input',
						'.content-box.sampling'
					]);
				}, 500);
			} else {
				highlightElements([
					'.formula-step.sampling',
					'.title-box.sampling',
					'.sampling-input',
					'.content-box.sampling'
				]);
			}
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements([
				'.formula-step.sampling',
				'.title-box.sampling',
				'.sampling-input',
				'.content-box.sampling'
			]);
			if (!['temperature', 'sampling'].includes(get(textbookCurrentPageId)))
				expandedBlock.set({ id: null });
		},
		complete: () => {
			removeFingerFromElements(['.sampling-input']);
			if (get(textbookCurrentPageId) === 'sampling') {
				window.dataLayer?.push({
					user_id: get(userId),
					event: `textbook-complete`,
					page_id: 'sampling'
				});
			}
		}
	},
	{
		id: 'residual',
		title: 'Residual Connection（残差连接）',
		content: `<p>Transformer 还有一些提升性能的辅助结构。例如 <strong>residual connection</strong> 会把某层输入直接加到输出上，减轻信息在深层网络中的衰减。在 GPT-2 中，每个 block 会使用两次残差连接，以支持更深层的稳定训练。</p>`,
		on: function () {
			this.timeoutId = setTimeout(
				() => {
					highlightElements(['.operation-col.residual', '.residual-start']);
					drawLine();
				},
				get(isExpandOrCollapseRunning) ? 500 : 0
			);
		},
		out: function () {
			if (this.timeoutId) {
				clearTimeout(this.timeoutId);
				this.timeoutId = undefined;
			}
			removeHighlightFromElements(['.operation-col.residual', '.residual-start']);
			removeLine();
		}
	},
	{
		id: 'layer-normalization',
		title: 'Layer Normalization（层归一化）',
		content: `<p><strong>Layer Normalization</strong> 通过调节输入的均值与方差来稳定训练与推理，使模型对初始参数不那么敏感、学习更高效。在 GPT-2 中，它会在 self-attention 前、MLP 前，以及最终输出前各使用一次。</p>`,
		on: () => {
			highlightElements(['.operation-col.ln']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.ln']);
		}
	},
	{
		id: 'dropout',
		title: 'Dropout',
		content: `<p>训练时，<strong>dropout</strong> 会随机关闭一部分连接，避免模型过拟合到局部模式，从而提升泛化能力。GPT-2 使用了 dropout；而一些更新的 LLM 因训练数据极大，过拟合问题较弱，可能会减少或省略 dropout。在推理阶段，dropout 默认关闭。</p>`,
		on: () => {
			highlightElements(['.operation-col.dropout']);
		},
		out: () => {
			removeHighlightFromElements(['.operation-col.dropout']);
		}
	}
	// {
	// 	id: 'final',
	// 	title: `Let's explore!`,
	// 	content: '',
	// 	on: () => {},
	// 	out: () => {}
	// }
];
