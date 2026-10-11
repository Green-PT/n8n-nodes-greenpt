import type { IDataObject, ISupplyDataFunctions, NodeConnectionType } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Records a sub-node call in the execution log, the way n8n's own sub-nodes do through
 * LangChain's logWrapper, so the node shows its input and output in the editor.
 */
export async function loggedCall<T>(
	ctx: ISupplyDataFunctions,
	connectionType: NodeConnectionType,
	input: IDataObject,
	call: () => Promise<T>,
): Promise<T> {
	const { index } = ctx.addInputData(connectionType, [[{ json: input }]]);
	try {
		const response = await call();
		ctx.addOutputData(connectionType, index, [[{ json: { response } as IDataObject }]]);
		return response;
	} catch (error) {
		const nodeError = new NodeOperationError(ctx.getNode(), error as Error);
		ctx.addOutputData(connectionType, index, nodeError);
		throw nodeError;
	}
}
