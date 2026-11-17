<?php

declare(strict_types=1);

if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require __DIR__ . '/../vendor/autoload.php';
} else {
    spl_autoload_register(function (string $class) {
        if (str_starts_with($class, 'KloksWP\\')) {
            $f = __DIR__ . '/../src/' . str_replace('\\', '/', substr($class, 8)) . '.php';
            if (file_exists($f)) require_once $f;
        } elseif (str_starts_with($class, 'KrnlWP\\')) {
            $f = __DIR__ . '/../../KrnlWP/src/' . str_replace('\\', '/', substr($class, 7)) . '.php';
            if (file_exists($f)) require_once $f;
        }
    });
}
use KloksWP\Services\{ServiceA,ServiceB,ServiceC,ServiceD,ServiceFactory};
function expect($v,$m){if(!$v)throw new RuntimeException($m);}
$a=ServiceA::create();$a->start();expect($a->call('add',['a'=>2,'b'=>3])['result']===5.0,'add');
$b=ServiceB::create();$b->start();expect($b->call('increment',['delta'=>2])['count']===2,'counter');
$c=ServiceC::create();$c->start();$seen=null;$c->on('reading',function($p)use(&$seen){$seen=$p;});$c->call('publishReading',['metric'=>'cpu','value'=>4]);expect($seen['metric']==='cpu','event');
$d=ServiceD::create();$d->start();expect($d->call('uppercase',['text'=>'hello'])['result']==='HELLO','protocol service');
expect(ServiceFactory::create('kloks.service.a') instanceof KrnlWP\Service\WordPressService,'factory');
echo "canonical service tests: OK
";