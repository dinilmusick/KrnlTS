<?php

declare(strict_types=1);

namespace KloksWP\Backend;
final class WorkspaceService {
    public function create(string $name):int{$post=wp_insert_post(['post_type'=>'page','post_title'=>$name,'post_status'=>'draft'],true);if(is_wp_error($post))throw new \RuntimeException($post->get_error_message());return (int)$post;}
    public function update(int $id,array $data):int{$data['ID']=$id;$result=wp_update_post($data,true);if(is_wp_error($result))throw new \RuntimeException($result->get_error_message());return (int)$result;}
}