<?php

declare(strict_types=1);

namespace FloksWP\Canvas;
final class EditableNodeGraph {
    private array $edges=[];
    public function connect(string $from,string $to):void{$this->edges[]=['from'=>$from,'to'=>$to];}
    public function edges():array{return $this->edges;}
}