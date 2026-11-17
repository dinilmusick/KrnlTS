<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class Events {
 private static array $listeners=[]; private static array $buffer=[]; private const MAX=200;
 public static function publish(array $event):array{$event['id']=$event['id']??('ev-'.microtime(true).'-'.bin2hex(random_bytes(3)));$event['timestamp']=$event['timestamp']??(int)(microtime(true)*1000);$event['source']=$event['source']??'api';self::$buffer[]=$event;if(count(self::$buffer)>self::MAX)self::$buffer=array_slice(self::$buffer,-self::MAX);foreach(self::$listeners as $listener)try{$listener($event);}catch(\Throwable){}return $event;}
 public static function subscribe(callable $listener):callable{$id=spl_object_id((object)$listener).bin2hex(random_bytes(2));self::$listeners[$id]=$listener;return static function()use($id):void{unset(self::$listeners[$id]);};}
 public static function recent(?int $since=null,?string $workspaceId=null,?string $userId=null):array{return array_values(array_filter(self::$buffer,fn($e)=>($e['timestamp']??0)>($since??0)&&(!$workspaceId||!isset($e['workspaceId'])||$e['workspaceId']===$workspaceId)&&(!$userId||!isset($e['userId'])||$e['userId']===$userId)));}
}