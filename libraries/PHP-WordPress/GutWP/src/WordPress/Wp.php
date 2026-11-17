<?php
namespace GutWP\WordPress;

final class Wp {
    public static function url(string $path=''): string { return esc_url_raw(home_url($path)); }
    public static function nonce(string $action): string { return wp_create_nonce($action); }
    public static function verifyNonce(string $nonce,string $action): bool { return wp_verify_nonce($nonce,$action)!==false; }
}