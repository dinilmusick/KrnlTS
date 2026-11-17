<?php

declare(strict_types=1);

/**
 * Plugin Name: SkipoWP
 * Plugin URI: https://github.com/dinilmusick/SkipoWP
 * Description: SkipoWP application composition, scaffolding, and runtime orchestration engine.
 * Version: 0.5.0
 * Author: Ultrst Armada
 * License: MIT
 * Text Domain: skipowp
 */

defined('ABSPATH') || exit;

$vendorAutoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require_once $vendorAutoload;
} else {
    spl_autoload_register(function (string $class) {
        $prefix = 'SkipoWP\\';
        if (str_starts_with($class, $prefix)) {
            $f = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (file_exists($f)) {
                require_once $f;
            }
        }
    });
}
