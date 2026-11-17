<?php

declare(strict_types=1);

namespace FloksWP\Widget;

use Elementor\Controls_Manager;

final class Button extends Widget {
    public function get_name(): string { return 'flokswp-button'; }
    public function get_title(): string { return 'Floks Button'; }
    public function get_icon(): string { return 'eicon-button'; }

    protected function register_controls(): void {
        $this->start_controls_section('content',['label'=>'Content']);
        $this->add_control('text',['label'=>'Text','type'=>Controls_Manager::TEXT,'default'=>'Button']);
        $this->add_control('url',['label'=>'URL','type'=>Controls_Manager::URL,'default'=>['url'=>'#']]);
        $this->end_controls_section();
    }

    protected function render(): void {
        $s=$this->get_settings_for_display();
        $attrs=$this->frnlAttributes($this->get_id());
        $attr='';
        foreach($attrs as $k=>$v) $attr.=sprintf(' %s="%s"',$k,esc_attr($v));
        $url=esc_url($s['url']['url']??'#');
        printf('<a class="flokswp-button" href="%s"%s>%s</a>',$url,$attr,esc_html($s['text']??'Button'));
    }
}