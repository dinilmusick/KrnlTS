<?php

declare(strict_types=1);

namespace KloksWP\Services;
use KrnlWP\Service\{Definition,ServiceGenerators,WordPressService};
final class ServiceA {
    public static function definition():Definition{return ServiceGenerators::definition(['id'=>'kloks.service.a','name'=>'ServiceA','version'=>'1.0.0','operations'=>[
        'add'=>fn(array $i)=>['result'=>(float)($i['a']??0)+(float)($i['b']??0)],
        'multiply'=>fn(array $i)=>['result'=>(float)($i['a']??0)*(float)($i['b']??0)]
    ]]);}
    public static function create():WordPressService{return new WordPressService(self::definition());}
}