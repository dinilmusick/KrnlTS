<?php

declare(strict_types=1);

namespace KrnlWP\Service;
final class ServiceGenerators {
    public static function validate(Definition $d):Definition {
        foreach(['id','name','version'] as $f) if(trim($d->{$f})==='') throw new \InvalidArgumentException("Invalid service definition: $f");
        foreach($d->operations as $key=>$op) {
            $handler=is_array($op)?($op['handler']??null):$op;
            if(!is_callable($handler)) throw new \InvalidArgumentException("Invalid operation: $key");
        }
        foreach($d->dependencies as $x) if(!is_string($x)&&(!is_array($x)||empty($x['serviceId']))) throw new \InvalidArgumentException('Invalid service dependency');
        foreach($d->capabilities as $x) if(!is_string($x)&&(!is_array($x)||empty($x['id'])||empty($x['name'])||!is_array($x['protocols']??null))) throw new \InvalidArgumentException('Invalid service capability');
        foreach($d->protocols as $p) if(!in_array($p,['http','https','ws','wss','udp','p2p','signaling','memory'],true)) throw new \InvalidArgumentException("Unsupported protocol: $p");
        return $d;
    }
    public static function definition(array $c):Definition {
        return self::validate(new Definition($c['id']??'', $c['name']??'', $c['version']??'', $c['operations']??[], $c['state']??[], $c['events']??[], $c['dependencies']??[], $c['capabilities']??[], $c['inputs']??[], $c['outputs']??[], $c['protocols']??[], $c['lifecycle']??[]));
    }
    public static function service(Definition|array $d):WordPressService { return new WordPressService(is_array($d)?self::definition($d):self::validate($d)); }
}