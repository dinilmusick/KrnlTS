<?php

declare(strict_types=1);

namespace KrnlWP\Protocol;
final class WordPressHttpAdapter {
    public function request(string $method,string $url,array $body=[]): array {
        $response=wp_remote_request($url,['method'=>strtoupper($method),'headers'=>['Content-Type'=>'application/json'],'body'=>wp_json_encode($body)]);
        if(is_wp_error($response)) throw new \RuntimeException($response->get_error_message());
        $data=json_decode((string)wp_remote_retrieve_body($response),true);
        return is_array($data)?$data:[];
    }
}