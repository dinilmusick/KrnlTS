<?php
declare(strict_types=1);

namespace GutWP\Strings;

use Symfony\Component\String\Slugger\AsciiSlugger;

final class Strings {
    public static function isBlank(?string $value): bool {
        return $value === null || trim($value) === '';
    }

    public static function isNonBlank(?string $value): bool {
        return !self::isBlank($value);
    }

    public static function isEmail(string $value): bool {
        return (bool) filter_var($value, FILTER_VALIDATE_EMAIL);
    }

    public static function startsWith(string $value, string $prefix): bool {
        return str_starts_with($value, $prefix);
    }

    public static function startsWithAny(string $value, array $prefixes): bool {
        foreach ($prefixes as $p) {
            if (str_starts_with($value, (string) $p)) return true;
        }
        return false;
    }

    public static function endsWith(string $value, string $suffix): bool {
        return str_ends_with($value, $suffix);
    }

    public static function endsWithAny(string $value, array $suffixes): bool {
        foreach ($suffixes as $s) {
            if (str_ends_with($value, (string) $s)) return true;
        }
        return false;
    }

    public static function slug(string $value): string {
        return (new AsciiSlugger())->slug($value)->lower()->toString();
    }

    public static function capitalize(string $value): string {
        return ucfirst($value);
    }

    public static function camelCase(string $value): string {
        $clean = preg_replace('/[^a-zA-Z0-9]+/', ' ', $value) ?? '';
        return lcfirst(str_replace(' ', '', ucwords(trim($clean))));
    }

    public static function kebabCase(string $value): string {
        $value = preg_replace('/([a-z\d])([A-Z])/', '$1-$2', $value) ?? $value;
        return strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $value), '-'));
    }

    public static function snakeCase(string $value): string {
        $value = preg_replace('/([a-z\d])([A-Z])/', '$1_$2', $value) ?? $value;
        return strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '_', $value), '_'));
    }

    public static function truncate(string $value, int $length, string $ellipsis = '...'): string {
        if (mb_strlen($value) <= $length) return $value;
        return mb_substr($value, 0, max(0, $length - mb_strlen($ellipsis))) . $ellipsis;
    }

    public static function truncateWords(string $value, int $maxWords, string $ellipsis = '...'): string {
        $words = preg_split('/\s+/', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($words) <= $maxWords) return $value;
        return implode(' ', array_slice($words, 0, $maxWords)) . $ellipsis;
    }
}