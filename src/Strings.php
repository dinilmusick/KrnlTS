<?php
declare(strict_types=1);

namespace GutWP;

use GutWP\Strings\Strings as BaseStrings;

final class Strings {
    public static function isBlank(?string $value): bool { return BaseStrings::isBlank($value); }
    public static function isNonBlank(?string $value): bool { return BaseStrings::isNonBlank($value); }
    public static function isNonEmpty(mixed $value): bool { return is_string($value) && BaseStrings::isNonBlank($value); }
    public static function isEmail(string $value): bool { return BaseStrings::isEmail($value); }
    public static function startsWith(string $value, string $prefix): bool { return BaseStrings::startsWith($value, $prefix); }
    public static function startsWithAny(string $value, array $prefixes): bool { return BaseStrings::startsWithAny($value, $prefixes); }
    public static function endsWith(string $value, string $suffix): bool { return BaseStrings::endsWith($value, $suffix); }
    public static function endsWithAny(string $value, array $suffixes): bool { return BaseStrings::endsWithAny($value, $suffixes); }
    public static function slug(string $value): string { return BaseStrings::slug($value); }
    public static function capitalize(string $value): string { return BaseStrings::capitalize($value); }
    public static function camelCase(string $value): string { return BaseStrings::camelCase($value); }
    public static function kebabCase(string $value): string { return BaseStrings::kebabCase($value); }
    public static function snakeCase(string $value): string { return BaseStrings::snakeCase($value); }
    public static function truncate(string $value, int $length, string $ellipsis = '...'): string { return BaseStrings::truncate($value, $length, $ellipsis); }
    public static function truncateWords(string $value, int $maxWords, string $ellipsis = '...'): string { return BaseStrings::truncateWords($value, $maxWords, $ellipsis); }
}
