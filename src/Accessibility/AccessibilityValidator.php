<?php
declare(strict_types=1);

namespace FrnlWP\Accessibility;

final class AccessibilityValidator {
    /**
     * @param array{role?: string, nameRequired?: bool, requiredAttributes?: string[], focusable?: bool} $contract
     * @param array<string, mixed> $attributes
     * @return array<int, array{code: string, message: string}>
     */
    public static function validate(array $contract, array $attributes): array {
        $issues = [];

        if (!empty($contract['nameRequired'])) {
            $ariaLabel = isset($attributes['aria-label']) && is_string($attributes['aria-label']) ? trim($attributes['aria-label']) : '';
            $ariaLabelledBy = isset($attributes['aria-labelledby']) && is_string($attributes['aria-labelledby']) ? trim($attributes['aria-labelledby']) : '';

            if ($ariaLabel === '' && $ariaLabelledBy === '') {
                $issues[] = [
                    'code' => 'ACCESSIBLE_NAME_REQUIRED',
                    'message' => 'An accessible name is required via aria-label or aria-labelledby.',
                ];
            }
        }

        foreach ($contract['requiredAttributes'] ?? [] as $attr) {
            if (!array_key_exists($attr, $attributes) || $attributes[$attr] === null || $attributes[$attr] === '') {
                $issues[] = [
                    'code' => 'REQUIRED_ATTRIBUTE_MISSING',
                    'message' => "Missing required attribute: $attr",
                ];
            }
        }

        if (isset($contract['role']) && (!isset($attributes['role']) || $attributes['role'] !== $contract['role'])) {
            $received = isset($attributes['role']) ? (string) $attributes['role'] : 'none';
            $issues[] = [
                'code' => 'ROLE_MISMATCH',
                'message' => "Expected role '{$contract['role']}', received '{$received}'",
            ];
        }

        if (!empty($contract['focusable'])) {
            $tabIndex = $attributes['tabindex'] ?? $attributes['tabIndex'] ?? null;
            $ariaHidden = $attributes['aria-hidden'] ?? false;
            if ($tabIndex === -1 || $tabIndex === '-1' || $ariaHidden === true || $ariaHidden === 'true') {
                $issues[] = [
                    'code' => 'FOCUS_RESTRICTED',
                    'message' => 'Element is marked as focusable but focus is suppressed via tabIndex or aria-hidden.',
                ];
            }
        }

        return $issues;
    }
}
