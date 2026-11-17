<?php

declare(strict_types=1);

namespace KloksWP\Services;
use KrnlWP\Service\{Definition,ServiceGenerators,WordPressService};
final class ServiceB {
    public static function create():WordPressService{
        $state=['count'=>0,'lastUpdated'=>0];$ref=null;
        $ops=[
            'increment'=>function(array $i)use(&$state,&$ref){$state['count']+=($i['delta']??1);$state['lastUpdated']=time();$ref?->setState($state);return $state;},
            'getCount'=>fn()=> $state,
            'reset'=>function()use(&$state,&$ref){$state=['count'=>0,'lastUpdated'=>time()];$ref?->setState($state);return $state;}
        ];
        $ref=new WordPressService(ServiceGenerators::definition(['id'=>'kloks.service.b','name'=>'ServiceB','version'=>'1.0.0','state'=>$state,'operations'=>$ops]));
        return $ref;
    }
}