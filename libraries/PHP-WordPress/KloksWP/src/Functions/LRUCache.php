<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class LRUCache { private array $data=[]; public function __construct(private int $maxSize=100){if($maxSize<1)throw new \InvalidArgumentException('maxSize must be >= 1');} public function get(mixed $key):mixed{if(!array_key_exists($key,$this->data))return null;$v=$this->data[$key];unset($this->data[$key]);$this->data[$key]=$v;return $v;} public function set(mixed $key,mixed $value):void{if(array_key_exists($key,$this->data))unset($this->data[$key]);elseif(count($this->data)>=$this->maxSize)array_shift($this->data);$this->data[$key]=$value;} public function delete(mixed $key):bool{if(!array_key_exists($key,$this->data))return false;unset($this->data[$key]);return true;} public function clear():void{$this->data=[];} public function size():int{return count($this->data);} }