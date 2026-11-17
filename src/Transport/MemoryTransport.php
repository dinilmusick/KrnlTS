<?php

declare(strict_types=1);

namespace KrnlWP\Transport;
use KrnlWP\Protocol\ProtocolEnvelope;
final class MemoryTransport {
    private array $handlers=[];
    public function onMessage(callable $handler): callable {
        $id=bin2hex(random_bytes(8)); $this->handlers[$id]=$handler;
        return function()use($id):void{unset($this->handlers[$id]);};
    }
    public function send(ProtocolEnvelope $envelope): ProtocolEnvelope {
        foreach($this->handlers as $handler){$result=$handler($envelope);if($result instanceof ProtocolEnvelope)return $result;}
        return new ProtocolEnvelope(bin2hex(random_bytes(8)),'response',payload:null,correlationId:$envelope->id,timestamp:(int)(microtime(true)*1000));
    }
}