<?php

declare(strict_types=1);

namespace KloksWP\Services;
use KrnlWP\Service\{Definition,ServiceGenerators,WordPressService};
final class ServiceD {
    public static function definition():Definition{return ServiceGenerators::definition(['id'=>'kloks.service.d','name'=>'ServiceD','version'=>'1.0.0','protocols'=>['http','ws','udp','p2p'],'capabilities'=>[['id'=>'rpc.echo','name'=>'Protocol Echo & Transform','protocols'=>['http','ws','udp','p2p']]],'operations'=>[
        'echo'=>fn(array $i,array $c)=>['echoed'=>(string)($i['message']??''),'protocol'=>$c['protocol']??'memory','timestamp'=>time()],
        'uppercase'=>fn($i)=>['result'=>strtoupper(is_string($i)?$i:(string)($i['text']??''))]
    ]]);}
    public static function create():WordPressService{return new WordPressService(self::definition());}
}