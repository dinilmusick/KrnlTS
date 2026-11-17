<?php

declare(strict_types=1);

namespace KloksWP\Functions;
final class CacheFunctions { public static function swr(TTLCache $cache,mixed $key,callable $fetch):mixed{$v=$cache->get($key);if($v!==null){$fresh=$fetch();$cache->set($key,$fresh);return $v;} $v=$fetch();$cache->set($key,$v);return $v;} }