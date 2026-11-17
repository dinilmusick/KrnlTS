<?php

declare(strict_types=1);

namespace KloksWP\Services;

final class MetaStore {
    public function get(int $objectId,string $key,mixed $default=null): mixed {
        $value=get_post_meta($objectId,$key,true);
        return $value===''?$default:$value;
    }
    public function set(int $objectId,string $key,mixed $value): bool {
        return update_post_meta($objectId,$key,$value)!==false;
    }
    public function delete(int $objectId,string $key): bool { return delete_post_meta($objectId,$key); }
}