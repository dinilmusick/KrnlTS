<?php

declare(strict_types=1);

namespace FrnlWP\WordPress;

final class Assets {
    public static function enqueue(string $baseUrl,string $version='0.2.0'): void {
        wp_enqueue_script('frnlwp-runtime',$baseUrl.'/dist/runtime.global.js',[], $version,true);
    }
}