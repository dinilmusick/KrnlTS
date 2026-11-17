<?php

declare(strict_types=1);

namespace FrnlWP\Theme;

final class Theme {
    public function __construct(private array $components=[]) {}
    public function visual(string $component,string $state,array $fallback=[]): array {
        return array_replace($fallback,$this->components[$component][$state]??[]);
    }
}