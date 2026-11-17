<?php

declare(strict_types=1);

namespace KloksWP\Backend;
final class StorageService {
    public function option(string $key,mixed $default=null):mixed{return get_option($key,$default);}
    public function saveOption(string $key,mixed $value):bool{return update_option($key,$value,false);}
    public function postMeta(int $id,string $key,mixed $default=null):mixed{return get_post_meta($id,$key,true)?:$default;}
}