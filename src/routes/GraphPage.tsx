import { useMemo, useState } from "react";
import { subjectLabels, supportedSubjects } from "../data/subjects";
import { graphData } from "../graphData";
import type { DependencyEdge, Subject, TopicNode } from "../types";

type Pos = { x: number; y: number };

const clampLabel = (value: string, max = 26): string =>
  value.length > max ? `${value.slice(0, Math.max(0, max - 1))}\u2026` : value;

const getLayout = (topics: TopicNode[], edges: DependencyEdge[]) => {
  const nodes = topics.map((t) => t.id);
  const indegree = new Map(nodes.map((id) => [id, 0]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of edges) {
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
  }

  const queue = nodes.filter((id) => (indegree.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);
    for (const to of outgoing.get(curr) ?? []) {
      const next = (indegree.get(to) ?? 0) - 1;
      indegree.set(to, next);
      if (next === 0) {
        queue.push(to);
      }
    }
  }

  const level = new Map<string, number>();
  for (const id of order) {
    const parentLevels = (incoming.get(id) ?? []).map((p) => level.get(p) ?? 0);
    level.set(id, parentLevels.length > 0 ? Math.max(...parentLevels) + 1 : 0);
  }

  const levels = new Map<number, string[]>();
  for (const id of nodes) {
    const l = level.get(id) ?? 0;
    levels.set(l, [...(levels.get(l) ?? []), id]);
  }

  const positions = new Map<string, Pos>();
  const colGap = 260;
  const rowGap = 110;
  const leftPad = 120;
  const topPad = 80;

  for (const [l, ids] of levels.entries()) {
    ids.sort();
    ids.forEach((id, idx) => {
      positions.set(id, { x: leftPad + l * colGap, y: topPad + idx * rowGap });
    });
  }

  const maxLevel = Math.max(...[...levels.keys(), 0]);
  const maxRows = Math.max(...[...levels.values()].map((x) => x.length), 1);
  return {
    positions,
    width: leftPad * 2 + (maxLevel + 1) * colGap,
    height: topPad * 2 + maxRows * rowGap,
  };
};

export function GraphPage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject>("math");
  const [zoom, setZoom] = useState(1);

  const filteredTopics = useMemo(
    () => graphData.topics.filter((topic) => topic.subject === selectedSubject),
    [selectedSubject],
  );

  const filteredTopicIds = useMemo(
    () => new Set(filteredTopics.map((topic) => topic.id)),
    [filteredTopics],
  );

  const filteredEdges = useMemo(
    () =>
      graphData.edges.filter(
        (edge) => filteredTopicIds.has(edge.from) && filteredTopicIds.has(edge.to),
      ),
    [filteredTopicIds],
  );

  const { positions, width, height } = useMemo(
    () => getLayout(filteredTopics, filteredEdges),
    [filteredTopics, filteredEdges],
  );

  const topicById = useMemo(
    () => new Map(filteredTopics.map((topic) => [topic.id, topic])),
    [filteredTopics],
  );

  const safeZoom = Math.max(0.45, Math.min(2.2, zoom));
  const renderWidth = Math.round(width * safeZoom);
  const renderHeight = Math.round(height * safeZoom);

  return (
    <section className="panel">
      <div className="sectionHead">
        <h2>Complete Topic Graph</h2>
        <div className="subjectSwitchRow">
          {supportedSubjects.map((subject) => (
            <button
              key={subject}
              type="button"
              className={`smallBtn subjectSwitchBtn ${selectedSubject === subject ? "active" : ""}`}
              onClick={() => setSelectedSubject(subject)}
            >
              {subjectLabels[subject]}
            </button>
          ))}
        </div>
      </div>

      <p className="muted">Blue edges are hard prerequisites. Dashed amber edges are soft links.</p>

      {filteredTopics.length === 0 ? (
        <p className="emptyState">No graph data added for {subjectLabels[selectedSubject]} yet.</p>
      ) : null}

      <div className="graphToolbar">
        <button type="button" onClick={() => setZoom((z) => Math.max(0.45, z - 0.1))}>
          -
        </button>
        <span className="zoomLabel">{Math.round(safeZoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((z) => Math.min(2.2, z + 0.1))}>
          +
        </button>
      </div>

      <div className="graphWrap">
        <svg
          className="graphSvg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMinYMin meet"
          width={renderWidth}
          height={renderHeight}
        >
          <defs>
            <marker id="arrow-hard" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2f6fb5" />
            </marker>
            <marker id="arrow-soft" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#b67a2f" />
            </marker>
            <linearGradient id="node-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2840" />
              <stop offset="100%" stopColor="#121f33" />
            </linearGradient>
            <linearGradient id="badge-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4a84a" />
              <stop offset="100%" stopColor="#f0c86a" />
            </linearGradient>
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>

          {filteredEdges.map((edge) => {
            const from = positions.get(edge.from)!;
            const to = positions.get(edge.to)!;
            const x1 = from.x + 90;
            const y1 = from.y;
            const x2 = to.x - 90;
            const y2 = to.y;
            const curveX = (x1 + x2) / 2;
            const d = `M ${x1} ${y1} C ${curveX} ${y1}, ${curveX} ${y2}, ${x2} ${y2}`;
            const hard = edge.type === "hard";
            return (
              <path
                key={`${edge.from}-${edge.to}`}
                d={d}
                fill="none"
                stroke={hard ? "#2f6fb5" : "#b67a2f"}
                strokeWidth={hard ? 2.2 : 1.8}
                strokeDasharray={hard ? "0" : "6 6"}
                markerEnd={hard ? "url(#arrow-hard)" : "url(#arrow-soft)"}
                opacity={0.85}
              />
            );
          })}

          {filteredTopics.map((topic) => {
            const pos = positions.get(topic.id)!;
            const w = 210;
            const h = 74;
            return (
              <g key={topic.id} transform={`translate(${pos.x - w / 2}, ${pos.y - h / 2})`}>
                <rect width={w} height={h} rx={10} ry={10} fill="url(#node-fill)" stroke="#4d648b" filter="url(#node-shadow)" />
                <line x1={10} y1={28} x2={w - 10} y2={28} stroke="#2b3f63" strokeWidth={1} />
                <text x={12} y={20} fontSize={11} fontWeight={500} fill="#e7c67c">
                  {clampLabel(topic.mathTopic, 20)}
                </text>
                <rect x={w - 46} y={9} width={34} height={16} rx={8} ry={8} fill="url(#badge-fill)" stroke="#a17b2f" />
                <text x={w - 39} y={21} fontSize={10} fontWeight={500} fill="#1c1305">
                  {topicById.get(topic.id)?.gradeBand}
                </text>
                <text x={12} y={46} fontSize={12.5} fontWeight={700} fill="#f3f7ff">
                  {clampLabel(topic.title, 27)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
