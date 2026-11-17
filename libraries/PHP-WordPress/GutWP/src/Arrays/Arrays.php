<?php
declare(strict_types=1);

namespace GutWP\Arrays;

final class Arrays {
    public static function isList(array $value): bool {
        return array_is_list($value);
    }

    public static function first(array $value, mixed $default = null): mixed {
        if (empty($value)) return $default;
        return $value[array_key_first($value)];
    }

    public static function last(array $value, mixed $default = null): mixed {
        if (empty($value)) return $default;
        return $value[array_key_last($value)];
    }

    public static function get(array $value, string|int $key, mixed $default = null): mixed {
        return $value[$key] ?? $default;
    }

    public static function compact(array $values): array {
        return array_values(array_filter($values, static fn($v) => $v !== null));
    }

    public static function unique(array $values): array {
        return array_values(array_unique($values, SORT_REGULAR));
    }

    public static function chunk(array $values, int $size): array {
        if ($size <= 0) {
            throw new \RangeError('size must be a positive integer');
        }
        return array_chunk($values, $size);
    }

    public static function flatten(array $values): array {
        if (empty($values)) return [];
        $out = [];
        foreach ($values as $item) {
            if (is_array($item)) {
                foreach ($item as $sub) $out[] = $sub;
            } else {
                $out[] = $item;
            }
        }
        return $out;
    }
}