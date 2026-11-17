<?php

declare(strict_types=1);

namespace FloksWP\Element;
final class Graph extends Element {
    public function get_name():string{return 'flokswp-graph';}
    public function get_title():string{return 'Floks Graph';}
    public function get_icon():string{return 'eicon-flow';}
    protected function register_controls():void{}
    protected function render():void{echo '<div class="flokswp-graph" data-frnl-component="'.esc_attr($this->get_id()).'"></div>';}
}