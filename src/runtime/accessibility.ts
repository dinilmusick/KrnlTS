export interface AccessibilityContract {
  readonly role?: string;
  readonly nameRequired?: boolean;
  readonly keyboard?: readonly string[];
  readonly focusable?: boolean;
  readonly requiredAttributes?: readonly string[];
  readonly providedSemantics?: readonly string[];
}

export interface AccessibilityIssue {
  readonly code: string;
  readonly message: string;
}

export function validateAccessibility(
  contract: AccessibilityContract,
  attributes: Record<string, unknown>
): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  if (contract.nameRequired) {
    const hasLabel =
      typeof attributes['aria-label'] === 'string' && attributes['aria-label'].trim().length > 0;
    const hasLabelledBy =
      typeof attributes['aria-labelledby'] === 'string' &&
      attributes['aria-labelledby'].trim().length > 0;

    if (!hasLabel && !hasLabelledBy) {
      issues.push({
        code: 'ACCESSIBLE_NAME_REQUIRED',
        message: 'An accessible name is required via aria-label or aria-labelledby.',
      });
    }
  }

  for (const attr of contract.requiredAttributes ?? []) {
    if (
      !(attr in attributes) ||
      attributes[attr] === undefined ||
      attributes[attr] === null ||
      attributes[attr] === ''
    ) {
      issues.push({
        code: 'REQUIRED_ATTRIBUTE_MISSING',
        message: `Missing required attribute: ${attr}`,
      });
    }
  }

  if (contract.role && attributes.role !== contract.role) {
    issues.push({
      code: 'ROLE_MISMATCH',
      message: `Expected role '${contract.role}', received '${String(attributes.role)}'`,
    });
  }

  if (contract.focusable) {
    if (attributes.tabIndex === -1 || attributes['aria-hidden'] === true) {
      issues.push({
        code: 'FOCUS_RESTRICTED',
        message: 'Element is marked as focusable but focus is suppressed via tabIndex or aria-hidden.',
      });
    }
  }

  return issues;
}