---
name: ui-wiring-guidelines
description: Directives for UI functional binding, backend wiring verification, zero UI stubs, and unit/integration testing per interactive component.
---

# UI WIRING & LOGIC BINDING GUIDELINES

## 1. FUNCTIONAL LOGIC BINDING REQUIREMENT
```
∀ element ∈ UI_Interactive_Elements:
  status(element) = DONE ⟺ ∃ logic(element) ∧ logic(element) == REAL_BACKEND_CALL

FORBID: UI_stubs without working backend wiring.
REQUIRE: Every button, input, toggle, or interactive control must execute a functional backend pipeline before considered complete.
```

---

## 2. VERIFICATION & TESTING PROTOCOL
```
function verifyInteractiveElement(element):
    assert hasBinding(element.onClick | element.onChange)
    assert notIsPlaceholder(element.handler)
    runIntegrationTest(element, assertBackendPayloadDispatched)
```
- **Mandatory**: Unit / Integration test per interactive component verifying active logic dispatch, not just DOM rendering.

---

## 3. EVENT-DRIVEN UI REACTIVITY (ANTI-POLLING & ANTI-ON-TICK)
```
∀ ui_component ∈ UI_Components:
  update_trigger(ui_component) ≡ EVENT_LISTENER ∨ REACTIVE_SUBSCRIPTION
  FORBID: setInterval() polling to fetch fresh state.
  FORBID: continuous onTick / requestAnimationFrame loops while idle.
```
- **Push over Pull**: UI components must subscribe to WebSocket events, Server-Sent Events (SSE), or reactive state store listeners (`useStore.subscribe`, `entity.on()`).
- **Zero Idle CPU**: Rendering occurs reactively upon incoming event dispatch, keeping background idle CPU utilization at 0%.
- **Polling Prohibition**: Never use timers to poll backend endpoints for updates unless no push mechanism exists (and if so, use user-initiated refresh or backoff).

---

## 4. PROFESSIONAL INPUT FIELD EMPTY-STATE & EDITING INVARIANT
```
∀ input_field ∈ UI_Form_And_Input_Controls:
  during_active_typing(input_field):
    allow_empty_value(input_field) ≡ TRUE (Never force-coerce "" to 0 or snap to placeholder while typing)
  
  on_blur_or_submit(input_field):
    if is_empty(input_field.value) ∧ is_required(input_field):
      step_1_feedback : Display clear validation error ("Field cannot be empty")
      step_2_fallback : Gracefully revert to fallback/default value only after blur/ignored
```

### 4.1 Prohibited Glitchy Anti-Patterns:
- ❌ **Immediate Numeric Coercion**: `onChange={(e) => setValue(Number(e.target.value))}` (evaluates `Number("")` to `0`, locking the user into `0` and forbidding clearing the field).
- ❌ **Mid-Typing Auto-Fill**: `onChange={(e) => setValue(e.target.value || defaultVal)}` (snaps back to placeholder mid-keystroke when backspacing).
- ❌ **Input Lockout**: Forcing controlled re-renders that overwrite intermediate empty string inputs.

### 4.2 Required Implementation Pattern (Buffered Editing State):
```tsx
// ✅ CORRECT: Buffer local editing string, validate and commit on blur
export function NumberInput({ value, defaultValue = 0, onChange, required = true }: InputProps) {
  const [localText, setLocalText] = useState(String(value ?? ""));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalText(String(value ?? ""));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw); // Always allow empty string during active typing
    setError(null);
    if (raw.trim() !== "" && !isNaN(Number(raw))) {
      onChange(Number(raw));
    }
  };

  const handleBlur = () => {
    if (localText.trim() === "") {
      if (required) {
        setError("Field cannot be empty");
        setLocalText(String(defaultValue)); // Fallback only on blur
        onChange(defaultValue);
      }
    } else if (isNaN(Number(localText))) {
      setError("Invalid number format");
      setLocalText(String(defaultValue));
      onChange(defaultValue);
    } else {
      setError(null);
      onChange(Number(localText));
    }
  };

  return (
    <div className="input-control">
      <input
        type="text"
        inputMode="numeric"
        value={localText}
        onChange={handleChange}
        onBlur={handleBlur}
        className={error ? "border-error" : ""}
      />
      {error && <span className="field-error-badge">{error}</span>}
    </div>
  );
}
```
