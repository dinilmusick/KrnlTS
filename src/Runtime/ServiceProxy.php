<?php

declare(strict_types=1);

namespace KrnlWP\Runtime;

use KrnlWP\Contract\{ProtocolAdapter,Service};
use RuntimeException;

final class ServiceProxy implements Service {
    private string $lifecycle=Lifecycle::UNINITIALIZED;
    public function __construct(private string $serviceId,private string $serviceVersion,private ProtocolAdapter $protocol) {}
    public function id(): string { return $this->serviceId; }
    public function version(): string { return $this->serviceVersion; }
    public function state(): string { return $this->lifecycle; }
    public function register(): void { $this->lifecycle=Lifecycle::READY; }
    public function start(): void { $this->lifecycle=Lifecycle::RUNNING; }
    public function stop(): void { $this->lifecycle=Lifecycle::STOPPED; }
    public function call(string $operation,array $input=[]): mixed {
        if($this->lifecycle!==Lifecycle::RUNNING) throw new RuntimeException('Service proxy is not running');
        return $this->protocol->call($this->serviceId,$operation,$input);
    }
}