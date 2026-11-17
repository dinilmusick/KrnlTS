<?php

declare(strict_types=1);

namespace FloksWP\Ai;

use FloksWP\Element\Element;

/**
 * Model picker widget offering dynamic model selection from KloksWP.
 */
class ModelPickerWidget extends Element
{
    public function get_name(): string
    {
        return 'flokswp_model_picker';
    }

    public function get_title(): string
    {
        return 'AI Model Picker';
    }

    public function get_icon(): string
    {
        return 'eicon-select';
    }

    protected function render(): void
    {
        $settings = $this->get_settings_for_display();
        $selected = $settings['default_model'] ?? 'gemini-1.5-pro';
        $models = [
            'gemini-1.5-pro' => 'Gemini 1.5 Pro (2M ctx)',
            'gemini-1.5-flash' => 'Gemini 1.5 Flash (Fast)',
            'gpt-4o' => 'GPT-4o (OpenAI)',
            'claude-3-5-sonnet' => 'Claude 3.5 Sonnet',
        ];

        echo '<div class="floks-model-picker">';
        echo '<label class="floks-model-label">Select Active AI Model:</label>';
        echo '<select class="floks-model-select" name="active_ai_model">';
        foreach ($models as $id => $label) {
            $sel = ($id === $selected) ? ' selected' : '';
            echo '<option value="' . htmlspecialchars($id, ENT_QUOTES, 'UTF-8') . '"' . $sel . '>' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</option>';
        }
        echo '</select>';
        echo '</div>';
    }
}
