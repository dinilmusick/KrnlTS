<?php

declare(strict_types=1);

namespace FloksWP\Theme;

/**
 * Maps semantic tokens to CSS custom property stylesheets.
 */
class TokenMapper
{
    public static function toCssVariables(array $tokens, string $prefix = 'floks-'): string
    {
        $css = ":root {\n";
        foreach ($tokens as $group => $values) {
            if (is_array($values)) {
                foreach ($values as $key => $val) {
                    if (is_scalar($val)) {
                        $css .= sprintf("  --%s%s-%s: %s;\n", $prefix, $group, $key, (string)$val);
                    }
                }
            } elseif (is_scalar($values)) {
                $css .= sprintf("  --%s%s: %s;\n", $prefix, $group, (string)$values);
            }
        }
        $css .= "}\n";
        return $css;
    }
}
