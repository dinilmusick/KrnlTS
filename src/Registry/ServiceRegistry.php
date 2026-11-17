<?php

declare(strict_types=1);

namespace KrnlWP\Registry;
use KrnlWP\Service\{Definition,ServiceGenerators};
final class ServiceRegistry {
 private array $records=[];
 public function register(Definition $definition,array $endpoints=[]):void{ServiceGenerators::validate($definition);foreach($endpoints as $e)self::validateEndpoint($e);if(isset($this->records[$definition->id]))throw new \RuntimeException("Service already registered: {$definition->id}");$this->records[$definition->id]=['definition'=>$definition,'endpoints'=>$this->copyEndpoints($endpoints),'registeredAt'=>microtime(true)];}
 public function replace(Definition $definition,array $endpoints=[]):void{ServiceGenerators::validate($definition);foreach($endpoints as $e)self::validateEndpoint($e);$old=$this->records[$definition->id]??null;$this->records[$definition->id]=['definition'=>$definition,'endpoints'=>$this->copyEndpoints($endpoints),'registeredAt'=>$old['registeredAt']??microtime(true)];}
 public function unregister(string $id):bool{if(!isset($this->records[$id]))return false;unset($this->records[$id]);return true;}
 public function get(string $id):?array{return isset($this->records[$id])?$this->copyRecord($this->records[$id]):null;}
 public function list():array{return array_map(fn($r)=>$this->copyRecord($r),array_values($this->records));}
 public function findByCapability(string $name):array{return array_values(array_filter($this->list(),fn($r)=>array_reduce($r['definition']->capabilities,false,fn($ok,$cap)=>$ok||is_array($cap)&&($cap['name']??null)===$name)));}
 private static function validateEndpoint(array $e):void{$p=['http','https','ws','wss','udp','p2p','signaling','memory'];if(!in_array($e['protocol']??null,$p,true)||trim((string)($e['address']??''))==='')throw new \InvalidArgumentException('Invalid service endpoint');if(isset($e['port'])&&(!is_int($e['port'])||$e['port']<0||$e['port']>65535))throw new \InvalidArgumentException('Invalid service endpoint port');if(!is_array($e['capabilities']??null))throw new \InvalidArgumentException('Endpoint capabilities must be an array');}
 private static function copyEndpoints(array $e):array{return array_map(fn($x)=>array_replace($x,['capabilities'=>array_values($x['capabilities']??[])]),$e);}
 private static function copyRecord(array $r):array{return ['definition'=>$r['definition'],'endpoints'=>self::copyEndpoints($r['endpoints']),'registeredAt'=>$r['registeredAt']];}
}