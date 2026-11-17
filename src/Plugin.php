<?php
declare(strict_types=1);

namespace FloksWP;

use FloksWP\Element\{Button, Container, Heading, Graph, Card, Badge, Input, Select, Textarea, Toggle};
use FloksWP\Widget\Panel;
use FloksWP\Ai\{DirectChatWidget, ModelPickerWidget, KeyManagerWidget};

final class Plugin {
    public const VERSION = '1.13.4';

    public function register(): void {
        if (!class_exists('Elementor\\Plugin')) return;

        add_action('elementor/elements/categories_registered', function($manager): void {
            $manager->add_category('flokswp', ['title' => 'FloksWP']);
        });

        add_action('elementor/widgets/register', function($manager): void {
            $widgets = [
                new Button(),
                new Container(),
                new Heading(),
                new Graph(),
                new Card(),
                new Badge(),
                new Input(),
                new Select(),
                new Textarea(),
                new Toggle(),
                new Panel(),
                new DirectChatWidget(),
                new ModelPickerWidget(),
                new KeyManagerWidget(),
            ];
            foreach ($widgets as $widget) {
                $manager->register($widget);
            }
        });
    }
}