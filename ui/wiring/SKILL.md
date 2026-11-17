---
name: ui-wiring-guidelines
description: Directives for UI functional binding, backend wiring verification, zero UI stubs, and input buffer contracts.
---

# UI WIRING & LOGIC BINDING GUIDELINES

## 1. FUNCTIONAL BINDING & ANTI-STUB INVARIANTS

$$\forall el \in \text{InteractiveUI}: \text{Status}(el) = \text{Done} \iff \exists h \in \text{Handlers}(el): h \xrightarrow{\text{invokes}} \text{RealDriver} \wedge h \notin \{\emptyset, \text{no-op}, \text{alert}, \text{console.log}\}$$

$$\begin{array}{ll}
\mathbf{W_1} \text{ (Reactive Push)} & \text{UpdateUI} \in \{\text{SSE}, \text{WebSocket}, \text{Store.subscribe}\} \wedge \text{UpdateUI} \cap \{\text{setInterval}, \text{onTick}\} = \emptyset \\
\mathbf{W_2} \text{ (Input Buffering)} & \forall inp \in \text{Inputs}: \text{AllowEmptyDuringTyping}(inp) = \text{true} \wedge \text{CommitFallbackOnlyOnBlur}(inp)
\end{array}$$

## 2. BUFFERED EDITING COMPONENT PATTERN

```tsx
// Anti-Lockout Pattern: Local buffered text, commit/fallback strictly on blur
export const BufferedNumberInput = ({ value, defaultValue = 0, onChange }: NumberProps) => {
  const [text, setText] = useState(String(value ?? ""));
  useEffect(() => setText(String(value ?? "")), [value]);

  return (
    <Input
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        setText(e.target.value); // Allow "" mid-typing without snapping to 0
        if (e.target.value.trim() !== "" && !isNaN(Number(e.target.value))) onChange(Number(e.target.value));
      }}
      onBlur={() => {
        if (text.trim() === "" || isNaN(Number(text))) {
          setText(String(defaultValue));
          onChange(defaultValue);
        }
      }}
    />
  );
};
```
