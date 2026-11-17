<?php
namespace GutWP\WordPress;
final class WordPress {
    public static function sanitizeText(string $value):string{return sanitize_text_field($value);}
    public static function sanitizeHtml(string $value):string{return wp_kses_post($value);}
    public static function adminUrl(string $path=''):string{return admin_url($path);}
}