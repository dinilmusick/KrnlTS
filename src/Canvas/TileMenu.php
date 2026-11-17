<?php

declare(strict_types=1);

namespace FloksWP\Canvas;
final class TileMenu {
    public function __construct(private array $tiles=[]){}
    public function add(string $id,string $label,string $icon=''):void{$this->tiles[]=['id'=>$id,'label'=>$label,'icon'=>$icon];}
    public function tiles():array{return $this->tiles;}
}