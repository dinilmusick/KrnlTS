export function executeStep(symbol: string) {
  const base = symbol.includes('BTC') ? 64500 : 3450;
  const spread = base * 0.0002;
  return {
    symbol,
    bid: base - spread / 2,
    ask: base + spread / 2,
    spread
  };
}
