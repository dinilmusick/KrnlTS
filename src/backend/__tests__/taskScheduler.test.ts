/**
 * ASCII Architecture Flowchart: taskScheduler.test
 *
 *   ┌──────────────────────────────────┐
 *   │  Initialize taskScheduler.test   │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │             runTests             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            scheduler             │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │           cyclicTasks            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

// ══════════════════════════════════════════════════════════════════════════════════
// ════ AIKO TASK SCHEDULER COMPREHENSIVE TEST SUITE ═════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════════

import assert from 'node:assert';
import { TaskScheduler } from '../agentic/scheduler/TaskScheduler.js';
import { Task, TaskExecutor } from '../agentic/scheduler/types.js';

console.log('════ RUNNING AIKO TASK SCHEDULER TESTS ════\n');

async function runTests() {
  const scheduler = new TaskScheduler();

  console.log('1. Testing DAG cycle detection & validation rejections...');
  const cyclicTasks: Task[] = [
    { id: 'task-A', instruction: 'Do A', featureName: 'featA', dependsOn: ['task-C'] },
    { id: 'task-B', instruction: 'Do B', featureName: 'featB', dependsOn: ['task-A'] },
    { id: 'task-C', instruction: 'Do C', featureName: 'featC', dependsOn: ['task-B'] }
  ];

  const dummyExecutor: TaskExecutor = {
    execute: async () => ({ success: true, result: {} })
  };

  const cycleRes = await scheduler.execute({ tasks: cyclicTasks, executor: dummyExecutor });
  assert.strictEqual(cycleRes.success, false);
  assert.strictEqual(cycleRes.error?.kind, 'CYCLIC_DEPENDENCY');

  const duplicateTasks: Task[] = [
    { id: 't-1', instruction: 'Task 1', featureName: 'f1', dependsOn: [] },
    { id: 't-1', instruction: 'Task 1 duplicate', featureName: 'f2', dependsOn: [] }
  ];
  const dupRes = await scheduler.execute({ tasks: duplicateTasks, executor: dummyExecutor });
  assert.strictEqual(dupRes.success, false);
  assert.strictEqual(dupRes.error?.kind, 'DUPLICATE_TASK_ID');

  const selfDepTasks: Task[] = [
    { id: 't-self', instruction: 'Self dep', featureName: 'f1', dependsOn: ['t-self'] }
  ];
  const selfRes = await scheduler.execute({ tasks: selfDepTasks, executor: dummyExecutor });
  assert.strictEqual(selfRes.success, false);
  assert.strictEqual(selfRes.error?.kind, 'SELF_DEPENDENCY');

  const unknownDepTasks: Task[] = [
    { id: 't-1', instruction: 'T1', featureName: 'f1', dependsOn: ['t-ghost'] }
  ];
  const unkRes = await scheduler.execute({ tasks: unknownDepTasks, executor: dummyExecutor });
  assert.strictEqual(unkRes.success, false);
  assert.strictEqual(unkRes.error?.kind, 'UNKNOWN_DEPENDENCY');

  console.log('2. Testing independent branch parallelism & execution ordering...');
  const parallelTasks: Task[] = [
    { id: 'task-A', instruction: 'Fetch A', featureName: 'featA', dependsOn: [] },
    { id: 'task-B', instruction: 'Fetch B', featureName: 'featB', dependsOn: [] },
    { id: 'task-C', instruction: 'Process A', featureName: 'featC', dependsOn: ['task-A'] },
    { id: 'task-D', instruction: 'Process B', featureName: 'featD', dependsOn: ['task-B'] }
  ];

  const execLog: string[] = [];
  const trackingExecutor: TaskExecutor = {
    execute: async ({ task }) => {
      execLog.push(`START_${task.id}`);
      await new Promise(r => setTimeout(r, 20));
      execLog.push(`END_${task.id}`);
      return { success: true, result: { done: task.id } };
    }
  };

  const parRes = await scheduler.execute({ tasks: parallelTasks, executor: trackingExecutor });
  assert.strictEqual(parRes.success, true);
  assert.strictEqual(parRes.tasks.length, 4);
  assert.ok(execLog.indexOf('START_task-A') < execLog.indexOf('START_task-C'));
  assert.ok(execLog.indexOf('START_task-B') < execLog.indexOf('START_task-D'));

  console.log('3. Testing TaskReference result path extraction & injection...');
  let receivedContextKey = '';
  const contextTasks: Task[] = [
    { id: 'findUser', instruction: 'Find User', featureName: 'getUser', dependsOn: [] },
    {
      id: 'updateUser',
      instruction: 'Update User',
      featureName: 'updateUser',
      dependsOn: ['findUser'],
      inputFromTasks: [{ taskId: 'findUser', path: 'user.profile.id', targetContextKey: 'userId' }]
    }
  ];

  const contextExecutor: TaskExecutor = {
    execute: async ({ task, context }) => {
      if (task.id === 'findUser') {
        return { success: true, result: { user: { profile: { id: 'usr-4421' } } } };
      }
      receivedContextKey = context.userId as string;
      return { success: true, result: { updated: true } };
    }
  };

  const ctxRes = await scheduler.execute({ tasks: contextTasks, executor: contextExecutor });
  assert.strictEqual(ctxRes.success, true);
  assert.strictEqual(receivedContextKey, 'usr-4421');

  console.log('4. Testing failure propagation & unaffected branch survival...');
  const failureTasks: Task[] = [
    { id: 't-fail', instruction: 'Fails', featureName: 'fFail', dependsOn: [] },
    { id: 't-blocked', instruction: 'Blocked by fail', featureName: 'fBlocked', dependsOn: ['t-fail'] },
    { id: 't-ok1', instruction: 'Ok 1', featureName: 'fOk1', dependsOn: [] },
    { id: 't-ok2', instruction: 'Ok 2', featureName: 'fOk2', dependsOn: ['t-ok1'] }
  ];

  const failExecutor: TaskExecutor = {
    execute: async ({ task }) => {
      if (task.id === 't-fail') return { success: false, error: { kind: 'HTTP', message: 'API 500' } };
      return { success: true, result: { ok: true } };
    }
  };

  const failRes = await scheduler.execute({ tasks: failureTasks, executor: failExecutor });
  assert.strictEqual(failRes.success, false);
  const failTask = failRes.tasks.find(t => t.taskId === 't-fail');
  const blockedTask = failRes.tasks.find(t => t.taskId === 't-blocked');
  const ok1Task = failRes.tasks.find(t => t.taskId === 't-ok1');
  const ok2Task = failRes.tasks.find(t => t.taskId === 't-ok2');

  assert.strictEqual(failTask?.state, 'FAILED');
  assert.strictEqual(blockedTask?.state, 'BLOCKED');
  assert.strictEqual(ok1Task?.state, 'SUCCESS');
  assert.strictEqual(ok2Task?.state, 'SUCCESS');

  console.log('5. Testing concurrency limit option...');
  let maxActive = 0;
  let currentActive = 0;
  const concTasks: Task[] = [
    { id: 'c1', instruction: 'C1', featureName: 'f', dependsOn: [] },
    { id: 'c2', instruction: 'C2', featureName: 'f', dependsOn: [] },
    { id: 'c3', instruction: 'C3', featureName: 'f', dependsOn: [] },
    { id: 'c4', instruction: 'C4', featureName: 'f', dependsOn: [] }
  ];

  const concExecutor: TaskExecutor = {
    execute: async () => {
      currentActive++;
      maxActive = Math.max(maxActive, currentActive);
      await new Promise(r => setTimeout(r, 25));
      currentActive--;
      return { success: true };
    }
  };

  await scheduler.execute({ tasks: concTasks, executor: concExecutor, options: { maxConcurrency: 2 } });
  assert.strictEqual(maxActive, 2);

  console.log('✅ ALL AIKO TASK SCHEDULER TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ AIKO TASK SCHEDULER TESTS FAILED:');
  console.error(err);
  process.exit(1);
});

assert.strictEqual(true, true);
