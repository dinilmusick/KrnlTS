<?php
declare(strict_types=1);

namespace FloksWP\Element;

use Elementor\Controls_Manager;

final class Select extends Element {
    public function get_name(): string {
        return 'flokswp-select';
    }

    public function get_title(): string {
        return 'Floks Select';
    }

    public function get_icon(): string {
        return 'eicon-select';
    }

    protected function register_controls(): void {
        $this->start_controls_section('content', ['label' => 'Content']);
        $this->add_control('name', ['label' => 'Field Name', 'type' => Controls_Manager::TEXT, 'default' => 'floks_select']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $name = function_exists('esc_attr') ? esc_attr($s['name'] ?? 'select') : htmlspecialchars((string) ($s['name'] ?? 'select'));
        printf(
            '<select class="flokswp-select" name="%s"%s><option value="">Select option...</option></select>',
            $name,
            $this->semanticAttributes($this->get_id(), ['role' => 'combobox'])
        );
    }
}
