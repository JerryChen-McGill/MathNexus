import { useState, useEffect } from 'react';

interface Props {
  level: number;
  config: { params: Record<string, number> };
  onComplete: (score: number, stars: number) => void;
  onFail: (reason: string) => void;
}

interface Edge {
  id: number;
  from: number;
  to: number;
  traversed: boolean;
}

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
}

export default function KonigsbergGame({ level, config, onComplete, onFail }: Props) {
  const { bridges = 7, nodes = 4, timeLimit = 0 } = config.params;
  const [edges, setEdges] = useState<Edge[]>([]);
  const [currentNode, setCurrentNode] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [traversedCount, setTraversedCount] = useState(0);
  const [message, setMessage] = useState('从任意节点开始，尝试一次性走过所有边');

  const nodeList: Node[] = [
    { id: 0, x: 50, y: 20, label: 'A' },
    { id: 1, x: 20, y: 60, label: 'B' },
    { id: 2, x: 80, y: 60, label: 'C' },
    { id: 3, x: 50, y: 80, label: 'D' },
  ];

  useEffect(() => {
    const b = Number(bridges) || 7;
    const defaultEdges: Edge[] = [
      { id: 0, from: 0, to: 1, traversed: false },
      { id: 1, from: 0, to: 1, traversed: false },
      { id: 2, from: 0, to: 2, traversed: false },
      { id: 3, from: 0, to: 2, traversed: false },
      { id: 4, from: 1, to: 3, traversed: false },
      { id: 5, from: 2, to: 3, traversed: false },
      { id: 6, from: 1, to: 2, traversed: false },
    ];
    setEdges(defaultEdges.slice(0, b));
    setCurrentNode(null);
    setTraversedCount(0);
    setTimeLeft(timeLimit);
    setMessage('从任意节点开始，尝试一次性走过所有边（欧拉路径）');
  }, [level, bridges, timeLimit]);

  useEffect(() => {
    if (timeLimit <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); onFail('时间耗尽'); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLimit, onFail]);

  const getEdgePath = (edge: Edge) => {
    const n1 = nodeList[edge.from];
    const n2 = nodeList[edge.to];
    return `M ${n1.x} ${n1.y} L ${n2.x} ${n2.y}`;
  };

  const handleNodeClick = (nodeId: number) => {
    if (currentNode === null) {
      setCurrentNode(nodeId);
      setMessage(`从节点 ${nodeList[nodeId].label} 开始`);
      return;
    }

    if (currentNode === nodeId) return;

    // Find edge between current and clicked
    const edgeIndex = edges.findIndex(e =>
      !e.traversed && ((e.from === currentNode && e.to === nodeId) || (e.from === nodeId && e.to === currentNode))
    );

    if (edgeIndex === -1) {
      setMessage('没有可用的边连接这两个节点');
      return;
    }

    const newEdges = [...edges];
    newEdges[edgeIndex] = { ...newEdges[edgeIndex], traversed: true };
    const newCount = traversedCount + 1;
    setEdges(newEdges);
    setCurrentNode(nodeId);
    setTraversedCount(newCount);
    setMessage(`走过边 #${edgeIndex + 1}，到达节点 ${nodeList[nodeId].label}`);

    if (newCount >= edges.length) {
      const score = 500 + (bridges > 7 ? 200 : 0);
      setTimeout(() => onComplete(score, 3), 300);
    }
  };

  const handleGiveUp = () => {
    onFail('欧拉路径不存在（哥尼斯堡七桥问题的答案）');
  };

  return (
    <div className="flex flex-col items-center h-full max-w-lg mx-auto">
      {timeLimit > 0 && <div className="text-sm text-[var(--black-6)] mb-2">剩余: <span className="font-mono-data text-[var(--accent)]">{timeLeft}s</span></div>}
      <div className="text-sm text-[var(--black-5)] mb-4 text-center">{message}</div>

      <svg viewBox="0 0 100 100" className="w-72 h-72 sm:w-80 sm:h-80 mb-4">
        {/* Edges */}
        {edges.map((edge, i) => (
          <path
            key={i}
            d={getEdgePath(edge)}
            stroke={edge.traversed ? 'var(--success)' : 'var(--black-4)'}
            strokeWidth={edge.traversed ? 2 : 1}
            fill="none"
            strokeDasharray={edge.traversed ? '' : '4,4'}
          />
        ))}

        {/* Nodes */}
        {nodeList.slice(0, nodes).map(node => (
          <g key={node.id} onClick={() => handleNodeClick(node.id)} className="cursor-pointer">
            <circle
              cx={node.x} cy={node.y}
              r={currentNode === node.id ? 8 : 6}
              fill={currentNode === node.id ? 'var(--accent)' : 'var(--black-2)'}
              stroke={currentNode === node.id ? 'var(--accent-glow)' : 'var(--black-4)'}
              strokeWidth={2}
            />
            <text x={node.x} y={node.y + 1} textAnchor="middle" fill="white" fontSize="6" fontFamily="monospace">
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-sm text-[var(--black-6)]">
          已走过: <span className="font-mono-data text-[var(--success)]">{traversedCount}</span>/{edges.length}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleGiveUp} className="px-6 py-2.5 bg-[var(--black-2)] border border-[var(--black-3)] rounded-lg text-[var(--black-5)] hover:text-white transition-all">
          这是不可能的
        </button>
      </div>

      <div className="mt-4 text-xs text-[var(--black-6)] text-center max-w-sm">
        提示: 欧拉证明，如果超过两个节点有奇数条边相连，则不存在一次性遍历所有边的路径
      </div>
    </div>
  );
}
