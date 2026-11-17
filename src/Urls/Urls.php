<?php
declare(strict_types=1);

namespace GutWP\Urls;

use League\Uri\Uri;

final class Urls {
    public static function parse(string $url): array {
        $uri = Uri::new($url);
        return [
            'scheme' => $uri->getScheme(),
            'host'   => $uri->getHost(),
            'path'   => $uri->getPath(),
            'query'  => $uri->getQuery(),
        ];
    }

    public static function isAbsolute(string $url): bool {
        return Uri::new($url)->getHost() !== null;
    }

    public static function isUrl(string $url): bool {
        return (bool) filter_var($url, FILTER_VALIDATE_URL);
    }

    public static function joinUrl(string $base, string ...$paths): string {
        $cleanBase = rtrim($base, '/');
        $segments = [];
        foreach ($paths as $p) {
            $trimmed = trim($p, '/');
            if ($trimmed !== '') $segments[] = $trimmed;
        }
        return empty($segments) ? $cleanBase : $cleanBase . '/' . implode('/', $segments);
    }

    public static function getQueryParam(string $url, string $param): ?string {
        $query = parse_url($url, PHP_URL_QUERY);
        if (!$query) return null;
        parse_str($query, $params);
        return isset($params[$param]) ? (string) $params[$param] : null;
    }

    public static function setQueryParam(string $url, string $param, string|int|float $value): string {
        $parts = parse_url($url);
        $params = [];
        if (isset($parts['query'])) {
            parse_str($parts['query'], $params);
        }
        $params[$param] = (string) $value;
        $newQuery = http_build_query($params);

        $scheme   = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
        $host     = $parts['host'] ?? '';
        $port     = isset($parts['port']) ? ':' . $parts['port'] : '';
        $path     = $parts['path'] ?? '';
        $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

        return $scheme . $host . $port . $path . '?' . $newQuery . $fragment;
    }
}