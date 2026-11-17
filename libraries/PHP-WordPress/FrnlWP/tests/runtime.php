<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Core/Capability.php';
require_once __DIR__ . '/../src/Store/SemanticStore.php';
require_once __DIR__ . '/../src/Accessibility/AccessibilityValidator.php';
require_once __DIR__ . '/../src/Facade/FrnlFacade.php';
require_once __DIR__ . '/../src/Runtime.php';

function expect(bool $cond, string $msg): void {
    if (!$cond) throw new \RuntimeException("Assertion failed: $msg");
}

use FrnlWP\Runtime;
use FrnlWP\Accessibility\AccessibilityValidator;

// 1. Store test
$store = Runtime::createStore();
$store->registerEntity('btn-1', 'idle', ['label' => 'Click me']);
expect($store->entity('btn-1')['state'] === 'idle', 'initial entity state');

$store->setState('btn-1', 'loading');
expect($store->entity('btn-1')['state'] === 'loading', 'updated state');

// 2. Facade test
$facade = Runtime::createFacade($store);
$handled = false;
$store->on('btn-1', 'click', function($payload, $ctx) use (&$handled) {
    $handled = true;
    return 'clicked';
});
$result = $facade->event('btn-1', 'click');
expect($handled === true && $result === 'clicked', 'event handled via facade');

// 3. Accessibility test
$contract = [
    'nameRequired' => true,
    'role' => 'button',
    'focusable' => true,
    'requiredAttributes' => ['type'],
];
$issues = AccessibilityValidator::validate($contract, [
    'role' => 'button',
    'aria-label' => 'Submit form',
    'type' => 'submit',
]);
expect(empty($issues), 'valid accessibility passes');

$badIssues = AccessibilityValidator::validate($contract, [
    'role' => 'link', // role mismatch
    'tabindex' => -1, // focus suppressed
]);
expect(count($badIssues) >= 2, 'catches role mismatch and accessible name issues');

require_once __DIR__ . '/../src/Component/ComponentDefinition.php';
require_once __DIR__ . '/../src/FrontendApi/FrontendApi.php';
require_once __DIR__ . '/../src/Validation/FrnlValidatorEngine.php';

// 5. FrontendApi inspection & control invocation
$frontApi = Runtime::createFrontendApi($store, ['applicationId' => 'test-app']);
$snapshot = $frontApi->inspect();
expect($snapshot['apiVersion'] === 1, 'FrontendApi apiVersion is 1');
expect($snapshot['application']['id'] === 'test-app', 'FrontendApi app id matches');
expect($snapshot['componentCount'] >= 1, 'FrontendApi reports components');

$compSnap = $frontApi->inspectComponent('btn-1');
expect($compSnap['id'] === 'btn-1', 'Component snapshot id');
expect(isset($compSnap['controls']['setState']), 'Component has setState control');

$frontApi->invoke('btn-1', 'setState', 'completed');
expect($store->entity('btn-1')['state'] === 'completed', 'setState invoked via frontend API');

// 6. ComponentDefinition test
$def = \FrnlWP\Component\ComponentDefinition::define([
    'name' => 'FancyButton',
    'states' => [
        'default' => [
            'events' => ['click' => ['functionId' => 'fn_btn_click']],
            'phases' => [
                'sustainPhase' => ['visualDefinition' => ['parameters' => ['color' => '#fff']]],
            ],
        ],
    ],
]);
expect($def->getName() === 'FancyButton', 'ComponentDefinition name');
expect($def->getEventNames() === ['click'], 'ComponentDefinition event names');

// 7. FrnlValidatorEngine test
$validator = Runtime::createValidatorEngine(__DIR__ . '/../');
$valReport = $validator->validateAll();
expect($valReport['valid'] === true, 'Frnl validator engine passes valid project');

echo "All FrnlWP runtime tests passed successfully!\n";
