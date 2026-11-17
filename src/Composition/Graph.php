<?php

declare(strict_types=1);

namespace SkipoWP\Composition;
final class Graph {
    private array $nodes=[];
    public function add(string $id,array $dependsOn=[]):void{$this->nodes[$id]=$dependsOn;}
    public function validate():array{$errors=[];$visiting=[];$visited=[];$visit=function($id)use(&$visit,&$visiting,&$visited,&$errors){if(isset($visiting[$id])){$errors[]="Cycle detected: $id";return;}if(isset($visited[$id]))return;$visiting[$id]=1;foreach($this->nodes[$id]??[] as $dep){if(!isset($this->nodes[$dep])){$errors[]="Missing dependency: $dep";continue;}$visit($dep);}unset($visiting[$id]);$visited[$id]=1;};foreach(array_keys($this->nodes) as $id)$visit($id);return array_values(array_unique($errors));}
    public function order():array{$errors=$this->validate();if($errors)throw new \RuntimeException(implode('; ',$errors));$seen=[];$out=[];$visit=function($id)use(&$visit,&$seen,&$out){if(isset($seen[$id]))return;foreach($this->nodes[$id]??[] as $dep)$visit($dep);$seen[$id]=1;$out[]=$id;};foreach(array_keys($this->nodes) as $id)$visit($id);return $out;}
}