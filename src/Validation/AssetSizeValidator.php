<?php

declare(strict_types=1);

namespace SkipoWP\Validation;
final class AssetSizeValidator {
    public const MAX_LINES=200;
    public function validate(string $content,string $path=''):array{$lines=substr_count($content,"\n")+1;return $lines>self::MAX_LINES?["$path exceeds 200 lines ($lines)"]:[];}
}