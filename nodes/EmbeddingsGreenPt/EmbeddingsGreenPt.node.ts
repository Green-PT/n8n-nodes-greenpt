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

type EmbeddingsResponse = {
	data: Array<{ index: number; embedding: number[] }>;
};

const BATCH_SIZE = 256;

export class EmbeddingsGreenPt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Embeddings GreenPT',
		name: 'embeddingsGreenPt',
		icon: { light: 'file:../../icons/greenpt.svg', dark: 'file:../../icons/greenpt.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["model"]}}',
		description: 'Use GreenPT embedding models with vector stores',
		defaults: {
			name: 'Embeddings GreenPT',
		},
		codex: {
			categories: ['assistant'],
			subcategories: {
				AI: ['Embeddings'],
			},
			resources: {
				primaryDocumentation: [{ url: 'https://docs.greenpt.ai/embeddings' }],
			},
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiEmbedding],
		outputNames: ['Embeddings'],
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
				default: 'green-embedding',
				description:
					'The model that creates the embeddings. Use the same model to insert and to query a vector store. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadModels.call(this, 'EMBEDDINGS');
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('greenPtApi');
		const model = this.getNodeParameter('model', itemIndex) as string;

		const embed = async (input: string[]): Promise<number[][]> => {
			const vectors: number[][] = [];
			for (let start = 0; start < input.length; start += BATCH_SIZE) {
				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'greenPtApi',
					{
						method: 'POST',
						url: `${credentials.url as string}/embeddings`,
						body: { model, input: input.slice(start, start + BATCH_SIZE) },
						json: true,
					},
				)) as EmbeddingsResponse;
				const batch = [...response.data].sort((a, b) => a.index - b.index);
				vectors.push(...batch.map((item) => item.embedding));
			}
			return vectors;
		};

		const embeddings = {
			embedDocuments: async (documents: string[]) =>
				await loggedCall(this, NodeConnectionTypes.AiEmbedding, { documents }, async () =>
					await embed(documents),
				),
			embedQuery: async (query: string) =>
				await loggedCall(this, NodeConnectionTypes.AiEmbedding, { query }, async () => {
					const [vector] = await embed([query]);
					return vector;
				}),
		};

		return { response: embeddings };
	}
}
