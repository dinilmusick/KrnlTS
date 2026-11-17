<?php
declare(strict_types=1);

namespace FloksWP\Element;

use Elementor\Controls_Manager;

final class Textarea extends Element {
    public function get_name(): string {
        return 'flokswp-textarea';
    }

    public function get_title(): string {
        return 'Floks Textarea';
    }

    public function get_icon(): string {
        return 'eicon-t-letter';
    }

    protected function register_controls(): void {
        $this->start_controls_section('content', ['label' => 'Content']);
        $this->add_control('placeholder', ['label' => 'Placeholder', 'type' => Controls_Manager::TEXT, 'default' => 'Enter text...']);
        $this->add_control('rows', ['label' => 'Rows', 'type' => Controls_Manager::TEXT, 'default' => '4']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $placeholder = function_exists('esc_attr') ? esc_attr($s['placeholder'] ?? '') : htmlspecialchars((string) ($s['placeholder'] ?? ''));
        $rows = function_exists('esc_attr') ? esc_attr($s['rows'] ?? '4') : htmlspecialchars((string) ($s['rows'] ?? '4'));
        printf(
            '<textarea class="flokswp-textarea" rows="%s" placeholder="%s"%s></textarea>',
            $rows,
            $placeholder,
            $this->semanticAttributes($this->get_id(), ['role' => 'textbox'])
        );
    }
}
