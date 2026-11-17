<?php

declare(strict_types=1);

namespace FloksWP\Canvas;
final class Dock {
    public function __construct(private array $items=[]){}
    public function add(string $id,string $label):void{$this->items[$id]=['id'=>$id,'label'=>$label];}
    public function items():array{return array_values($this->items);}
}