<?php

declare(strict_types=1);

namespace KrnlWP\Protocol;
final class ProtocolCapabilities {
    public function __construct(
        public readonly bool $requestResponse=true, public readonly bool $streaming=false,
        public readonly bool $pubSub=false, public readonly bool $datagram=false,
        public readonly bool $peerToPeer=false, public readonly bool $signaling=false,
        public readonly bool $discovery=false,
    ) {}
}