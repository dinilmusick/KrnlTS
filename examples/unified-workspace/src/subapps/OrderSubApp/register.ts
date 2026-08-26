export function register(context: any) {
  context.logger?.log('Registering OrderSubApp in Unified Workspace');
  return {
    name: 'OrderSubApp',
    operations: [
      {
        name: 'createOrder',
        description: 'Creates a new verified customer order',
        handler: async (input: any) => ({
          orderId: `ORD-${Date.now()}`,
          customerId: input.customerId || 'cust-101',
          status: 'VERIFIED'
        })
      }
    ]
  };
}
export default register;
