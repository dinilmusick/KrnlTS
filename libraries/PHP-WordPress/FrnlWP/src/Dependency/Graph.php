<?php

declare(strict_types=1);

namespace FrnlWP\Dependency;
final class Graph {
    private array $nodes=[];private array $providers=[];
    public function register(string $id,array $requires=[],array $provides=[]):void{$this->nodes[$id]=$requires;foreach($provides as $cap)$this->providers[$cap]=$id;}
    public function topologicalOrder():array{$visited=[];$visiting=[];$out=[];$visit=function($id)use(&$visit,&$visited,&$visiting,&$out){if(isset($visiting[$id]))throw new \RuntimeException("Dependency cycle");if(isset($visited[$id]))return;$visiting[$id]=1;foreach($this->nodes[$id]??[] as $req)if(isset($this->providers[$req]))$visit($this->providers[$req]);unset($visiting[$id]);$visited[$id]=1;$out[]=$id;};foreach(array_keys($this->nodes) as $id)$visit($id);return $out;}
}