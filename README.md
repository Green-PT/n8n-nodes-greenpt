# @greenpt/n8n-nodes-greenpt

This is an n8n community node package. It lets you use [GreenPT](https://greenpt.ai) chat, embedding, reranking and speech-to-text models in your n8n workflows, AI agents and chains.

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

| Node | Type | Use it for |
| --- | --- | --- |
| **GreenPT Chat Model** | Chat model sub-node | The **Chat Model** input of an AI Agent, Basic LLM Chain or other AI root node |
| **Embeddings GreenPT** | Embeddings sub-node | The **Embedding** input of a vector store, to insert and to query documents |
| **Reranker GreenPT** | Reranker sub-node | The **Reranker** input of a vector store with **Rerank Results** turned on |
| **GreenPT** | Action node, also usable as an AI Agent tool | **Create Embedding**, **Rerank Documents** and **Transcribe Audio** |

Every model list loads live from the region set in your credential, so new GreenPT models appear without updating the package. The chat model list leaves out style variants (`-caveman`, `-honey`, `-ponytail` and their `-lite`/`-ultra` levels) and `-raw` models; select **Expression** and type the ID to use one.

### GreenPT Chat Model

| Parameter | Description |
| --- | --- |
| Model | A GreenPT chat model. Defaults to `glm-5.3`. |
| Maximum Number of Tokens | Upper limit on generated tokens. Reasoning models spend part of this budget on thinking. |
| Max Retries | Retries after a failed request. |
| Sampling Temperature | Randomness of the output, from 0 to 2. |
| Timeout | Request timeout in milliseconds. |
| Top P | Nucleus sampling. Change this or temperature, not both. |

### Embeddings GreenPT

Defaults to `green-embedding`. Use the same embedding model to insert documents and to query them.

### Reranker GreenPT

Defaults to `green-rerank`. **Top N** sets how many documents the vector store returns after reranking; each keeps its `relevanceScore` in its metadata.

### GreenPT

| Operation | Input | Output |
| --- | --- | --- |
| Create Embedding | Text | `embedding`, `model`, `usage` |
| Rerank Documents | Query, a JSON array of document texts, Top N | One item per document: `index`, `relevanceScore`, `document` |
| Transcribe Audio | An audio file in a binary field, language code; options to identify speakers, punctuate and smart-format | `transcript`, `confidence`, `duration`, `words` |

## Credentials

1. Create a GreenPT account at [account.greenpt.ai](https://account.greenpt.ai/onboarding/signup). Every plan includes API access.
2. Create an API key at [account.greenpt.ai/api/keys](https://account.greenpt.ai/api/keys).
3. In n8n, create a **GreenPT API** credential and paste the key.

Leave **Base URL** at `https://api.greenpt.ai/v1`, or set it to `https://api.us.greenpt.ai/v1` to keep requests in the US region.

## Compatibility

Tested with n8n 2.42.6.

## Usage

The chat model calls GreenPT's Chat Completions endpoint, so tool calling works with the AI Agent node. You can also set any model with an expression, for example to pick a model per item.

## Resources

* [GreenPT documentation](https://docs.greenpt.ai)
* [Model cards](https://docs.greenpt.ai/model-cards)
* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
