<?php

declare(strict_types=1);

namespace FrnlWP\Events;
final class EventBus {
    private array $listeners=[];
    public function on(string $name,callable $handler):callable{$id=bin2hex(random_bytes(6));$this->listeners[$name][$id]=$handler;return function()use($name,$id):void{unset($this->listeners[$name][$id]);};}
    public function emit(string $name,mixed $payload=null):void{foreach($this->listeners[$name]??[] as $handler)$handler($payload);}
}