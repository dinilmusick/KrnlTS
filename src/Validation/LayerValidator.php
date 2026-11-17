<?php

declare(strict_types=1);

namespace SkipoWP\Validation;
final class LayerValidator {
    public function validate(array $dependencies):array{
        $forbidden=['KrnlWP'=>['FrnlWP','FloksWP','SkipoWP'],'FrnlWP'=>['FloksWP','SkipoWP'],'KloksWP'=>['FloksWP','SkipoWP'],'FloksWP'=>['SkipoWP'],'GutWP'=>['KrnlWP','FrnlWP','KloksWP','FloksWP','SkipoWP']];
        $errors=[];foreach($dependencies as $from=>$imports)foreach((array)$imports as $to)if(in_array($to,$forbidden[$from]??[],true))$errors[]="$from cannot depend on $to";return $errors;
    }
}