<?php

declare(strict_types=1);

namespace KrnlWP\Protocol;
interface Adapter {
    public function protocol():string;
    public function capabilities():array;
    public function send(Endpoint|array $target,array $envelope):array;
}