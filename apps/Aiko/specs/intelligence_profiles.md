### 1. The 15 Intelligence Parameters (`intelligenceSpec`)

Every model entry and incoming request endpoint provides a vector of scalar values (typically 0.0 to 10.0) across these **15 core dimensions**:

| Parameter | Description / Target Focus |
| :--- | :--- |
| `reasoning` | High-level logical deduction, math, multi-step problem solving. |
| `planning` | Task breakdown, orchestration, and sequential goal execution. |
| `toolUsage` | Tool/Function calling fidelity and multi-tool routing capability. |
| `structuredOutput` | Ability to adhere to exact structural constraints. |
| `jsonStrictness` | Strict JSON schema compliance and parsing reliability. |
| `coding` | Software engineering, code generation, refactoring, and syntactical accuracy. |
| `extraction` | Entity recognition, schema extraction, parsing structured data out of raw text. |
| `classification` | Categorization, sentiment analysis, and intent classification. |
| `summarization` | Text distillation, key point extraction, and contextual compression. |
| `creativity` | Generative variety, open-ended writing, story generation. |
| `determinism` | Consistency across identical inputs / low variance requirement. |
| `context` | Efficient utilization and recall capacity over large context windows. |
| `vision` | Visual input parsing, chart evaluation, and image processing. |
| `multimodal` | Cross-modality understanding (audio, image, document fusion). |
| `outputComplexity` | Ability to generate long-form, dense, and deeply nested outputs. |

---

### 2. How Model Grading & Routing Works

The `MatchingEngine.rank()` algorithm evaluates candidates against the requested `endpointSpec` in **4 stages**:

#### Step 1: Base Dimension Weighting
Dimensions default to a weight factor of `1.0`. Request preferences can adjust weights:
- **`prioritiseReasoning`**: Doubles weight on `reasoning` (`2.0`) and boosts `planning` (`1.5`).
- **`prioritiseDeterminism`**: Doubles weight on `determinism` (`2.0`) and boosts `jsonStrictness` (`1.5`).

#### Step 2: Weighted Distance & Under-specification Penalty
The distance calculation compares requested values ($\text{targetVal}$) against model capabilities ($\text{modelVal}$):
$$\text{diff} = \text{targetVal} - \text{modelVal}$$

- **Asymmetric Penalty**: If the model falls short of the target capability ($\text{diff} > 0$), an under-specification multiplier of **$1.5\times$** is applied to penalty-weight that dimension.
- **Weighted Distance**:
$$\text{distance} = \sqrt{\frac{\sum \text{weight} \cdot (\text{diff} \cdot \text{multiplier})^2}{\sum \text{weight}}}$$
- **Base Score**: Scaled onto a $0 - 100$ scale:
$$\text{baseScore} = \text{clamp}(100 - (\text{distance} \cdot 10),\, 0,\, 100)$$

#### Step 3: Dynamic Runtime Downranking
- If orchestrators report failures against a model, its `runtimeStats.downrankCount` increases.
- **Penalty**: Subtractions of **5 points per downrank count** from the score (`score = baseScore - (downrankCount * 5)`).

#### Step 4: Provider Preferences & Filtering
- **Local Preference (`preferLocal`)**: Adds **+10 points** if provider is `MerLocal`.
- **Cost Minimization (`avoidPaidProviders`)**: Subtracts **15 points** if provider is `MerOpenRouter`.
- **Blacklisting (`blacklistedProviders`)**: Filters out models from blacklisted providers entirely before sorting.

---

### Final Selection
Candidates are filtered, ranked in descending order by final score, and the model with the highest matching score is selected to serve the request.