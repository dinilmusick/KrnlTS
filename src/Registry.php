<?php

declare(strict_types=1);

namespace FrnlWP;
use FrnlWP\Core\Capability;
final class Registry {
    private array $entries=[];
    public function register(string $id,int $version,mixed $value,?object $contract=null,array $capabilities=[]):void{if(trim($id)===''||$version<1)throw new \InvalidArgumentException('Invalid registry entry');if(isset($this->entries[$id])&&$this->entries[$id]['version']>$version)throw new \RuntimeException("Older version: $id");$this->entries[$id]=compact('id','version','value','contract','capabilities');}
    public function has(string $id):bool{return isset($this->entries[$id]);}
    public function get(string $id):mixed{return $this->entries[$id]['value']??throw new \RuntimeException("Registration not found: $id");}
    public function resolve(string $id):mixed{return $this->get($id);}
    public function entry(string $id):array{return $this->entries[$id]??throw new \RuntimeException("Registration not found: $id");}
    public function list():array{return array_values($this->entries);}
    public function clear():void{$this->entries=[];}
    public function requireCapabilities(string $id,array $available):void{foreach($this->entries[$id]['capabilities']??[] as $cap){$needs=$cap instanceof Capability?$cap->requires:(is_array($cap)?($cap['requires']??[]):[]);foreach($needs as $need)if(!in_array($need,$available,true))throw new \RuntimeException("Missing capability: $need");}}
}