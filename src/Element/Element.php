<?php
declare(strict_types=1);

namespace Elementor {
    if (!class_exists('Elementor\\Widget_Base')) {
        abstract class Widget_Base {
            protected function get_id(): string { return 'mock_id'; }
            protected function get_settings_for_display(): array { return []; }
            protected function start_controls_section(string $id, array $args = []): void {}
            protected function end_controls_section(): void {}
            protected function add_control(string $id, array $args = []): void {}
        }
        final class Controls_Manager {
            public const TEXT = 'text';
            public const URL = 'url';
            public const SELECT = 'select';
            public const SWITCHER = 'switcher';
            public const TEXTAREA = 'textarea';
        }
    }
}

namespace FloksWP\Element {
    abstract class Element extends \Elementor\Widget_Base {
        public function get_categories(): array {
            return ['flokswp'];
        }

        protected function semanticAttributes(string $component, array $extra = []): string {
            $attrs = array_merge([
                'data-frnl-component' => $component,
                'data-frnl-state' => 'idle',
            ], $extra);
            $out = '';
            foreach ($attrs as $k => $v) {
                $escK = function_exists('esc_attr') ? esc_attr((string) $k) : htmlspecialchars((string) $k, ENT_QUOTES, 'UTF-8');
                $escV = function_exists('esc_attr') ? esc_attr((string) $v) : htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
                $out .= sprintf(' %s="%s"', $escK, $escV);
            }
            return $out;
        }
    }
}