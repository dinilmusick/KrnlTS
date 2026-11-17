<?php

declare(strict_types=1);

namespace KrnlWP\Connectivity;
final class ProtocolResolver {
    public function resolve(array $endpoints, array $preferred=[]): ?array {
        foreach($preferred as $protocol) foreach($endpoints as $endpoint)
            if(($endpoint['protocol']??null)===$protocol)return $endpoint;
        return $endpoints[0]??null;
    }
}