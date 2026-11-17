<?php

declare(strict_types=1);

namespace KrnlWP\Service;
final class ServiceGenerator {
    public function definition(string $id,string $name,string $version,array $operations=[]): Definition {
        return new Definition($id,$name,$version,$operations);
    }
    public function service(Definition $definition): WordPressService{return new WordPressService($definition);}
}