<?php

declare(strict_types=1);

namespace FloksWP\Element;
use Elementor\Controls_Manager;
final class Heading extends Element {
    public function get_name():string{return 'flokswp-heading';}
    public function get_title():string{return 'Floks Heading';}
    public function get_icon():string{return 'eicon-heading';}
    protected function register_controls():void{$this->start_controls_section('content',['label'=>'Content']);$this->add_control('text',['type'=>Controls_Manager::TEXT,'default'=>'Heading']);$this->end_controls_section();}
    protected function render():void{$s=$this->get_settings_for_display();printf('<h2%s>%s</h2>',$this->semanticAttributes($this->get_id()),esc_html($s['text']??''));}
}