# @greenpt/n8n-nodes-greenpt

This is an n8n community node. It lets you use [GreenPT](https://greenpt.ai) chat models in your n8n AI agents and chains.

GreenPT is a sustainable AI platform that serves open-weight models through an OpenAI-compatible API, hosted in Europe, with a US region available.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Nodes](#nodes)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation and install `@greenpt/n8n-nodes-greenpt`.

## Nodes

**GreenPT Chat Model** is a language model sub-node. Connect it to the **Chat Model** input of an AI Agent, Basic LLM Chain, or any other node that takes a chat model.

| Parameter | Description |
| --- | --- |
| Model | A GreenPT chat model, loaded from your account's region. Defaults to `glm-5.3`. |
| Maximum Number of Tokens | Upper limit on generated tokens. Reasoning models spend part of this budget on thinking. |
| Max Retries | Retries after a failed request. |
| Sampling Temperature | Randomness of the output, from 0 to 2. |
| Timeout | Request timeout in milliseconds. |
| Top P | Nucleus sampling. Change this or temperature, not both. |

## Credentials

1. Create a GreenPT account at [account.greenpt.ai](https://account.greenpt.ai/onboarding/signup). Every plan includes API access.
2. Create an API key at [account.greenpt.ai/api/keys](https://account.greenpt.ai/api/keys).
3. In n8n, create a **GreenPT API** credential and paste the key.

Leave **Base URL** at `https://api.greenpt.ai/v1`, or set it to `https://api.us.greenpt.ai/v1` to keep requests in the US region.

## Compatibility

Tested with n8n 2.42.6.

## Usage

The node calls GreenPT's Chat Completions endpoint, so tool calling works with the AI Agent node. You can also set the model with an expression, for example to pick a model per item.

## Resources

* [GreenPT documentation](https://docs.greenpt.ai)
* [Model cards](https://docs.greenpt.ai/model-cards)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
