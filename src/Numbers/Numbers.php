<?php
declare(strict_types=1);

namespace GutWP\Numbers;

final class Numbers {
    public static function clamp(int|float $value, int|float $min, int|float $max): int|float {
        return max($min, min($max, $value));
    }

    public static function between(int|float $value, int|float $min, int|float $max): bool {
        return $value >= $min && $value <= $max;
    }

    public static function inRange(int|float $value, int|float $min, int|float $max): bool {
        return self::between($value, $min, $max);
    }

    public static function roundTo(int|float $value, int $precision = 0): float {
        return round((float) $value, $precision);
    }

    public static function isFinite(mixed $value): bool {
        return (is_int($value) || is_float($value)) && !is_nan((float) $value) && !is_infinite((float) $value);
    }

    public static function sum(array $values): int|float {
        return array_sum($values);
    }
}