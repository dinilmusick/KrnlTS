<?php

declare(strict_types=1);

namespace KloksWP\Store;
final class Store {
    public function __construct(private array $data=[]){}
    public function read(string $key,mixed $default=null):mixed{return $this->data[$key]??$default;}
    public function write(string $key,mixed $value):void{$this->data[$key]=$value;}
    public function delete(string $key):void{unset($this->data[$key]);}
    public function snapshot():array{return $this->data;}
}