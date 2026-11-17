<?php

declare(strict_types=1);

namespace KrnlWP\Protocol;
final class ProtocolEnvelope {
    public function __construct(
        public readonly string $id, public readonly string $type='request',
        public readonly ?string $operation=null, public readonly mixed $payload=null,
        public readonly ?string $error=null, public readonly ?string $correlationId=null,
        public readonly int $timestamp=0,
    ) {}
    public function toArray(): array { return get_object_vars($this); }
    public static function fromArray(array $data): self { return new self(...[
        $data['id']??bin2hex(random_bytes(8)),$data['type']??'request',$data['operation']??null,
        $data['payload']??null,$data['error']??null,$data['correlationId']??null,$data['timestamp']??time()*1000
    ]); }
}