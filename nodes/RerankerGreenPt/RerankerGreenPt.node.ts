import type {
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { loadModels } from '../catalogue';
import { loggedCall } from '../loggedCall';

type Document = {
	pageContent: string;
	metadata: Record<string, unknown>;
};

type RerankResponse = {
	results: Array<{ index: number; relevance_score: number }>;
};

export class RerankerGreenPt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Reranker GreenPT',
		name: 'rerankerGreenPt',
		icon: { light: 'file:../../icons/greenpt.svg', dark: 'file:../../icons/greenpt.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["model"]}}',
		description:
			'Use GreenPT to reorder documents retrieved from a vector store by relevance to the query',
		defaults: {
			name: 'Reranker GreenPT',
		},
		codex: {
			categories: ['assistant'],
			subcategories: {
				AI: ['Rerankers'],
			},
			resources: {
				primaryDocumentation: [{ url: 'https://docs.greenpt.ai/reranker' }],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiReranker],
		outputNames: ['Reranker'],
		credentials: [
			{
				name: 'greenPtApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getModels' },
				default: 'green-rerank',
				description:
					'The model that scores the documents. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Top N',
				name: 'topN',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 3,
				description: 'The maximum number of documents to return after reranking',
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadModels.call(this, 'RERANK');
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('greenPtApi');
		const model = this.getNodeParameter('model', itemIndex) as string;
		const topN = this.getNodeParameter('topN', itemIndex) as number;

		const reranker = {
			compressDocuments: async (documents: Document[], query: string) =>
				await loggedCall(this, NodeConnectionTypes.AiReranker, { query, documents }, async () => {
					if (documents.length === 0) return [];
					const response = (await this.helpers.httpRequestWithAuthentication.call(
						this,
						'greenPtApi',
						{
							method: 'POST',
							url: `${credentials.url as string}/rerank`,
							body: {
								model,
								query,
								documents: documents.map((document) => document.pageContent),
								top_n: topN,
							},
							json: true,
						},
					)) as RerankResponse;

					return response.results.map((result) => {
						const document = documents[result.index];
						return {
							...document,
							metadata: { ...document.metadata, relevanceScore: result.relevance_score },
						};
					});
				}),
		};

		return { response: reranker };
	}
}
