<?php
declare(strict_types=1);

namespace FloksWP\Element;

use Elementor\Controls_Manager;

final class Toggle extends Element {
    public function get_name(): string {
        return 'flokswp-toggle';
    }

    public function get_title(): string {
        return 'Floks Toggle';
    }

    public function get_icon(): string {
        return 'eicon-toggle';
    }

    protected function register_controls(): void {
        $this->start_controls_section('content', ['label' => 'Content']);
        $this->add_control('label', ['label' => 'Label', 'type' => Controls_Manager::TEXT, 'default' => 'Toggle']);
        $this->add_control('default_state', ['label' => 'Default State', 'type' => Controls_Manager::SWITCHER, 'default' => 'no']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $label = function_exists('esc_html') ? esc_html($s['label'] ?? '') : htmlspecialchars((string) ($s['label'] ?? ''));
        $checked = ($s['default_state'] ?? 'no') === 'yes' ? ' checked' : '';
        printf(
            '<label class="flokswp-toggle"%s><input type="checkbox"%s /><span class="flokswp-toggle-slider"></span><span class="flokswp-toggle-label">%s</span></label>',
            $this->semanticAttributes($this->get_id(), ['role' => 'switch']),
            $checked,
            $label
        );
    }
}
