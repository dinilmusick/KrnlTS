<?php
declare(strict_types=1);

namespace FloksWP\Element;

use Elementor\Controls_Manager;

final class Badge extends Element {
    public function get_name(): string {
        return 'flokswp-badge';
    }

    public function get_title(): string {
        return 'Floks Badge';
    }

    public function get_icon(): string {
        return 'eicon-tags';
    }

    protected function register_controls(): void {
        $this->start_controls_section('content', ['label' => 'Content']);
        $this->add_control('text', ['label' => 'Text', 'type' => Controls_Manager::TEXT, 'default' => 'Badge']);
        $this->add_control('variant', ['label' => 'Variant', 'type' => Controls_Manager::SELECT, 'default' => 'default']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $text = function_exists('esc_html') ? esc_html($s['text'] ?? 'Badge') : htmlspecialchars((string) ($s['text'] ?? 'Badge'));
        $variant = function_exists('esc_attr') ? esc_attr($s['variant'] ?? 'default') : htmlspecialchars((string) ($s['variant'] ?? 'default'));
        printf(
            '<span class="flokswp-badge flokswp-badge-%s"%s>%s</span>',
            $variant,
            $this->semanticAttributes($this->get_id(), ['data-frnl-variant' => $variant]),
            $text
        );
    }
}
