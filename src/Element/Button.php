<?php

declare(strict_types=1);

namespace FloksWP\Element;
use Elementor\Controls_Manager;
final class Button extends Element {
    public function get_name():string{return 'flokswp-button-v2';}
    public function get_title():string{return 'Floks Button';}
    public function get_icon():string{return 'eicon-button';}
    protected function register_controls():void{$this->start_controls_section('content',['label'=>'Content']);$this->add_control('text',['type'=>Controls_Manager::TEXT,'default'=>'Button']);$this->add_control('url',['type'=>Controls_Manager::URL,'default'=>['url'=>'#']]);$this->end_controls_section();}
    protected function render():void{$s=$this->get_settings_for_display();printf('<a class="flokswp-button"%s href="%s">%s</a>',$this->semanticAttributes($this->get_id()),esc_url($s['url']['url']??'#'),esc_html($s['text']??'Button'));}
}