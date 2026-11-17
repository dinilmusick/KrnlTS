<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class Functions {
    public static function map(array $items,callable $fn):array{return array_map($fn,$items);}
    public static function filter(array $items,callable $fn):array{return array_values(array_filter($items,$fn));}
    public static function reduce(array $items,callable $fn,mixed $initial=null):mixed{return array_reduce($items,$fn,$initial);}
}