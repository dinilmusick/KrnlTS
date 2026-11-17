<?php

declare(strict_types=1);

namespace KrnlWP\Validation;

use PhpParser\Node;
use PhpParser\ParserFactory;

final class ArchitectureValidator {
    public function validate(string $code,array $forbiddenNamespaces=[]): array {
        $parser=(new ParserFactory())->createForNewestSupportedVersion();
        $errors=[];
        try { $nodes=$parser->parse($code)??[]; }
        catch(\Throwable $e) { return ['Parse error: '.$e->getMessage()]; }
        foreach($nodes as $node) {
            if(!$node instanceof Node\Stmt\Use_) continue;
            foreach($node->uses as $use) {
                foreach($forbiddenNamespaces as $prefix) {
                    if(str_starts_with($use->name->toString(),$prefix)) $errors[]='Forbidden dependency: '.$use->name->toString();
                }
            }
        }
        return $errors;
    }
}