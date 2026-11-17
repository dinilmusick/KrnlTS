<?php

declare(strict_types=1);

namespace KloksWP\Services;
use KrnlWP\Service\{Definition,ServiceGenerators,WordPressService};
final class ServiceC {
    public static function create():WordPressService{
        $ref=null;$ops=['publishReading'=>function(array $i)use(&$ref){$p=['metric'=>(string)($i['metric']??''),'value'=>(float)($i['value']??0),'timestamp'=>time()];$ref?->emit('reading',$p);return $p;}];
        $ref=new WordPressService(ServiceGenerators::definition(['id'=>'kloks.service.c','name'=>'ServiceC','version'=>'1.0.0','events'=>['reading'=>['name'=>'reading']],'operations'=>$ops]));
        return $ref;
    }
}