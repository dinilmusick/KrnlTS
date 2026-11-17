<?php

declare(strict_types=1);

namespace FrnlWP\Component;
final class Definition {
    public function __construct(public readonly string $name,public readonly array $states=[],public readonly array $events=[],public readonly array $visualParameters=[]){}
    public function toArray():array{return ['name'=>$this->name,'states'=>$this->states,'events'=>$this->events,'visualParameters'=>$this->visualParameters];}
    public function hasState(string $state):bool{return isset($this->states[$state]);}
    public function validateState(string $state):void{if(!$this->hasState($state))throw new \InvalidArgumentException("Unknown component state: $state");}
}