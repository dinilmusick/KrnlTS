<?php
declare(strict_types=1);

namespace FloksWP\Element;

use Elementor\Controls_Manager;

final class Input extends Element {
    public function get_name(): string {
        return 'flokswp-input';
    }

    public function get_title(): string {
        return 'Floks Input';
    }

    public function get_icon(): string {
        return 'eicon-text-field';
    }

    protected function register_controls(): void {
        $this->start_controls_section('content', ['label' => 'Content']);
        $this->add_control('placeholder', ['label' => 'Placeholder', 'type' => Controls_Manager::TEXT, 'default' => 'Enter value...']);
        $this->add_control('type', ['label' => 'Type', 'type' => Controls_Manager::SELECT, 'default' => 'text']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $placeholder = function_exists('esc_attr') ? esc_attr($s['placeholder'] ?? '') : htmlspecialchars((string) ($s['placeholder'] ?? ''));
        $type = function_exists('esc_attr') ? esc_attr($s['type'] ?? 'text') : htmlspecialchars((string) ($s['type'] ?? 'text'));
        printf(
            '<input class="flokswp-input" type="%s" placeholder="%s"%s />',
            $type,
            $placeholder,
            $this->semanticAttributes($this->get_id(), ['role' => 'textbox'])
        );
    }
}
