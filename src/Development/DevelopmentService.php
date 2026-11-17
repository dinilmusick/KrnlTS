<?php

declare(strict_types=1);

namespace KloksWP\Development;
final class DevelopmentService {
    public function environment():array{return ['debug'=>defined('WP_DEBUG')&&WP_DEBUG,'php'=>PHP_VERSION,'wordpress'=>get_bloginfo('version')];}
    public function log(string $message,array $context=[]):void{if(function_exists('error_log'))error_log('[KloksWP] '.$message.' '.wp_json_encode($context));}
}