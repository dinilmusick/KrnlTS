<?php

declare(strict_types=1);

namespace KrnlWP\Protocol;
final class Resolver {
    public static function select(array $required,array $endpoints):?Endpoint {
        foreach($endpoints as $endpoint) {
            if(is_array($endpoint)) $endpoint=new Endpoint($endpoint['protocol']??'', $endpoint['address']??'', $endpoint['port']??null, $endpoint['path']??null, $endpoint['channel']??null, $endpoint['capabilities']??[]);
            if($endpoint instanceof Endpoint && array_diff($required,$endpoint->capabilities)===[]) return $endpoint;
        }
        return null;
    }
    public static function supported(array $definition):array{return $definition['protocols']??['http'];}
}