<?php

declare(strict_types=1);

namespace FrnlWP\Core;
final class Lifecycle {
    private const MAP=['created'=>['initializing','disposing'],'initializing'=>['mounted','failed','disposing'],'mounted'=>['active','suspended','disposing','failed'],'active'=>['suspended','disposing','failed'],'suspended'=>['resuming','disposing','failed'],'resuming'=>['active','failed','disposing'],'disposing'=>['disposed'],'disposed'=>[],'failed'=>['initializing','disposing','disposed']];
    private array $listeners=[];
    public function __construct(private string $phase='created'){if(!isset(self::MAP[$phase]))throw new \InvalidArgumentException('Invalid lifecycle phase');}
    public function phase():string{return $this->phase;}
    public function can(string $to):bool{return $to===$this->phase||in_array($to,self::MAP[$this->phase],true);}
    public function transition(string $to):void{if(!$this->can($to))throw new \RuntimeException("Invalid lifecycle transition: {$this->phase} -> $to");$from=$this->phase;$this->phase=$to;foreach($this->listeners as $listener)$listener(['from'=>$from,'to'=>$to]);}
    public function subscribe(callable $listener):callable{$this->listeners[]=$listener;$i=array_key_last($this->listeners);return function()use($i):void{unset($this->listeners[$i]);};}
}