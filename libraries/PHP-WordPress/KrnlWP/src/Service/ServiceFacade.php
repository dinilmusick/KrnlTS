<?php

declare(strict_types=1);

namespace KrnlWP\Service;
final class ServiceFacade {
    public function __construct(private WordPressService $service) {}
    public function id():string{return $this->service->id();}
    public function call(string $operation,mixed $input=[]):mixed{return $this->service->call($operation,$input);}
    public function state():array{return $this->service->getState();}
}