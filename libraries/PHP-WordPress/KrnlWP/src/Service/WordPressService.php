<?php

declare(strict_types=1);

namespace KrnlWP\Service;
use KrnlWP\Contract\Service;
use KrnlWP\Lifecycle\LifecycleManager;
final class WordPressService implements Service {
    private LifecycleManager $lifecycle;
    private array $state;
    private array $listeners=[];
    private bool $initialized=false;
    private bool $disposed=false;
    public function __construct(private readonly Definition $definition){
        ServiceGenerators::validate($definition);$this->lifecycle=new LifecycleManager();$this->state=$definition->state;
    }
    public function id():string{return $this->definition->id;}
    public function version():string{return $this->definition->version;}
    public function state():string{return $this->lifecycle->status();}
    public function register():void{if($this->initialized)return;$this->initialize();}
    private function initialize():void{
        $this->lifecycle->transition('initializing');
        try{($this->definition->lifecycle['onInit']??null)?->call($this);$this->initialized=true;$this->lifecycle->transition('ready');}
        catch(\Throwable $e){$this->lifecycle->transition('uninitialized');throw $e;}
    }
    public function start():void{
        if($this->disposed)throw new \RuntimeException("[Service:{$this->definition->name}] Cannot start a disposed service.");
        if($this->state()==='running')return;
        if(!$this->initialized)$this->initialize();
        $this->lifecycle->transition('starting');
        try{($this->definition->lifecycle['onStart']??null)?->call($this);$this->lifecycle->transition('running');}
        catch(\Throwable $e){$this->lifecycle->transition('ready');throw $e;}
    }
    public function stop():void{
        if($this->state()==='stopped')return;
        if($this->state()!=='running')throw new \RuntimeException("[Service:{$this->definition->name}] Cannot stop while status is '{$this->state()}'.");
        $this->lifecycle->transition('stopping');
        try{($this->definition->lifecycle['onStop']??null)?->call($this);$this->lifecycle->transition('stopped');}
        catch(\Throwable $e){$this->lifecycle->transition('running');throw $e;}
    }
    public function call(string $operation,mixed $input=[],array $context=[]):mixed{
        $this->lifecycle->assertRunning($this->name());
        $op=$this->definition->operations[$operation]??null;
        $handler=is_array($op)?($op['handler']??null):$op;
        if(!is_callable($handler))throw new \RuntimeException("[Service:{$this->name()}] Operation '$operation' not found.");
        return $handler($input,$context+['service'=>$this]);
    }
    public function getState():array{return $this->state;}
    public function setState(array $mutation):void{$this->state=array_replace($this->state,$mutation);}
    public function capabilities():array{return $this->definition->capabilities;}
    public function getDefinition():object{return $this->definition;}
    public function dispose():void{
        if($this->disposed)return;
        if($this->state()==='running')$this->stop();
        ($this->definition->lifecycle['onDispose']??null)?->call($this);$this->disposed=true;
    }
    public function name():string{return $this->definition->name;}
    public function on(string $event,callable $handler):callable{
        $this->listeners[$event]??=[];$this->listeners[$event][]=$handler;
        return function()use($event,$handler):void{$this->listeners[$event]=array_values(array_filter($this->listeners[$event],fn($h)=>$h!==$handler));};
    }
    public function emit(string $event,mixed $payload=null):void{foreach($this->listeners[$event]??[] as $handler)$handler($payload,$this);}
}