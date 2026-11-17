<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class StringFunctions {
 public static function camel(string $s):string{$s=preg_replace('/[-_]+/',' ',$s);$s=preg_replace('/[^\w\s]/','',$s);$s=ucwords(strtolower($s));return lcfirst(str_replace(' ','',$s));}
 public static function pascal(string $s):string{return ucfirst(self::camel($s));}
 public static function snake(string $s):string{$s=preg_replace('/([A-Z])/','-$1',$s);return trim(strtolower(preg_replace('/[-_\s]+/','_',str_replace('-','_',$s))),'_');}
 public static function kebab(string $s):string{return str_replace('_','-',self::snake($s));}
 public static function screamingSnake(string $s):string{return strtoupper(self::snake($s));}
 public static function slug(string $s):string{$s=iconv('UTF-8','ASCII//TRANSLIT//IGNORE',$s)?:$s;return trim(strtolower(preg_replace('/[^a-z0-9]+/','-', $s)),'-');}
 public static function uuid():string{return function_exists('wp_generate_uuid4')?wp_generate_uuid4():sprintf('%s-%s-4%s-%s-%s',bin2hex(random_bytes(4)),bin2hex(random_bytes(2)),bin2hex(random_bytes(2)),dechex((hexdec(bin2hex(random_bytes(2)))&0x3fff)|0x8000),bin2hex(random_bytes(6)));}
 public static function shortId(int $length=8):string{$chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';$out='';for($i=0;$i<$length;$i++)$out.=$chars[random_int(0,strlen($chars)-1)];return $out;}
 public static function prefixedId(string $p,int $l=8):string{return $p.'-'.self::shortId($l);}
 public static function interpolate(string $t,array $d):string{return preg_replace_callback('/\{\{\s*(\w+)\s*\}\}/',fn($m)=>array_key_exists($m[1],$d)?(string)$d[$m[1]]:$m[0],$t);}
}