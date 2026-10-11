import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class GreenPtApi implements ICredentialType {
	name = 'greenPtApi';

	displayName = 'GreenPT API';

	icon: Icon = { light: 'file:../icons/greenpt.svg', dark: 'file:../icons/greenpt.svg' };

	documentationUrl = 'https://docs.greenpt.ai/get-started';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Create a key at https://account.greenpt.ai/api/keys',
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'string',
			default: 'https://api.greenpt.ai/v1',
			description: 'Use https://api.us.greenpt.ai/v1 to keep requests in the US region',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/models',
		},
	};
}
