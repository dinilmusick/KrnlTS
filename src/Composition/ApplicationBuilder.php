<?php

declare(strict_types=1);

namespace SkipoWP\Composition;
use SkipoWP\Manifest;
final class ApplicationBuilder {
    private Graph $graph;
    public function __construct(){ $this->graph=new Graph(); }
    public function layer(string $id,array $dependsOn=[]):self{$this->graph->add($id,$dependsOn);return $this;}
    public function build(Manifest $manifest):array{$errors=$this->graph->validate();if($errors)throw new \RuntimeException(implode('; ',$errors));return ['manifest'=>$manifest->toArray(),'order'=>$this->graph->order()];}
}