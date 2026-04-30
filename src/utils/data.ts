import { PreTrainedTokenizer } from '@xenova/transformers';
import * as ort from 'onnxruntime-web';
import {
	modelData,
	tokens,
	tokenIds,
	tokenSlices,
	isModelRunning,
	predictedToken,
	modelSession,
	modelMetaMap
} from '~/store';
import { get } from 'svelte/store';
import { reshapeArray } from './array';
import { showFlowAnimation } from './animation';

export const fakeRunWithCachedData = async ({
	cachedData,
	tokenizer,
	temperature,
	sampling
}: {
	cachedData: any;
	tokenizer: PreTrainedTokenizer;
	temperature: number;
	sampling: Sampling;
}) => {
	isModelRunning.set(true);

	modelData.set(cachedData);
	tokens.set(cachedData.tokens);
	tokenIds.set(cachedData.tokenIds);
	// English cached examples are 1-to-1 token mapping (no byte splitting)
	tokenSlices.set(cachedData.tokenIds.map((_: number, i: number) => i));

	setTimeout(async () => {
		await showFlowAnimation(cachedData.tokens.length, true);
		adjustTemperature({
			tokenizer,
			logits: cachedData.logits,
			temperature,
			sampling
		});
		isModelRunning.set(false);
	}, 0);
};

export const runModel = async ({
	tokenizer,
	input,
	temperature,
	sampling
}: {
	tokenizer: PreTrainedTokenizer;
	input: string;
	temperature: number;
	sampling: Sampling;
}) => {
	isModelRunning.set(true);

	const { token_ids, input_tokens, sliceIndices } = await getTokenization(
		tokenizer,
		input === '' ? ' ' : input
	);

	let isOneTokenAdded: boolean;
	tokens.set(input_tokens);
	tokenSlices.set(sliceIndices);
	tokenIds.update((prev) => {
		isOneTokenAdded =
			prev.length === token_ids.length - 1 && prev.every((id, idx) => id === token_ids[idx]);
		return token_ids;
	});

	const { logits, outputs } = await getData(token_ids);

	const { probabilities, sampled } = getProbabilities({ tokenizer, logits, sampling, temperature });

	modelData.set({ logits, outputs, probabilities, sampled });

	// To ensure the animation starts after all elements have been rendered
	setTimeout(async () => {
		await showFlowAnimation(input_tokens.length, isOneTokenAdded);

		predictedToken.set(sampled);
		// setPredictedTokenForAnimation(probabilities, sampled, sampling);

		isModelRunning.set(false);
	}, 0);
};

const setPredictedTokenForAnimation = (probabilities, sampled, sampling) => {
	const delay = 10;
	const topK = probabilities.slice(0, sampling.value);
	const animationTokens = [...topK, ...topK.slice(sampled.rank).reverse()];

	for (let i = 0; i < animationTokens.length; i++) {
		setTimeout(() => {
			predictedToken.set(animationTokens[i]);
		}, i * delay);
	}
};

export const adjustTemperature = async ({
	tokenizer,
	logits,
	temperature,
	sampling
}: {
	tokenizer: PreTrainedTokenizer;
	logits: number[];
	temperature: number;
	sampling: Sampling;
}) => {
	const { probabilities, sampled } = getProbabilities({ tokenizer, logits, sampling, temperature });

	modelData.update((d) => ({ ...d, probabilities, sampled }));

	predictedToken.set(sampled);
	// setPredictedTokenForAnimation(probabilities, sampled, sampling);
};

/**
 * Decode token IDs into display strings that handle multi-byte Unicode (e.g. Chinese).
 * GPT-2 uses byte-level BPE, so non-ASCII characters are split into individual byte
 * tokens.  Decoding a single byte token produces U+FFFD (replacement character).
 * We accumulate consecutive byte tokens until a valid Unicode sequence is formed.
 * Returns a compact token list (one entry per visible character) and sliceIndices
 * (the index in token_ids where each display token starts).
 */
function decodeTokensForDisplay(
	tokenizer: PreTrainedTokenizer,
	token_ids: number[]
): { tokens: string[]; sliceIndices: number[] } {
	const tokens: string[] = [];
	const sliceIndices: number[] = [];
	let i = 0;
	while (i < token_ids.length) {
		const single = tokenizer.decode([token_ids[i]]);
		if (!single.includes('\uFFFD')) {
			tokens.push(single);
			sliceIndices.push(i);
			i++;
			continue;
		}
		// This token is a partial UTF-8 byte.  Try accumulating up to 3 more tokens
		// (max 4 bytes per UTF-8 code point) until the sequence decodes cleanly.
		let merged = single;
		let consumed = 1;
		for (let len = 2; len <= 4 && i + len <= token_ids.length; len++) {
			const candidate = tokenizer.decode(token_ids.slice(i, i + len));
			if (!candidate.includes('\uFFFD')) {
				merged = candidate;
				consumed = len;
				break;
			}
		}
		tokens.push(merged);
		sliceIndices.push(i);
		i += consumed;
	}
	return { tokens, sliceIndices };
}

/**
 * Build the GPT-2 bytes_to_unicode reverse mapping: BPE char → byte value.
 * GPT-2 maps all 256 bytes to printable Unicode chars; this inverts that mapping.
 */
function buildUnicodeToBytes(): Map<string, number> {
	// Replicate the GPT-2 bytes_to_unicode() function
	const bs: number[] = [];
	for (let i = 33; i <= 126; i++) bs.push(i);   // ! to ~
	for (let i = 161; i <= 172; i++) bs.push(i);  // ¡ to ¬
	for (let i = 174; i <= 255; i++) bs.push(i);  // ® to ÿ
	const cs = [...bs];
	let n = 0;
	for (let b = 0; b < 256; b++) {
		if (!bs.includes(b)) {
			bs.push(b);
			cs.push(256 + n);
			n++;
		}
	}
	const map = new Map<string, number>();
	bs.forEach((b, i) => map.set(String.fromCodePoint(cs[i]), b));
	return map;
}

// Lazily initialized reverse mapping (singleton)
let _unicodeToBytes: Map<string, number> | null = null;
function getUnicodeToBytes(): Map<string, number> {
	if (!_unicodeToBytes) _unicodeToBytes = buildUnicodeToBytes();
	return _unicodeToBytes;
}

/**
 * Convert a GPT-2 BPE token string (byte-to-unicode encoded) back to readable text.
 * - If the bytes decode to valid UTF-8, returns the UTF-8 string (e.g. "的").
 * - If the bytes are a partial / invalid UTF-8 sequence, returns a hex notation
 *   (e.g. "‹0xE7›") so users see a clear indication instead of mojibake Latin chars.
 */
function bpeTokenToReadable(bpeStr: string): string {
	const u2b = getUnicodeToBytes();
	const bytes: number[] = [];
	for (const ch of bpeStr) {
		const byte = u2b.get(ch);
		if (byte === undefined) return bpeStr; // shouldn't happen for GPT-2 vocab
		bytes.push(byte);
	}
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
	} catch {
		// Partial or invalid UTF-8 — show hex so it's clear these are raw bytes
		return bytes.map((b) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join('·');
	}
}

/**
 * Get the display string for a single token ID.
 * For byte tokens that are partial UTF-8 sequences (common for CJK), converts
 * the raw BPE vocab string back to bytes and shows hex notation instead of
 * mojibake Latin characters.
 */
function getDisplayToken(tokenizer: PreTrainedTokenizer, tokenId: number): string {
	const decoded = tokenizer.decode([tokenId]);
	if (!decoded.includes('\uFFFD')) return decoded;
	// Get the raw BPE token string and convert bytes → readable text or hex
	const rawToken = (tokenizer.model as any).vocab?.[tokenId];
	if (!rawToken) return decoded;
	return bpeTokenToReadable(rawToken);
}

export const getTokenization = async (tokenizer: PreTrainedTokenizer, input: string) => {
	const token_ids = tokenizer.encode(input);
	const { tokens: input_tokens, sliceIndices } = decodeTokensForDisplay(tokenizer, token_ids);

	return {
		token_ids,
		input_tokens,
		sliceIndices
	};
};

export const getData = async (token_ids: number[]) => {
	try {
		// Convert token_ids to tensor
		const inputTensor = new ort.Tensor('int64', token_ids, [1, token_ids.length]);

		// Get the session from the store
		const session = get(modelSession);
		if (!session) {
			throw new Error('Model session is not initialized.');
		}

		// Prepare the feeds (inputs)
		const feeds = { input: inputTensor };

		// Run inference
		const results = await session.run(feeds);

		// Extract the logits
		const logits = results['linear_output'].data;

		// Extract the dictionary values
		const outputs = targetTensors.reduce(
			(obj, key) => {
				const out = results[key];
				const processedData = {
					// ...out,
					data: reshapeArray([...out.cpuData], out.dims)
				};
				obj[key] = processedData;
				return obj;
			},
			{} as ModelData['outputs']
		);

		return {
			logits,
			outputs
		};
	} catch (error) {
		console.error('Error during inference:', error.message);
		throw error;
	}
};

export const getProbabilities = ({
	tokenizer,
	logits,
	sampling = { type: 'top-k', value: 10 },
	temperature = 1
}: {
	tokenizer: PreTrainedTokenizer;
	logits: number[];
	sampling: Sampling;
	temperature: number;
}): { probabilities: Probabilities; sampled: Probability } => {
	if (sampling.type === 'top-p') {
		return topPSampling(tokenizer, logits, sampling.value, temperature);
	} else {
		return topKSampling(tokenizer, logits, sampling.value, temperature);
	}
};

function topKSampling(
	tokenizer: PreTrainedTokenizer,
	logits: number[],
	k: number,
	temperature: number
): { probabilities: Probabilities; sampled: Probability } {
	// Trim the list to a reasonable number that can be displayed on the screen
	const max = 50;
	const sortedLogits = Array.from(logits)
		.map((logit, index) => ({
			tokenId: index,
			logit
		}))
		.sort((a, b) => b.logit - a.logit)
		.slice(0, max);

	// Temperature Scaling
	const scaledLogits = sortedLogits.map((item) => ({
		...item,
		scaledLogit: item.logit / temperature
	}));

	// Apply Top-k: Keep topK logits and set others to -Infinity
	const filteredLogits = scaledLogits.map((item, index) => ({
		...item,
		topKLogit: index < k ? item.scaledLogit : -Infinity
	}));

	// Softmax Normalization
	const topKLogits = filteredLogits.map((item) => item.topKLogit);
	const { expLogits, probabilities } = softmax(topKLogits);

	const output = filteredLogits.map((item, i) => ({
		...item,
		rank: i,
		token: formatTokenForDisplay(getDisplayToken(tokenizer, item.tokenId)),
		expLogit: expLogits[i],
		probability: probabilities[i]
	}));

	// Sample from the top-k tokens
	const sampled = randomChoice(output);

	return { probabilities: output, sampled };
}

function topPSampling(
	tokenizer: PreTrainedTokenizer,
	logits: number[],
	p: number,
	temperature: number
): { probabilities: Probabilities; sampled: Probability } {
	// Trim the list to a reasonable number that can be displayed on the screen
	const max = 50;
	const sortedLogits = Array.from(logits)
		.map((logit, index) => ({
			tokenId: index,
			logit
		}))
		.sort((a, b) => b.logit - a.logit)
		.slice(0, max);

	// Temperature Scaling
	const scaledLogits = sortedLogits.map((item) => ({
		...item,
		scaledLogit: item.logit / temperature
	}));

	// Softmax Normalization
	const { expLogits, probabilities } = softmax(scaledLogits.map((item) => item.scaledLogit));

	// Compute cumulative probabilities
	const cumulativeProbabilities: number[] = [];
	probabilities.reduce((acc, prob, idx) => {
		cumulativeProbabilities[idx] = acc + prob;
		return cumulativeProbabilities[idx];
	}, 0);

	let cutoffIndex = cumulativeProbabilities.findIndex((cumProb) => cumProb >= p);
	cutoffIndex = cutoffIndex === -1 ? cumulativeProbabilities.length - 1 : cutoffIndex;

	const topIndices = scaledLogits.slice(0, cutoffIndex + 1);
	const topProbabilities = topIndices.map((d, i) => probabilities[i]);

	// Renormalize probabilities for top-p tokens
	const sumTopProbabilities = topProbabilities.reduce((sum, val) => sum + val, 0);
	const newProbabilities = topProbabilities.map((val) => val / sumTopProbabilities);

	// Sample from the top-p tokens
	const output = scaledLogits.map((item, i) => ({
		...item,
		rank: i,
		token: formatTokenForDisplay(getDisplayToken(tokenizer, item.tokenId)),
		expLogit: expLogits[i],
		probability: newProbabilities[i] || 0,
		topPProbability: probabilities[i], //original
		cumulativeProbability: cumulativeProbabilities[i],
		cutoffIndex
	}));

	const nextToken = randomChoice(output);
	return { probabilities: output, sampled: nextToken };
}

function softmax(logits: number[]): { expLogits: number[]; probabilities: number[] } {
	const maxLogit = Math.max(...logits);
	const expLogits = logits.map((logit) => (logit === -Infinity ? 0 : Math.exp(logit - maxLogit)));
	const sumExpLogits = expLogits.reduce((sum, val) => sum + val, 0);
	const probabilities = expLogits.map((val) => val / sumExpLogits);

	return { expLogits, probabilities };
}

// Helper function to format tokens for display
function formatTokenForDisplay(token: string): string {
	// Replace special whitespace characters with readable labels
	return token
		.replace(/\n/g, '[NEWLINE]')
		.replace(/\t/g, '[TAB]')
		.replace(/\r/g, '[CR]')
		.replace(/\s{2,}/g, (match) => `[${match.length} SPACES]`); // Multiple spaces
}

// Simulates the np.random.choice function in Python.
function randomChoice(items: Probabilities): Probability {
	const probabilities = items.map((d) => d.probability);

	// Ensure probabilities sum to 1
	// const totalProb = probabilities.reduce((sum, p) => sum + p, 0);
	// if (Math.abs(totalProb - 1.0) > 1e-6) {
	// 	throw new Error('Probabilities must sum to 1.');
	// }

	// Generate a random number between 0 and 1
	const random = Math.random();

	// Accumulate probabilities and find the corresponding item
	let cumulativeProbability = 0;
	for (let i = 0; i < probabilities.length; i++) {
		cumulativeProbability += probabilities[i];
		if (random < cumulativeProbability) {
			return items[i];
		}
	}

	// Fallback in case of numerical issues
	return items[items.length - 1];
}

const attentionTensors = Array(modelMetaMap.gpt2.layer_num)
	.fill(0)
	.flatMap((_, i) => {
		return Array(modelMetaMap.gpt2.attention_head_num)
			.fill(0)
			.flatMap((_, j) => [
				`block_${i}_attn_head_${j}_attn`,
				`block_${i}_attn_head_${j}_attn_scaled`,
				`block_${i}_attn_head_${j}_attn_masked`,
				`block_${i}_attn_head_${j}_attn_softmax`,
				`block_${i}_attn_head_${j}_attn_dropout`
			]);
	});

const targetTensors = [...attentionTensors];

// const targetTensors = [
// 'tok_emb',
// 'transformer_wpe_weight',
// 'pos_emb',
// 'input_emb',
// 'input_emb_dropout',
// 'block_0_ln_1_input_mean',
// 'block_0_ln_1_input_var',
// 'block_0_ln_1_input_normalized',
// 'block_0_ln_1_weight',
// 'block_0_ln_1_bias',
// 'block_0_ln_1_output',
// 'block_0_attn_head_0_q_weights',
// 'block_0_attn_head_0_k_weights',
// 'block_0_attn_head_0_v_weights',
// 'block_0_attn_head_0_q_bias',
// 'block_0_attn_head_0_k_bias',
// 'block_0_attn_head_0_v_bias',
// 'block_0_attn_head_0_q',
// 'block_0_attn_head_0_k',
// 'block_0_attn_head_0_v',
// 'block_0_attn_head_0_q_transposed',
// 'block_0_attn_head_0_k_transposed',
// 'block_0_attn_head_0_v_transposed',
// 'block_0_attn_head_0_attn',
// 'block_0_attn_head_0_attn_scaled',
// 'block_0_attn_head_0_attn_masked',
// 'block_0_attn_head_0_attn_softmax',
// 'block_0_attn_head_0_attn_dropout',
// 'block_0_attn_head_0_v_output',
// 'block_0_attn_v_output_combined',
// 'block_0_attn_proj_weights',
// 'block_0_attn_proj_bias',
// 'block_0_attn_attn_output',
// 'block_0_res_1',
// 'block_0_ln_2_input_mean',
// 'block_0_ln_2_input_var',
// 'block_0_ln_2_input_normalized',
// 'block_0_ln_2_weight',
// 'block_0_ln_2_bias',
// 'block_0_ln_2_output',
// 'block_0_mlp_linear_1_weight',
// 'block_0_mlp_linear_1_bias',
// 'block_0_mlp_linear_1_output',
// 'block_0_mlp_gelu_output',
// 'block_0_mlp_linear_2_weight',
// 'block_0_mlp_linear_2_bias',
// 'block_0_mlp_linear_2_output',
// 'block_0_mlp_output_after_dropout',
// 'block_0_res_2',
// 'ln_f_input_mean',
// 'ln_f_input_var',
// 'ln_f_input_normalized',
// 'ln_f_weight',
// 'ln_f_bias',
// 'ln_f_output',
// 'linear_weight',
// 	'linear_output'
// ];
