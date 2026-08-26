export function register(context: any) {
  context.logger?.log('Registering OrderSubApp');
  return {
    name: 'OrderSubApp',
    operations: [
      {
        name: 'createOrder',
        description: 'Creates a new verified customer order',
        handler: async (input: any) => ({
          orderId: `ORD-${Date.now()}`,
          status: 'CONFIRMED'
        })
      }
    ]
  };
}
export default register;
