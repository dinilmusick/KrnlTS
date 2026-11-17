<?php
declare(strict_types=1);

namespace GutWP\Api;

use GutWP\Arrays\Arrays;
use GutWP\Strings\Strings;
use GutWP\Numbers\Numbers;
use GutWP\Objects\Objects;
use GutWP\Urls\Urls;
use GutWP\Json\Json;

final class FodRuntime {
    public static function executeGutApi(string $apiId, array $input): mixed {
        $api = ApiRegistry::get($apiId);
        $name = $api->name;

        return match ($name) {
            'compact'       => Arrays::compact($input['values'] ?? []),
            'unique'        => Arrays::unique($input['values'] ?? []),
            'chunk'         => Arrays::chunk($input['values'] ?? [], (int) ($input['size'] ?? 1)),
            'flatten'       => Arrays::flatten($input['values'] ?? []),
            'last'          => Arrays::last($input['values'] ?? []),
            'first'         => Arrays::first($input['values'] ?? []),
            'isBlank'       => Strings::isBlank($input['value'] ?? null),
            'isEmail'       => Strings::isEmail((string) ($input['value'] ?? '')),
            'capitalize'    => Strings::capitalize((string) ($input['value'] ?? '')),
            'camelCase'     => Strings::camelCase((string) ($input['value'] ?? '')),
            'kebabCase'     => Strings::kebabCase((string) ($input['value'] ?? '')),
            'snakeCase'     => Strings::snakeCase((string) ($input['value'] ?? '')),
            'truncate'      => Strings::truncate((string) ($input['value'] ?? ''), (int) ($input['length'] ?? 100)),
            'clamp'         => Numbers::clamp($input['value'] ?? 0, $input['min'] ?? 0, $input['max'] ?? 100),
            'between'       => Numbers::between($input['value'] ?? 0, $input['min'] ?? 0, $input['max'] ?? 100),
            'roundTo'       => Numbers::roundTo($input['value'] ?? 0, (int) ($input['precision'] ?? 0)),
            'sum'           => Numbers::sum($input['values'] ?? []),
            'pick'          => Objects::pick($input['value'] ?? [], $input['keys'] ?? []),
            'omit'          => Objects::omit($input['value'] ?? [], $input['keys'] ?? []),
            'isUrl'         => Urls::isUrl((string) ($input['value'] ?? '')),
            'joinUrl'       => Urls::joinUrl((string) ($input['base'] ?? ''), ...((array) ($input['paths'] ?? []))),
            'encode'        => Json::encode($input['value'] ?? null),
            'decode'        => Json::decode((string) ($input['json'] ?? '{}')),
            default         => throw new \RuntimeException("GutWP API '$apiId' has metadata but no embedded runtime executor."),
        };
    }
}
