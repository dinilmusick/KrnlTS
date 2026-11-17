<?php

declare(strict_types=1);

namespace FloksWP\Widget;

abstract class Widget extends \Elementor\Widget_Base {
    public function get_categories(): array { return ['flokswp']; }
    protected function frnlAttributes(string $id): array {
        return ['data-frnl-component'=>$id,'data-frnl-state'=>'idle'];
    }
}