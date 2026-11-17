<?php
namespace GutWP\Validation;
use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Constraints as Assert;
final class Validator {
    public static function email(string $value):bool{return (bool)filter_var($value,FILTER_VALIDATE_EMAIL);}
    public static function url(string $value):bool{return (bool)filter_var($value,FILTER_VALIDATE_URL);}
    public static function nonBlank(string $value):bool{return trim($value)!=='';}
    public static function positiveInt(mixed $value):bool{return is_int($value)&&$value>0;}
    public static function violations(object $value):array{$list=Validation::createValidator()->validate($value);$out=[];foreach($list as $v)$out[]=$v->getMessage();return $out;}
}