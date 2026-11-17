<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Element/Element.php';
require_once __DIR__ . '/../src/Element/Button.php';
require_once __DIR__ . '/../src/Element/Container.php';
require_once __DIR__ . '/../src/Element/Heading.php';
require_once __DIR__ . '/../src/Element/Graph.php';
require_once __DIR__ . '/../src/Element/Card.php';
require_once __DIR__ . '/../src/Element/Badge.php';
require_once __DIR__ . '/../src/Element/Input.php';
require_once __DIR__ . '/../src/Element/Select.php';
require_once __DIR__ . '/../src/Element/Textarea.php';
require_once __DIR__ . '/../src/Element/Toggle.php';
require_once __DIR__ . '/../src/Canvas/Canvas.php';
require_once __DIR__ . '/../src/Canvas/Dock.php';
require_once __DIR__ . '/../src/Canvas/TileMenu.php';

function expect(bool $cond, string $msg): void {
    if (!$cond) throw new \RuntimeException("Assertion failed: $msg");
}

use FloksWP\Element\{Button, Container, Heading, Graph, Card, Badge, Input, Select, Textarea, Toggle};
use FloksWP\Canvas\{Canvas, Dock, TileMenu};

// Element tests
$elements = [
    new Button(), new Container(), new Heading(), new Graph(),
    new Card(), new Badge(), new Input(), new Select(), new Textarea(), new Toggle()
];

foreach ($elements as $el) {
    expect(str_starts_with($el->get_name(), 'flokswp-'), "Element name valid: {$el->get_name()}");
    expect($el->get_categories() === ['flokswp'], "Element category is flokswp: {$el->get_name()}");
}

// Canvas tests
$canvas = new Canvas();
$canvas->add('node-1', 100.0, 200.0, ['label' => 'Start']);
expect(isset($canvas->nodes()['node-1']), 'canvas add node');

$dock = new Dock();
$dock->add('tool-1', 'Pointer');
expect(count($dock->items()) === 1, 'dock add item');

$menu = new TileMenu();
$menu->add('tile-1', 'Workspace', 'eicon-folder');
expect(count($menu->tiles()) === 1, 'tile menu add tile');

require_once __DIR__ . '/../src/Ai/DirectChatWidget.php';
require_once __DIR__ . '/../src/Ai/ModelPickerWidget.php';
require_once __DIR__ . '/../src/Ai/KeyManagerWidget.php';
require_once __DIR__ . '/../src/Canvas/FodCanvas.php';
require_once __DIR__ . '/../src/Canvas/AikoCanvas.php';
require_once __DIR__ . '/../src/Canvas/OmniCanvas.php';
require_once __DIR__ . '/../src/Theme/ThemePackLoader.php';
require_once __DIR__ . '/../src/Theme/TokenMapper.php';

// AI widgets
$chat = new \FloksWP\Ai\DirectChatWidget();
expect($chat->get_name() === 'flokswp_direct_chat', 'DirectChatWidget name');
$picker = new \FloksWP\Ai\ModelPickerWidget();
expect($picker->get_name() === 'flokswp_model_picker', 'ModelPickerWidget name');
$keyMgr = new \FloksWP\Ai\KeyManagerWidget();
expect($keyMgr->get_name() === 'flokswp_key_manager', 'KeyManagerWidget name');

// OmniCanvas & FOD/Aiko canvas
$fodCanvas = new \FloksWP\Canvas\FodCanvas('canvas-1', [['id' => 'n1']], [['id' => 'w1']]);
$fodHtml = $fodCanvas->render();
expect(str_contains($fodHtml, 'floks-fod-canvas'), 'FodCanvas renders HTML container');

$aikoCanvas = new \FloksWP\Canvas\AikoCanvas('conv-123');
$aikoHtml = $aikoCanvas->render();
expect(str_contains($aikoHtml, 'data-conversation-id="conv-123"'), 'AikoCanvas renders conversation');

$omniFod = new \FloksWP\Canvas\OmniCanvas('fod');
expect(str_contains($omniFod->render(), 'floks-fod-canvas'), 'OmniCanvas renders FOD mode');

$omniAiko = new \FloksWP\Canvas\OmniCanvas('aiko');
expect(str_contains($omniAiko->render(), 'floks-aiko-canvas'), 'OmniCanvas renders Aiko mode');

// Themes
\FloksWP\Theme\ThemePackLoader::loadTheme('dark', ['colors' => ['bg' => '#000', 'text' => '#fff']]);
expect(\FloksWP\Theme\ThemePackLoader::getTheme('dark') !== null, 'ThemePackLoader registers theme');

$css = \FloksWP\Theme\TokenMapper::toCssVariables(['colors' => ['primary' => '#0073aa']]);
expect(str_contains($css, '--floks-colors-primary: #0073aa;'), 'TokenMapper generates CSS variables');

echo "All FloksWP element, canvas, AI widget, and theme tests passed successfully!\n";
