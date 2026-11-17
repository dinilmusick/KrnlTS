---
name: data-integrity-guidelines
description: Directives for data integrity, zero mock data, real backend integrations, explicit error rendering, and AI provider constraints.
---

# DATA INTEGRITY GUIDELINES

$$\begin{array}{ll}
\mathbf{D_1} \text{ (Anti-Mock Law)} & \text{DataSources} \cap \{\text{mock\_json}, \text{synthetic\_records}, \text{hardcoded\_arrays}, \text{stubbed\_resolvers}\} = \emptyset \\
\mathbf{D_2} \text{ (Authentic Drivers)} & \forall v \in \text{RenderedUI}: \text{Source}(v) \in \{\text{real\_backend\_call}, \text{real\_db\_record}, \text{real\_endpoint}\} \\
\mathbf{D_3} \text{ (Explicit Failures)} & (\text{data} = \emptyset \vee \text{error}) \implies \text{Render}(\langle\text{EmptyState} \mid \text{ErrorAlert}\rangle) \wedge \neg\text{Render}(\text{Placeholder}) \\
\mathbf{D_4} \text{ (AI Models)} & \text{InitModel}(m) \implies m = \text{UserRequestedProvider} \quad (\text{Never default to Gemini})
\end{array}$$
