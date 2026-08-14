/**
 * @file register.js
 * @description Storefront Sub-App registration entry for Krnl.
 */

export function register(context) {
  context.logger.log(`[StorefrontApp] Registering on host entity: ${context.entity.id}`);

  return {
    name: 'StorefrontApp',
    operations: [
      {
        name: 'calculateCart',
        description: 'Calculates cart items subtotal, tax, and discount',
        input: (val) => Array.isArray(val?.items) && val.items.length > 0,
        handler: async (input, ctx) => {
          const subtotal = input.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          const discount = input.couponCode === 'SAVE20' ? subtotal * 0.2 : 0;
          const discountedSubtotal = subtotal - discount;
          const tax = discountedSubtotal * 0.08;
          const total = discountedSubtotal + tax;

          return {
            customerId: input.customerId,
            itemsCount: input.items.length,
            subtotal,
            discount,
            tax,
            total: Math.round(total * 100) / 100,
            currency: 'USD'
          };
        }
      },
      {
        name: 'placeOrder',
        description: 'Places a customer order',
        handler: async (input, ctx) => {
          const orderId = `ORD-${Date.now()}`;
          return {
            orderId,
            customerId: input.customerId || 'cust_guest',
            total: input.total,
            status: 'PLACED',
            placedAt: Date.now()
          };
        }
      }
    ],
    ui: {
      title: 'Storefront & Products Portal',
      entryPath: './src/ui/App.jsx'
    },
    onInitialize: async (ctx) => {
      ctx.logger.log('[StorefrontApp] Initialized successfully.');
    }
  };
}

export default register;
