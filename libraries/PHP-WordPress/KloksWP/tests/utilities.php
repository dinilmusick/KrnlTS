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
use KloksWP\Functions\{LRUCache,TTLCache,ObjectFunctions,Events};
use KrnlWP\Registry\ServiceRegistry;
use KloksWP\Services\ServiceA;
function expect($v,$m){if(!$v)throw new RuntimeException($m);}
$c=new LRUCache(2);$c->set('a',1);$c->set('b',2);expect($c->get('a')===1,'lru');$c->set('c',3);expect($c->get('b')===null,'eviction');
$t=new TTLCache(1000);$t->set('x',2);expect($t->get('x')===2,'ttl');
$diff=ObjectFunctions::diff(['a'=>['b'=>1]],['a'=>['b'=>2]]);expect($diff['changed']['a']['changed']['b']['to']===2,'nested diff');
$seen=null;$off=Events::subscribe(function($e)use(&$seen){$seen=$e;});Events::publish(['action'=>'TEST']);$off();expect($seen['action']==='TEST','event bus');
$r=new ServiceRegistry();$d=ServiceA::definition();$r->register($d,[['protocol'=>'memory','address'=>'local','capabilities'=>['math']]]);expect($r->get($d->id)!==null,'registry');echo "utility and registry tests: OK\n";