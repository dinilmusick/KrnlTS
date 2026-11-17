<?php

declare(strict_types=1);

namespace KloksWP\Backend;
final class AuthService {
    public function currentUser():?\WP_User{$user=wp_get_current_user();return $user&&$user->exists()?$user:null;}
    public function can(string $capability,int $userId=0):bool{return user_can($userId?:get_current_user_id(),$capability);}
}