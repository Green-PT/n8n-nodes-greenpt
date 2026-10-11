import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

export type ModelType = 'LLM' | 'EMBEDDINGS' | 'RERANK' | 'STT';

type PricingResponse = {
	data: Array<{ id: string; type: string }>;
};

// Output-style and unfiltered variants of a base chat model; still callable by typing the ID.
const CHAT_VARIANT = /-(raw|caveman|honey|ponytail)(-lite|-ultra)?$/;

export async function loadModels(
	this: ILoadOptionsFunctions,
	type: ModelType,
): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('greenPtApi');
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'greenPtApi', {
		method: 'GET',
		url: `${credentials.url as string}/pricing`,
		json: true,
	})) as PricingResponse;

	return response.data
		.filter((model) => model.type === type)
		.filter((model) => type !== 'LLM' || !CHAT_VARIANT.test(model.id))
		.map((model) => ({ name: model.id, value: model.id }))
		.sort((a, b) => a.name.localeCompare(b.name));
}
