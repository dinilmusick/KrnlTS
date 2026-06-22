export const stockTickerAtom = {
  id: "stockTicker",
  method: "POST",
  visibility: "public",
  initialState: {
    symbol: "KRNL",
    price: 150.00
  },
  emitters: {
    "state:changed": {}
  },
  onMount: ({ state, functionality }) => {
    functionality._tickerInterval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 5;
      state.price = parseFloat((state.price + delta).toFixed(2));
    }, 2000);
  },
  onTeardown: ({ functionality }) => {
    if (functionality._tickerInterval) {
      clearInterval(functionality._tickerInterval);
    }
  },
  api: async (input, context) => {
    return { symbol: context.state.symbol, price: context.state.price };
  }
};

export default stockTickerAtom;
