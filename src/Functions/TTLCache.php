<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class TTLCache { private array $data=[]; public function __construct(private int $ttlMs){if($ttlMs<0)throw new \InvalidArgumentException('ttlMs must be >= 0');} public function get(mixed $key):mixed{if(!array_key_exists($key,$this->data))return null;if(microtime(true)*1000>$this->data[$key]['expires']){unset($this->data[$key]);return null;}return $this->data[$key]['value'];} public function set(mixed $key,mixed $value):void{$this->data[$key]=['value'=>$value,'expires'=>microtime(true)*1000+$this->ttlMs];} public function delete(mixed $key):bool{if(!array_key_exists($key,$this->data))return false;unset($this->data[$key]);return true;} public function clear():void{$this->data=[];} }