<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class FileCache { public function __construct(private string $cacheDir){if(!is_dir($cacheDir)&&!@mkdir($cacheDir,0777,true)&&!is_dir($cacheDir))throw new \RuntimeException('Unable to create cache directory');} private function file(string $key):string{return $this->cacheDir.'/'.rawurlencode($key).'.json';} public function get(string $key):mixed{$f=$this->file($key);if(!is_file($f))return null;$v=@json_decode((string)file_get_contents($f),true);return json_last_error()===JSON_ERROR_NONE?$v:null;} public function set(string $key,mixed $value):void{@file_put_contents($this->file($key),json_encode($value,JSON_THROW_ON_ERROR|JSON_PRETTY_PRINT),LOCK_EX);} public function delete(string $key):void{@unlink($this->file($key));} public function clear():void{foreach(glob($this->cacheDir.'/*.json')?:[] as $f)@unlink($f);} }