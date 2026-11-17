<?php

declare(strict_types=1);

/**
 * Plugin Name: FloksWP
 * Plugin URI: https://github.com/dinilmusick/FloksWP
 * Description: Concrete reusable Elementor and WordPress UI elements built on FrnlWP.
 * Version: 1.13.4
 * Author: Ultrst Armada
 * License: MIT
 * Text Domain: flokswp
 */

defined('ABSPATH') || exit;

$vendorAutoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require_once $vendorAutoload;
} else {
    spl_autoload_register(function (string $class) {
        $prefix = 'FloksWP\\';
        if (str_starts_with($class, $prefix)) {
            $f = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (file_exists($f)) {
                require_once $f;
            }
        }
    });
}

(new FloksWP\Plugin())->register();
