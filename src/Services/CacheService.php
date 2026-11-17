<?php

declare(strict_types=1);

namespace KloksWP\Services;

final class CacheService {
    public function get(string $key,mixed $default=null,string $group='kloks'): mixed {
        $value=wp_cache_get($key,$group);
        return $value===false?$default:$value;
    }
    public function set(string $key,mixed $value,int $ttl=0,string $group='kloks'): bool {
        return wp_cache_set($key,$value,$group,$ttl);
    }
    public function delete(string $key,string $group='kloks'): bool { return wp_cache_delete($key,$group); }
}