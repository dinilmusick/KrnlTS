<?php

declare(strict_types=1);

namespace FloksWP\Element;
final class Container extends Element {
    public function get_name():string{return 'flokswp-container';}
    public function get_title():string{return 'Floks Container';}
    public function get_icon():string{return 'eicon-container';}
    protected function register_controls():void{}
    protected function render():void{printf('<div class="flokswp-container"%s></div>',$this->semanticAttributes($this->get_id()));}
}