/** A local, deterministic illustration of Recompute; no execution or network I/O. */
export type NodeId = 'source' | 'draft' | 'links' | 'review' | 'report'
export type Scenario = 'baseline' | 'changed' | 'unchanged'
export type NodeStatus = 'completed' | 'rerun' | 'reused' | 'cutoff'

export const nodes: readonly { id: NodeId; label: string; number: string; parents: readonly NodeId[] }[] = [
  { id: 'source', label: '读取资料', number: '01', parents: [] },
  { id: 'draft', label: '生成摘要', number: '02', parents: ['source'] },
  { id: 'links', label: '检查链接', number: '03', parents: ['source'] },
  { id: 'review', label: '审查摘要', number: '04', parents: ['draft'] },
  { id: 'report', label: '汇总结果', number: '05', parents: ['review', 'links'] },
]

export const statusLabels: Record<NodeStatus, string> = {
  completed: '已完成', rerun: '重新计算', reused: '复用结果', cutoff: '提前截断',
}

interface NodeValue {
  id: NodeId
  /** Canonical effective inputs, including this node's phase instruction. */
  input: string
  output: string
  reason: string
}
export type NodeState = NodeValue & (
  | { status: 'completed' }
  | { status: 'rerun'; outputChanged: boolean }
  | { status: 'reused'; reuseCause: 'outside-frontier' }
  | { status: 'cutoff'; boundary: 'unchanged-input' }
)
export interface LabState {
  scenario: Scenario
  explanation: string
  nodes: Record<NodeId, NodeState>
  totals: Record<NodeStatus, number>
}

const instructions: Record<NodeId, string> = {
  source: '读取固定资料', draft: '提取核心结论', links: '检查资料中的链接',
  review: '审查摘要', report: '合并审查与链接结果',
}
const explanations: Record<Scenario, string> = {
  baseline: '基线已完成。选择一个情景，从这份基线观察哪些节点需要重新计算。',
  changed: '摘要指令与输出都变了：生成摘要 → 审查摘要 → 汇总结果重新计算；读取资料、检查链接复用。',
  unchanged: '强制重新生成摘要，但输出相同：受影响范围内的审查与汇总输入都未变，均提前截断；资料和链接分支直接复用。',
}
const baselineReasons: Record<NodeId, string> = {
  source: '固定资料已读取，作为摘要与链接两条分支共同的基线输入。',
  draft: '根据读取的资料与摘要阶段指令，生成基线摘要；输出供审查节点使用。',
  links: '根据读取的资料，完成基线链接检查；这条分支与摘要分支独立。',
  review: '根据生成的摘要，完成基线审查；输出供汇总节点使用。',
  report: '合并审查结果与链接检查结果，保存完整的基线报告。',
}

function effectiveInput(parents: readonly NodeId[], values: Record<NodeId, NodeState>, instruction: string) {
  return JSON.stringify([instruction, ...parents.map((parent) => values[parent].output)])
}

function evaluate(id: NodeId, values: Record<NodeId, NodeState>, expanded = false): string {
  switch (id) {
    case 'source': return '资料：增量计算只处理受影响的部分；参考链接 /notes/incremental。'
    case 'draft': return expanded ? '摘要：输入变化后，仅重算受影响的节点；输出相同则停止传播。' : '摘要：仅重算受影响的节点。'
    case 'links': return '链接检查：/notes/incremental 可用（固定示例）。'
    case 'review': return `审查通过｜${values.draft.output}`
    case 'report': return `${values.review.output}\n${values.links.output}`
  }
}

export function createBaseline(): LabState {
  const values = {} as Record<NodeId, NodeState>
  for (const node of nodes) {
    values[node.id] = {
      id: node.id, status: 'completed',
      input: effectiveInput(node.parents, values, instructions[node.id]),
      output: evaluate(node.id, values),
      reason: baselineReasons[node.id],
    }
  }
  return finish('baseline', values)
}

function finish(scenario: Scenario, values: Record<NodeId, NodeState>): LabState {
  const totals: LabState['totals'] = { completed: 0, rerun: 0, reused: 0, cutoff: 0 }
  for (const node of nodes) totals[values[node.id].status] += 1
  return { scenario, explanation: explanations[scenario], nodes: values, totals }
}

/** Each scenario compares with a fresh baseline, so clicks never accumulate changes. */
export function runScenario(scenario: Scenario): LabState {
  const baseline = createBaseline()
  if (scenario === 'baseline') return baseline
  const values = {} as Record<NodeId, NodeState>
  const frontier = new Set<NodeId>(['draft'])
  for (const node of nodes) {
    if (node.parents.some((parent) => frontier.has(parent))) frontier.add(node.id)
    const previous = baseline.nodes[node.id]
    const instruction = node.id === 'draft' && scenario === 'changed'
      ? '提取核心结论并补充传播边界' : instructions[node.id]
    const input = effectiveInput(node.parents, values, instruction)
    const common = { id: node.id, input, output: previous.output }
    if (!frontier.has(node.id)) {
      values[node.id] = { ...common, status: 'reused', reuseCause: 'outside-frontier', reason: node.id === 'source'
        ? '资料没有变化，位于受影响范围之外，直接复用已保存的读取结果。'
        : '资料没有变化，摘要分支的变化不会影响链接分支，复用链接检查结果。' }
    } else if (node.id === 'draft' || input !== previous.input) {
      const output = evaluate(node.id, values, scenario === 'changed')
      values[node.id] = { ...common, output, status: 'rerun', outputChanged: output !== previous.output,
        reason: node.id === 'draft'
          ? (scenario === 'changed' ? '阶段指令改变，重新生成摘要；新输出与基线不同，变化继续向下游传播。' : '输入未变，但用户明确要求摘要重新执行；新输出与基线相同，下游收到的摘要没有变化。')
          : (node.id === 'review' ? '收到的新摘要与基线不同，有效输入改变，因此重新审查。' : '审查结果改变，合并后的有效输入改变，因此重新汇总；链接结果仍复用。') }
    } else {
      values[node.id] = { ...common, status: 'cutoff', boundary: 'unchanged-input',
        reason: node.id === 'review'
          ? '上游摘要重新计算后输出相同，本节点在受影响范围内，但有效输入与基线一致，提前截断并保留原审查结果。'
          : '汇总仍属于摘要的传递影响范围，但审查和链接结果都没变，有效输入与基线一致，因此也标记为提前截断。' }
    }
  }
  return finish(scenario, values)
}
