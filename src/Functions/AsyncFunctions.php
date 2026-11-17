<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class AsyncFunctions {
 public static function sleep(int $ms):void{if($ms>0)usleep($ms*1000);}
 public static function retry(callable $fn,int $maxAttempts,int $delayMs=1000):mixed{$last=null;for($i=0;$i<$maxAttempts;$i++){try{return $fn();}catch(\Throwable $e){$last=$e;if($i+1<$maxAttempts)self::sleep($delayMs);}}throw $last;}
 public static function pLimit(array $tasks,int $concurrency):array{if($concurrency<1)throw new \InvalidArgumentException('Concurrency must be >= 1');$out=[];foreach($tasks as $i=>$task)$out[$i]=$task();ksort($out);return $out;}
 public static function once(callable $fn):callable{$done=false;$result=null;return function(...$args)use($fn,&$done,&$result){if(!$done){$result=$fn(...$args);$done=true;}return $result;};}
 public static function memoize(callable $fn,?callable $keyFn=null):callable{$cache=[];return function(...$args)use($fn,$keyFn,&$cache){$k=$keyFn?$keyFn(...$args):serialize($args);return $cache[$k]??=$fn(...$args);};}
}