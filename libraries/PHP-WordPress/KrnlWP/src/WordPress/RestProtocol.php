<?php

declare(strict_types=1);

namespace KrnlWP\WordPress;

use KrnlWP\Contract\ProtocolAdapter;
use RuntimeException;

final class RestProtocol implements ProtocolAdapter {
    public function __construct(private string $namespace='krnlwp/v1') {}
    public function call(string $service,string $operation,array $input=[]): mixed {
        $response=wp_remote_post(rest_url($this->namespace.'/'.$service.'/'.$operation),[
            'headers'=>['Content-Type'=>'application/json'],
            'body'=>wp_json_encode($input),
        ]);
        if(is_wp_error($response)) throw new RuntimeException($response->get_error_message());
        $code=wp_remote_retrieve_response_code($response);
        $body=json_decode((string)wp_remote_retrieve_body($response),true);
        if($code>=400) throw new RuntimeException((string)($body['message']??'Remote service error'));
        return $body;
    }
}