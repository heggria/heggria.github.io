import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBaseline, nodes, runScenario } from './flow-lab.ts'

test('baseline and reset contain five completed nodes with saved values', () => {
  const baseline = createBaseline()
  assert.deepEqual(baseline.totals, { completed: 5, rerun: 0, reused: 0, cutoff: 0 })
  for (const node of nodes) {
    assert.equal(baseline.nodes[node.id].status, 'completed')
    assert.ok(baseline.nodes[node.id].input)
    assert.ok(baseline.nodes[node.id].output)
    assert.ok(baseline.nodes[node.id].reason)
  }
  runScenario('changed')
  runScenario('unchanged')
  assert.deepEqual(runScenario('baseline'), baseline)
})

test('a changed draft output propagates through review and report only', () => {
  const baseline = createBaseline()
  const changed = runScenario('changed')
  assert.deepEqual(changed.totals, { completed: 0, rerun: 3, reused: 2, cutoff: 0 })
  for (const id of ['draft', 'review', 'report'] as const) {
    const node = changed.nodes[id]
    assert.equal(node.status, 'rerun')
    assert.notEqual(node.input, baseline.nodes[id].input)
    assert.notEqual(node.output, baseline.nodes[id].output)
    if (node.status === 'rerun') assert.equal(node.outputChanged, true)
  }
  for (const id of ['source', 'links'] as const) {
    const node = changed.nodes[id]
    assert.equal(node.status, 'reused')
    if (node.status === 'reused') assert.equal(node.reuseCause, 'outside-frontier')
    assert.equal(node.input, baseline.nodes[id].input)
    assert.equal(node.output, baseline.nodes[id].output)
  }
  assert.ok(changed.nodes.review.output.includes(changed.nodes.draft.output))
  assert.ok(changed.nodes.report.output.includes(changed.nodes.review.output))
  assert.ok(changed.nodes.report.output.includes(baseline.nodes.links.output))
})

test('unchanged forced seed cuts off every transitive frontier node', () => {
  const baseline = createBaseline()
  const same = runScenario('unchanged')
  assert.deepEqual(same.totals, { completed: 0, rerun: 1, reused: 2, cutoff: 2 })
  assert.equal(same.nodes.draft.status, 'rerun')
  assert.equal(same.nodes.draft.input, baseline.nodes.draft.input)
  if (same.nodes.draft.status === 'rerun') assert.equal(same.nodes.draft.outputChanged, false)
  assert.equal(same.nodes.review.status, 'cutoff')
  if (same.nodes.review.status === 'cutoff') assert.equal(same.nodes.review.boundary, 'unchanged-input')
  assert.equal(same.nodes.report.status, 'cutoff')
  if (same.nodes.report.status === 'cutoff') assert.equal(same.nodes.report.boundary, 'unchanged-input')
  for (const node of nodes) assert.equal(same.nodes[node.id].output, baseline.nodes[node.id].output)
  for (const id of ['source', 'links', 'review', 'report'] as const) {
    assert.equal(same.nodes[id].input, baseline.nodes[id].input)
  }
})

test('all scenarios are deterministic, independent, and account for every node exactly once', () => {
  for (const scenario of ['baseline', 'changed', 'unchanged'] as const) {
    const first = runScenario(scenario)
    for (let i = 0; i < 5; i += 1) {
      runScenario('changed')
      runScenario('unchanged')
      assert.deepEqual(runScenario(scenario), first)
    }
    assert.equal(Object.values(first.totals).reduce((sum, count) => sum + count, 0), 5)
    assert.equal(Object.keys(first.nodes).length, 5)
    assert.ok(first.explanation)
    for (const node of nodes) assert.ok(first.nodes[node.id].reason)
    // Mutating a returned value must not corrupt later runs or reset.
    first.nodes.draft.output = 'modified by caller'
    assert.notEqual(runScenario(scenario).nodes.draft.output, 'modified by caller')
  }
})
