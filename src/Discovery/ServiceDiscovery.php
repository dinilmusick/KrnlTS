<?php

declare(strict_types=1);

namespace KrnlWP\Discovery;
final class ServiceDiscovery {
    private array $peers=[];
    public function register(string $id,string $name,array $endpoints): void {
        $this->peers[$id]=['id'=>$id,'name'=>$name,'endpoints'=>$endpoints,'lastSeen'=>time()];
    }
    public function get(string $id): ?array { return $this->peers[$id]??null; }
    public function all(): array { return array_values($this->peers); }
    public function forget(string $id): void { unset($this->peers[$id]); }
}