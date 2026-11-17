<?php

declare(strict_types=1);

namespace FloksWP\Ai;

use FloksWP\Element\Element;

/**
 * Key Manager widget for configuring AI provider credentials in admin / settings panels.
 */
class KeyManagerWidget extends Element
{
    public function get_name(): string
    {
        return 'flokswp_key_manager';
    }

    public function get_title(): string
    {
        return 'AI Key Manager';
    }

    public function get_icon(): string
    {
        return 'eicon-lock-user';
    }

    protected function render(): void
    {
        $providers = ['google' => 'Google Gemini', 'openai' => 'OpenAI', 'anthropic' => 'Anthropic'];

        echo '<div class="floks-key-manager">';
        echo '<h3>Configure AI Provider Keys</h3>';
        echo '<form method="post" action="">';
        foreach ($providers as $slug => $label) {
            echo '<div class="floks-key-field">';
            echo '  <label for="key_' . $slug . '">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . ' API Key:</label>';
            echo '  <input type="password" id="key_' . $slug . '" name="api_keys[' . $slug . ']" placeholder="Enter key..." />';
            echo '</div>';
        }
        echo '  <button type="submit" class="floks-button">Save Credentials</button>';
        echo '</form>';
        echo '</div>';
    }
}
