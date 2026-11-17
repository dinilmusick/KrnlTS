<?php
declare(strict_types=1);

namespace FloksWP\Element;

use Elementor\Controls_Manager;

final class Card extends Element {
    public function get_name(): string {
        return 'flokswp-card';
    }

    public function get_title(): string {
        return 'Floks Card';
    }

    public function get_icon(): string {
        return 'eicon-gallery-grid';
    }

    protected function register_controls(): void {
        $this->start_controls_section('content', ['label' => 'Content']);
        $this->add_control('title', ['label' => 'Title', 'type' => Controls_Manager::TEXT, 'default' => 'Card Title']);
        $this->add_control('description', ['label' => 'Description', 'type' => Controls_Manager::TEXTAREA, 'default' => 'Card Description']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s = $this->get_settings_for_display();
        $title = function_exists('esc_html') ? esc_html($s['title'] ?? '') : htmlspecialchars((string) ($s['title'] ?? ''));
        $desc = function_exists('wp_kses_post') ? wp_kses_post($s['description'] ?? '') : htmlspecialchars((string) ($s['description'] ?? ''));
        printf(
            '<div class="flokswp-card"%s><h3 class="flokswp-card-title">%s</h3><div class="flokswp-card-body">%s</div></div>',
            $this->semanticAttributes($this->get_id()),
            $title,
            $desc
        );
    }
}
