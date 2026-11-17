<?php
namespace GutWP\Json;

final class Json {
    public static function encode(mixed $value): string { return wp_json_encode($value,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) ?: 'null'; }
    public static function decode(string $json,mixed $default=null): mixed {
        $value=json_decode($json,true);
        return json_last_error()===JSON_ERROR_NONE?$value:$default;
    }
}