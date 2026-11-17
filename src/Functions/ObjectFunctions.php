<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class ObjectFunctions {
 public static function deepClone(mixed $v):mixed{if(is_array($v)){foreach($v as $k=>$x)$v[$k]=self::deepClone($x);return $v;}if(is_object($v))return unserialize(serialize($v));return $v;}
 public static function deepMerge(mixed $base,...$overrides):mixed{$r=self::deepClone($base);foreach($overrides as $o){if(!is_array($o))continue;foreach($o as $k=>$v){if($v===null){$r[$k]=null;continue;}if(is_array($v)&&isset($r[$k])&&is_array($r[$k]))$r[$k]=self::deepMerge($r[$k],$v);else$r[$k]=self::deepClone($v);}}return $r;}
 public static function deepEqual(mixed $a,mixed $b):bool{if($a===$b)return true;if(is_object($a)&&is_object($b))return get_class($a)===get_class($b)&&serialize($a)===serialize($b);if(!is_array($a)||!is_array($b)||count($a)!==count($b))return false;foreach($a as $k=>$v)if(!array_key_exists($k,$b)||!self::deepEqual($v,$b[$k]))return false;return true;}
 public static function diff(mixed $a,mixed $b):array{$added=[];$removed=[];$changed=[];if(!is_array($a)||!is_array($b))return compact('added','removed','changed');foreach($b as $k=>$v){if(!array_key_exists($k,$a))$added[$k]=self::deepClone($v);elseif(!self::deepEqual($a[$k],$v)){$nested=is_array($a[$k])&&is_array($v)?self::diff($a[$k],$v):[];$hasChanges=!empty($nested['added'])||!empty($nested['removed'])||!empty($nested['changed']);$changed[$k]=$hasChanges?$nested:['from'=>self::deepClone($a[$k]),'to'=>self::deepClone($v)];}}foreach($a as $k=>$v)if(!array_key_exists($k,$b))$removed[$k]=self::deepClone($v);return compact('added','removed','changed');}
 public static function getPath(mixed $v,string $path,mixed $default=null):mixed{if($path==='')return $v;foreach(explode('.',$path) as $p){if(is_array($v))$v=array_key_exists($p,$v)?$v[$p]:$default;elseif(is_object($v)&&isset($v->{$p}))$v=$v->{$p};else return $default;}return $v;}
 public static function setPath(array &$v,string $path,mixed $value):array{$r=&$v;foreach(explode('.',$path) as $p){if(!isset($r[$p])||!is_array($r[$p]))$r[$p]=[];$r=&$r[$p];}$r=$value;return $v;}
}