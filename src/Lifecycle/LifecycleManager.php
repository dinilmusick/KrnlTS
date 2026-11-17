<?php

declare(strict_types=1);

namespace KrnlWP\Lifecycle;
final class LifecycleManager {
    private string $status='uninitialized';
    private const MAP=[
      'uninitialized'=>['initializing'],'initializing'=>['ready','uninitialized'],'ready'=>['starting'],
      'starting'=>['running','ready'],'running'=>['stopping'],'stopping'=>['stopped','running'],'stopped'=>['starting']
    ];
    public function status(): string{return $this->status;}
    public function can(string $next):bool{return in_array($next,self::MAP[$this->status]??[],true);}
    public function transition(string $next):void{if(!$this->can($next))throw new \RuntimeException("Invalid lifecycle transition: {$this->status} -> {$next}");$this->status=$next;}
    public function assertRunning(string $service):void{if($this->status!=='running')throw new \RuntimeException("[Service:$service] Not running");}
}