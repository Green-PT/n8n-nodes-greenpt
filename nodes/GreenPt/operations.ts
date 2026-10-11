import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

type EmbeddingsResponse = {
	data: Array<{ embedding: number[] }>;
	usage?: IDataObject;
};

type RerankResponse = {
	results: Array<{ index: number; relevance_score: number }>;
};

type ListenResponse = {
	metadata?: { duration?: number };
	results: {
		channels: Array<{
			alternatives: Array<{ transcript: string; confidence: number; words: IDataObject[] }>;
		}>;
	};
};

type TranscribeOptions = {
	diarize?: boolean;
	punctuate?: boolean;
	smartFormat?: boolean;
};

async function request<T>(
	ctx: IExecuteFunctions,
	path: string,
	options: Omit<Parameters<IExecuteFunctions['helpers']['httpRequest']>[0], 'url'>,
): Promise<T> {
	const credentials = await ctx.getCredentials('greenPtApi');
	return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'greenPtApi', {
		...options,
		url: `${credentials.url as string}${path}`,
	})) as T;
}

export async function createEmbedding(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', itemIndex) as string;
	const text = this.getNodeParameter('text', itemIndex) as string;

	const response = await request<EmbeddingsResponse>(this, '/embeddings', {
		method: 'POST',
		body: { model, input: text },
		json: true,
	});

	return [
		{
			json: { model, embedding: response.data[0].embedding, usage: response.usage },
			pairedItem: { item: itemIndex },
		},
	];
}

export async function rerankDocuments(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', itemIndex) as string;
	const query = this.getNodeParameter('query', itemIndex) as string;
	const topN = this.getNodeParameter('topN', itemIndex) as number;
	const raw = this.getNodeParameter('documents', itemIndex) as unknown;
	const documents: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;

	if (!Array.isArray(documents) || !documents.every((d) => typeof d === 'string')) {
		throw new NodeOperationError(this.getNode(), 'Documents must be a JSON array of strings', {
			itemIndex,
		});
	}

	const response = await request<RerankResponse>(this, '/rerank', {
		method: 'POST',
		body: { model, query, documents, top_n: topN },
		json: true,
	});

	return response.results.map((result) => ({
		json: {
			index: result.index,
			relevanceScore: result.relevance_score,
			document: documents[result.index] as string,
		},
		pairedItem: { item: itemIndex },
	}));
}

export async function transcribeAudio(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', itemIndex) as string;
	const language = this.getNodeParameter('language', itemIndex) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const options = this.getNodeParameter('options', itemIndex, {}) as TranscribeOptions;

	const binary = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const audio = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const qs: IDataObject = { model, language, punctuate: options.punctuate ?? true };
	if (options.diarize) qs.diarize_model = 'latest';
	if (options.smartFormat) qs.smart_format = true;

	const raw = await request<string | ListenResponse>(this, '/listen', {
		method: 'POST',
		qs,
		body: audio,
		headers: { 'Content-Type': binary.mimeType },
	});
	const response = typeof raw === 'string' ? (JSON.parse(raw) as ListenResponse) : raw;
	const best = response.results.channels[0]?.alternatives[0];

	return [
		{
			json: {
				transcript: best?.transcript ?? '',
				confidence: best?.confidence,
				duration: response.metadata?.duration,
				words: best?.words ?? [],
			},
			pairedItem: { item: itemIndex },
		},
	];
}
