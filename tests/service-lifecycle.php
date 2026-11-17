<?php

declare(strict_types=1);

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
} else {
    spl_autoload_register(function (string $class) {
        $prefix = 'KrnlWP\\';
        if (str_starts_with($class, $prefix)) {
            $file = __DIR__ . '/../src/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (file_exists($file)) require_once $file;
        }
    });
}
use KrnlWP\Service\{Definition,WordPressService};
function expect($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
$s=new WordPressService(new Definition('demo','Demo','1.0',['echo'=>fn($in)=>$in],['ready'=>true]));
expect($s->state()==='uninitialized','initial state');
$s->register();expect($s->state()==='ready','register');
try{$s->call('echo','x');throw new RuntimeException('call should reject');}catch(RuntimeException $e){}
$s->start();expect($s->state()==='running','start');
expect($s->call('echo','ok')==='ok','call');
$s->stop();expect($s->state()==='stopped','stop');
expect($s->getDefinition() instanceof Definition,'definition');
expect($s->getState()['ready']===true,'state');
$s->dispose();expect($s->state()==='stopped','dispose');
$endpoint=new \KrnlWP\Protocol\Endpoint('http','127.0.0.1',8080,null,null,['rpc']);
expect(\KrnlWP\Protocol\Resolver::select(['rpc'],[$endpoint])===$endpoint,'protocol resolver');
try{\KrnlWP\Service\ServiceGenerators::definition(['id'=>'bad','name'=>'Bad','version'=>'1','operations'=>['x'=>null]]);throw new RuntimeException('invalid definition accepted');}catch(InvalidArgumentException $e){}
echo "service lifecycle tests: OK\n";
