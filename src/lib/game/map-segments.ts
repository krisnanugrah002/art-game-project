export type NodeStatus = 'completed' | 'current' | 'locked';

export type MapNode = {
  id: string;
  x: number;
  y: number;
  status: NodeStatus;
  type?: 'chapter' | 'boss'; // optional if needed
};

export type Segment = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export function computeSegments(nodes: MapNode[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].status === 'completed') {
      segments.push({
        startX: nodes[i].x,
        startY: nodes[i].y,
        endX: nodes[i + 1].x,
        endY: nodes[i + 1].y,
      });
    }
  }
  return segments;
}
