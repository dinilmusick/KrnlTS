<?php

declare(strict_types=1);

namespace KrnlWP\Protocol;
final class Endpoint {
    public function __construct(
        public readonly string $protocol, public readonly string $address, public readonly ?int $port=null,
        public readonly ?string $path=null, public readonly ?string $channel=null, public readonly array $capabilities=[]
    ) {
        if(!in_array($protocol,['http','https','ws','wss','udp','p2p','signaling','memory'],true)) throw new \InvalidArgumentException("Unsupported endpoint protocol: $protocol");
        if(trim($address)==='') throw new \InvalidArgumentException('Endpoint address must be non-empty.');
        if($port!==null&&($port<0||$port>65535)) throw new \InvalidArgumentException('Endpoint port is invalid.');
    }
    public function toArray():array{return ['protocol'=>$this->protocol,'address'=>$this->address,'port'=>$this->port,'path'=>$this->path,'channel'=>$this->channel,'capabilities'=>$this->capabilities];}
}