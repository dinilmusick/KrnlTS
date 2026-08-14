/**
 * @file register.js
 * @description Payment Gateway Sub-App registration entry for Krnl.
 */

export function register(context) {
  context.logger.log(`[PaymentApp] Registering on host entity: ${context.entity.id}`);

  return {
    name: 'PaymentApp',
    operations: [
      {
        name: 'chargeCard',
        description: 'Processes credit card charges securely',
        input: (val) => typeof val?.total === 'number' && val.total > 0,
        handler: async (input, ctx) => {
          const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          return {
            customerId: input.customerId,
            total: input.total,
            transactionId: txId,
            authorizedAmount: input.total,
            status: 'AUTHORIZED',
            authCode: 'AUTH_OK_9941',
            timestamp: Date.now()
          };
        }
      },
      {
        name: 'refund',
        description: 'Refunds a prior transaction',
        handler: async (input, ctx) => {
          return {
            refundId: `REF-${Date.now()}`,
            originalTransactionId: input.transactionId,
            status: 'REFUNDED'
          };
        }
      }
    ],
    ui: {
      title: 'Payment Gateway',
      entryPath: './src/ui/PaymentView.jsx'
    },
    onInitialize: async (ctx) => {
      ctx.logger.log('[PaymentApp] Initialized payment gateway handlers.');
    }
  };
}

export default register;
