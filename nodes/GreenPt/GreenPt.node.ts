import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { loadModels } from '../catalogue';
import { createEmbedding, rerankDocuments, transcribeAudio } from './operations';

const show = (operation: string) => ({ show: { operation: [operation] } });

export class GreenPt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GreenPT',
		name: 'greenPt',
		icon: { light: 'file:../../icons/greenpt.svg', dark: 'file:../../icons/greenpt.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"]}}',
		description: 'Create embeddings, rerank documents and transcribe audio with GreenPT',
		defaults: {
			name: 'GreenPT',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'greenPtApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'createEmbedding',
				options: [
					{
						name: 'Create Embedding',
						value: 'createEmbedding',
						action: 'Create an embedding',
						description: 'Turn text into a vector',
					},
					{
						name: 'Rerank Documents',
						value: 'rerank',
						action: 'Rerank documents',
						description: 'Order documents by relevance to a query',
					},
					{
						name: 'Transcribe Audio',
						value: 'transcribe',
						action: 'Transcribe audio',
						description: 'Turn speech in an audio file into text',
					},
				],
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getEmbeddingModels' },
				default: 'green-embedding',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: show('createEmbedding'),
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: { rows: 3 },
				required: true,
				default: '',
				description: 'The text to embed',
				displayOptions: show('createEmbedding'),
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getRerankModels' },
				default: 'green-rerank',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: show('rerank'),
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				description: 'The query to score the documents against',
				displayOptions: show('rerank'),
			},
			{
				displayName: 'Documents',
				name: 'documents',
				type: 'json',
				required: true,
				default: '["First document", "Second document"]',
				description: 'A JSON array of document texts',
				displayOptions: show('rerank'),
			},
			{
				displayName: 'Top N',
				name: 'topN',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 3,
				description: 'The maximum number of documents to return',
				displayOptions: show('rerank'),
			},
			{
				displayName: 'Model Name or ID',
				name: 'model',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getSpeechModels' },
				default: 'green-s',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: show('transcribe'),
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				default: 'data',
				hint: 'The name of the input binary field containing the audio file',
				displayOptions: show('transcribe'),
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'en',
				description: 'Language code of the speech, for example en, nl, de or fr',
				displayOptions: show('transcribe'),
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: show('transcribe'),
				options: [
					{
						displayName: 'Identify Speakers',
						name: 'diarize',
						type: 'boolean',
						default: false,
						description: 'Whether to label each word with the speaker who said it',
					},
					{
						displayName: 'Punctuate',
						name: 'punctuate',
						type: 'boolean',
						default: true,
						description: 'Whether to add punctuation and capitalisation',
					},
					{
						displayName: 'Smart Format',
						name: 'smartFormat',
						type: 'boolean',
						default: false,
						description: 'Whether to format numbers, dates and similar for readability',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getEmbeddingModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadModels.call(this, 'EMBEDDINGS');
			},
			async getRerankModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadModels.call(this, 'RERANK');
			},
			async getSpeechModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await loadModels.call(this, 'STT');
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const run = { createEmbedding, rerank: rerankDocuments, transcribe: transcribeAudio }[
			operation
		];
		if (!run) {
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

		const returnData: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < this.getInputData().length; itemIndex++) {
			try {
				returnData.push(...(await run.call(this, itemIndex)));
			} catch (error) {
				if (!this.continueOnFail()) {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
				}
				returnData.push({
					json: { error: (error as Error).message },
					pairedItem: { item: itemIndex },
				});
			}
		}
		return [returnData];
	}
}
