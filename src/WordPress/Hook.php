<?php

declare(strict_types=1);

namespace KrnlWP\WordPress;

final class Hook {
    public static function action(string $tag,callable $callback,int $priority=10,int $acceptedArgs=1): void {
        add_action($tag,$callback,$priority,$acceptedArgs);
    }

    public static function filter(string $tag,callable $callback,int $priority=10,int $acceptedArgs=1): void {
        add_filter($tag,$callback,$priority,$acceptedArgs);
    }
}