<?php

declare(strict_types=1);

namespace KloksWP\Backend;
final class ConnectivityService {
    public function post(string $url,array $payload=[]):array{$r=wp_remote_post($url,['headers'=>['Content-Type'=>'application/json'],'body'=>wp_json_encode($payload)]);if(is_wp_error($r))throw new \RuntimeException($r->get_error_message());return ['status'=>wp_remote_retrieve_response_code($r),'body'=>json_decode((string)wp_remote_retrieve_body($r),true)];}
}