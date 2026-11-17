<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/Arrays/Arrays.php';
require_once __DIR__ . '/../src/Arrays.php';
require_once __DIR__ . '/../src/Strings/Strings.php';
require_once __DIR__ . '/../src/Strings.php';
require_once __DIR__ . '/../src/Numbers/Numbers.php';
require_once __DIR__ . '/../src/Objects/Objects.php';
require_once __DIR__ . '/../src/Collections/Collections.php';
require_once __DIR__ . '/../src/Api/ApiTypes.php';
require_once __DIR__ . '/../src/Api/ApiRegistry.php';
require_once __DIR__ . '/../src/Api/FodRuntime.php';
require_once __DIR__ . '/../src/Models/ModelTypes.php';
require_once __DIR__ . '/../src/Models/ModelRegistry.php';
require_once __DIR__ . '/../src/SemanticInput/SemanticInputSchema.php';
require_once __DIR__ . '/../src/SemanticInput/SemanticInputResolution.php';
require_once __DIR__ . '/../src/SemanticInput/SemanticInputResolver.php';

function expect(bool $cond, string $msg): void {
    if (!$cond) throw new \RuntimeException("Assertion failed: $msg");
}

// Arrays tests
use GutWP\Arrays\Arrays;
expect(Arrays::isList([1, 2, 3]), 'isList');
expect(!Arrays::isList(['a' => 1]), '!isList assoc');
expect(Arrays::first([10, 20]) === 10, 'first');
expect(Arrays::last([10, 20]) === 20, 'last');
expect(Arrays::compact([1, null, 2, null, 3]) === [1, 2, 3], 'compact');
expect(Arrays::unique([1, 2, 2, 3]) === [1, 2, 3], 'unique');
expect(Arrays::chunk([1, 2, 3, 4], 2) === [[1, 2], [3, 4]], 'chunk');
expect(Arrays::flatten([[1, 2], 3, [4]]) === [1, 2, 3, 4], 'flatten');

// Strings tests
use GutWP\Strings\Strings;
expect(Strings::isBlank('   '), 'isBlank');
expect(Strings::isNonBlank('hello'), 'isNonBlank');
expect(Strings::isEmail('test@example.com'), 'isEmail');
expect(Strings::startsWithAny('foobar', ['baz', 'foo']), 'startsWithAny');
expect(Strings::endsWithAny('foobar', ['bar', 'qux']), 'endsWithAny');
expect(Strings::capitalize('hello') === 'Hello', 'capitalize');
expect(Strings::camelCase('hello-world_test') === 'helloWorldTest', 'camelCase');
expect(Strings::kebabCase('helloWorldTest') === 'hello-world-test', 'kebabCase');
expect(Strings::snakeCase('helloWorldTest') === 'hello_world_test', 'snakeCase');
expect(Strings::truncate('hello world', 8) === 'hello...', 'truncate');
expect(Strings::truncateWords('one two three four', 2) === 'one two...', 'truncateWords');

// Numbers tests
use GutWP\Numbers\Numbers;
expect(Numbers::clamp(15, 0, 10) === 10, 'clamp max');
expect(Numbers::clamp(-5, 0, 10) === 0, 'clamp min');
expect(Numbers::between(5, 0, 10), 'between');
expect(Numbers::roundTo(3.14159, 2) === 3.14, 'roundTo');
expect(Numbers::isFinite(42), 'isFinite');
expect(Numbers::sum([1, 2, 3, 4]) === 10, 'sum');

// Objects tests
use GutWP\Objects\Objects;
$data = ['name' => 'Alice', 'role' => 'admin', 'status' => 'active'];
expect(Objects::pick($data, ['name', 'role']) === ['name' => 'Alice', 'role' => 'admin'], 'pick');
expect(Objects::omit($data, ['status']) === ['name' => 'Alice', 'role' => 'admin'], 'omit');
expect(Objects::isPlainObject(['a' => 1]), 'isPlainObject assoc');
expect(!Objects::isPlainObject([1, 2, 3]), 'isPlainObject list false');

// Collections tests
use GutWP\Collections\Collections;
expect(Collections::map([1, 2, 3], fn($x) => $x * 2) === [2, 4, 6], 'map');
expect(Collections::filter([1, 2, 3, 4], fn($x) => $x % 2 === 0) === [2, 4], 'filter');

// API Registry & FodRuntime tests
use GutWP\Api\ApiRegistry;
use GutWP\Api\FodRuntime;
expect(ApiRegistry::has('gutwp.arrays.chunk'), 'has array.chunk api');
$chunked = FodRuntime::executeGutApi('gutwp.arrays.chunk', ['values' => [1, 2, 3, 4], 'size' => 2]);
expect($chunked === [[1, 2], [3, 4]], 'FodRuntime executes chunk');

// Models Registry tests
use GutWP\Models\ModelRegistry;
expect(ModelRegistry::has('needle3'), 'has needle3 model');
expect(ModelRegistry::has('smollm2'), 'has smollm2 model');
expect(ModelRegistry::get('needle3')->provider === 'UltrstArmada', 'needle3 provider');

// SemanticInput tests
use GutWP\SemanticInput\SemanticInputSchema;
use GutWP\SemanticInput\SemanticInputResolver;
$emailSchema = new SemanticInputSchema('string', 'email');
$res = SemanticInputResolver::resolve('admin@example.com', $emailSchema);
expect($res->status === 'resolved' && $res->value === 'admin@example.com', 'deterministic email resolved');

$enumSchema = new SemanticInputSchema('string', null, null, [], [], ['active', 'inactive', 'pending']);
$enumRes = SemanticInputResolver::resolve('ACTIVE', $enumSchema);
expect($enumRes->status === 'resolved' && $enumRes->value === 'active', 'case-insensitive enum resolved');

echo "All GutWP 1.3.2 utility, API, Model, and SemanticInput tests passed successfully!\n";
