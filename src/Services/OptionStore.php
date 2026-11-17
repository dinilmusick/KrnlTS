<?php

declare(strict_types=1);

namespace KloksWP\Services;

final class OptionStore {
    public function get(string $key,mixed $default=null): mixed { return get_option($key,$default); }
    public function set(string $key,mixed $value): bool { return update_option($key,$value,false); }
    public function delete(string $key): bool { return delete_option($key); }
}