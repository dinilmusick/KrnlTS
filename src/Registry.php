<?php

declare(strict_types=1);

namespace KrnlWP;

use KrnlWP\Contract\Service;
use RuntimeException;

final class Registry {
    private array $services=[];
    public function register(Service $service):void{
        $id=$service->id();
        if(isset($this->services[$id]))throw new RuntimeException("Service already registered: $id");
        $this->services[$id]=['service'=>$service,'registeredAt'=>microtime(true)];
    }
    public function replace(Service $service):void{
        $id=$service->id();$registeredAt=$this->services[$id]['registeredAt']??microtime(true);
        $this->services[$id]=['service'=>$service,'registeredAt'=>$registeredAt];
    }
    public function unregister(string $id):bool{if(!isset($this->services[$id]))return false;unset($this->services[$id]);return true;}
    public function get(string $id):Service{return $this->services[$id]['service']??throw new RuntimeException("Unknown service: $id");}
    public function record(string $id):array{return $this->services[$id]??throw new RuntimeException("Unknown service: $id");}
    public function all():array{return array_values(array_map(fn($r)=>$r['service'],$this->services));}
    public function findByCapability(string $capability):array{
        return array_values(array_filter($this->all(),fn(Service $s)=>in_array($capability,$s->capabilities(),true)));
    }
}