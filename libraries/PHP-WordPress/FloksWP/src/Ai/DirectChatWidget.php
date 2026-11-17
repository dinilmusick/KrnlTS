<?php

declare(strict_types=1);

namespace FloksWP\Ai;

use FloksWP\Element\Element;

/**
 * Direct chat interface widget connecting to KloksWP/Aiko.
 */
class DirectChatWidget extends Element
{
    public function get_name(): string
    {
        return 'flokswp_direct_chat';
    }

    public function get_title(): string
    {
        return 'AI Direct Chat';
    }

    public function get_icon(): string
    {
        return 'eicon-comments';
    }

    protected function render(): void
    {
        $settings = $this->get_settings_for_display();
        $placeholder = htmlspecialchars($settings['placeholder'] ?? 'Type a message...', ENT_QUOTES, 'UTF-8');
        $endpoint = htmlspecialchars($settings['endpoint'] ?? '/wp-json/kloks/v1/aiko/chat', ENT_QUOTES, 'UTF-8');

        echo '<div class="floks-direct-chat" data-endpoint="' . $endpoint . '">';
        echo '  <div class="floks-chat-history"></div>';
        echo '  <form class="floks-chat-form" onsubmit="event.preventDefault();">';
        echo '    <input type="text" class="floks-chat-input" placeholder="' . $placeholder . '" />';
        echo '    <button type="submit" class="floks-chat-send">Send</button>';
        echo '  </form>';
        echo '</div>';
    }
}
