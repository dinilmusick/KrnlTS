<?php
declare(strict_types=1);

namespace GutWP;

use GutWP\Arrays\Arrays as BaseArrays;

final class Arrays {
    public static function isList(array $value): bool { return BaseArrays::isList($value); }
    public static function first(array $value, mixed $default = null): mixed { return BaseArrays::first($value, $default); }
    public static function last(array $value, mixed $default = null): mixed { return BaseArrays::last($value, $default); }
    public static function get(array $value, string|int $key, mixed $default = null): mixed { return BaseArrays::get($value, $key, $default); }
    public static function compact(array $values): array { return BaseArrays::compact($values); }
    public static function unique(array $values): array { return BaseArrays::unique($values); }
    public static function chunk(array $values, int $size): array { return BaseArrays::chunk($values, $size); }
    public static function flatten(array $values): array { return BaseArrays::flatten($values); }
}
