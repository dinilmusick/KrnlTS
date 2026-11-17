<?php

declare(strict_types=1);

namespace KloksWP\State;
final class State {
    public function __construct(private array $data=[]){}
    public function get(string $key,mixed $default=null):mixed{return $this->data[$key]??$default;}
    public function set(string $key,mixed $value):void{$this->data[$key]=$value;}
    public function all():array{return $this->data;}
}