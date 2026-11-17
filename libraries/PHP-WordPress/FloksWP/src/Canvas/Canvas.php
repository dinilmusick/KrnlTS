<?php

declare(strict_types=1);

namespace FloksWP\Canvas;
final class Canvas {
    public function __construct(private array $nodes=[]){}
    public function add(string $id,float $x,float $y,array $data=[]):void{$this->nodes[$id]=['x'=>$x,'y'=>$y,'data'=>$data];}
    public function nodes():array{return $this->nodes;}
}