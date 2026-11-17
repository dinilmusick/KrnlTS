<?php
namespace GutWP\Collections;
final class Collections {
    public static function map(array $items,callable $fn):array{return array_map($fn,$items);}
    public static function filter(array $items,callable $fn):array{return array_values(array_filter($items,$fn));}
    public static function keyBy(array $items,callable $fn):array{$out=[];foreach($items as $item)$out[(string)$fn($item)]=$item;return $out;}
    public static function groupBy(array $items,callable $fn):array{$out=[];foreach($items as $item){$key=(string)$fn($item);$out[$key][]=$item;}return $out;}
}