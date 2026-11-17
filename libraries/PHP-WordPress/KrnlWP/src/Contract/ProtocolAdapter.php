<?php

declare(strict_types=1);

namespace KrnlWP\Contract;

interface ProtocolAdapter {
    public function call(string $service,string $operation,array $input=[]): mixed;
}