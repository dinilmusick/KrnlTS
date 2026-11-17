<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/StateGraph/NodeArchetypeRegistry.php';
require_once __DIR__ . '/../src/StateGraph/ConnectionRuleStore.php';
require_once __DIR__ . '/../src/StateGraph/WireValidation.php';

function expect(bool $cond, string $msg): void {
    if (!$cond) throw new \RuntimeException("Assertion failed: $msg");
}

use KloksWP\StateGraph\NodeArchetypeRegistry;
use KloksWP\StateGraph\ConnectionRuleStore;
use KloksWP\StateGraph\WireValidation;

$registry = new NodeArchetypeRegistry();
expect($registry->has('trigger'), 'has trigger archetype');
expect($registry->has('effect'), 'has effect archetype');
expect(count($registry->byCategory('event')) >= 1, 'category filtering works');

$rules = new ConnectionRuleStore();
expect($rules->isAllowed('trigger', 'effect'), 'trigger -> effect allowed');
expect(!$rules->isAllowed('audio', 'control'), 'audio -> control disallowed by default');

$validator = new WireValidation($rules, $registry);
$nodes = [
    'n1' => ['id' => 'n1', 'type' => 'trigger'],
    'n2' => ['id' => 'n2', 'type' => 'effect'],
    'n3' => ['id' => 'n3', 'type' => 'audio'],
];

$validWire = $validator->validateWire($nodes, ['sourceNode' => 'n1', 'targetNode' => 'n2']);
expect($validWire['valid'] === true, 'valid wire passed');

$selfWire = $validator->validateWire($nodes, ['sourceNode' => 'n1', 'targetNode' => 'n1']);
expect($selfWire['valid'] === false, 'self wire rejected');

$invalidWire = $validator->validateWire($nodes, ['sourceNode' => 'n3', 'targetNode' => 'n2']);
expect($invalidWire['valid'] === false, 'incompatible wire rejected');

require_once __DIR__ . '/../src/Ai/AiProvider.php';
require_once __DIR__ . '/../src/Ai/AiInference.php';
require_once __DIR__ . '/../src/Ai/AiModelRegistry.php';
require_once __DIR__ . '/../src/Ai/KeyManager.php';
require_once __DIR__ . '/../src/Aiko/MessageEnvelope.php';
require_once __DIR__ . '/../src/Aiko/ConversationContext.php';
require_once __DIR__ . '/../src/Aiko/AikoBridge.php';
require_once __DIR__ . '/../src/Fod/FodNodeProvider.php';
require_once __DIR__ . '/../src/Fod/FodEvaluator.php';
require_once __DIR__ . '/../src/SemanticRuntime/SemanticEntityPersistence.php';
require_once __DIR__ . '/../src/SemanticRuntime/SemanticMemory.php';
require_once __DIR__ . '/../src/StateGraph/Spatial/SpatialEngine.php';
require_once __DIR__ . '/../src/StateGraph/Store/GraphStore.php';

// AI & Models
expect(\KloksWP\Ai\AiModelRegistry::has('gemini-1.5-pro'), 'AiModelRegistry has gemini-1.5-pro');
$inference = new \KloksWP\Ai\AiInference();
$infResult = $inference->infer('Hello world');
expect($infResult['status'] === 'success', 'AiInference execution succeeds');

// Aiko Bridge
$aiko = new \KloksWP\Aiko\AikoBridge();
$aikoRes = $aiko->chat('conv-1', 'Test message');
expect($aikoRes['conversationId'] === 'conv-1', 'Aiko conversation tracked');
expect(!empty($aikoRes['reply']), 'Aiko response generated');

// FOD Evaluation
\KloksWP\Fod\FodNodeProvider::register('double', fn($inputs) => ($inputs['val'] ?? 1) * 2);
$evaluator = new \KloksWP\Fod\FodEvaluator();
$graphResult = $evaluator->evaluate([
    'nodes' => [
        ['id' => 'n_dbl', 'type' => 'double'],
    ],
    'wires' => [
        ['sourceNodeId' => 'input_val', 'targetNodeId' => 'n_dbl', 'targetPort' => 'val'],
    ],
], ['input_val' => 5]);
expect($graphResult['n_dbl'] === 10, 'FodEvaluator graph execution succeeds');

// Semantic Memory
$mem = new \KloksWP\SemanticRuntime\SemanticMemory();
$mem->remember('user_pref', 'dark_mode', ['ui', 'theme']);
expect($mem->recall('user_pref') === 'dark_mode', 'SemanticMemory recall');
expect(count($mem->recallByTag('theme')) === 1, 'SemanticMemory recallByTag');

// Spatial Engine
$spatial = new \KloksWP\StateGraph\Spatial\SpatialEngine();
$spatial->setViewport(10.0, 10.0, 2.0);
$world = $spatial->screenToWorld(20.0, 20.0);
expect($world['x'] === 5.0 && $world['y'] === 5.0, 'SpatialEngine screenToWorld');

// Graph Store
$gStore = new \KloksWP\StateGraph\Store\GraphStore();
$gStore->addNode('node-1', 'trigger', ['x' => 10, 'y' => 20]);
expect(count($gStore->getNodes()) === 1, 'GraphStore addNode');

echo "All KloksWP StateGraph, AI, Aiko, FOD, and Semantic tests passed successfully!\n";
