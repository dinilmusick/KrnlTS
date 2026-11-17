<?php

declare(strict_types=1);

namespace FrnlWP\Resource;
use FrnlWP\Core\Fault;
final class Resource {
    private string $status='idle';private mixed $value=null;
    public function __construct(public readonly string $id,private readonly \Closure $acquire,private readonly ?\Closure $release=null){}
    public function status():string{return $this->status;}
    public function value():mixed{return $this->value;}
    public function load():mixed{if($this->status==='ready')return $this->value;if($this->status==='released')throw new Fault("Resource released",'RESOURCE_RELEASED');$this->status='loading';try{$this->value=($this->acquire)();$this->status='ready';return $this->value;}catch(\Throwable $e){$this->status='error';throw new Fault($e->getMessage(),'RESOURCE_ACQUIRE_FAILED',false,true,$e);}}
    public function release():void{if($this->status==='released')return;$value=$this->value;$this->value=null;$this->status='released';if($value!==null&&$this->release)($this->release)($value);}
}