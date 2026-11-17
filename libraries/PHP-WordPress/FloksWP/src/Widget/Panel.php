<?php

declare(strict_types=1);

namespace FloksWP\Widget;

use Elementor\Controls_Manager;

final class Panel extends Widget {
    public function get_name(): string { return 'flokswp-panel'; }
    public function get_title(): string { return 'Floks Panel'; }
    public function get_icon(): string { return 'eicon-container'; }

    protected function register_controls(): void {
        $this->start_controls_section('content',['label'=>'Content']);
        $this->add_control('title',['label'=>'Title','type'=>Controls_Manager::TEXT,'default'=>'Panel']);
        $this->add_control('body',['label'=>'Body','type'=>Controls_Manager::WYSIWYG,'default'=>'']);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s=$this->get_settings_for_display();
        printf('<section class="flokswp-panel" data-frnl-component="%s"><h3>%s</h3><div>%s</div></section>',
            esc_attr($this->get_id()),esc_html($s['title']??''),wp_kses_post($s['body']??''));
    }
}