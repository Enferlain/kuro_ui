import { NodeId, NodeConfig, GraphEdge } from '../lib/types';
import { Database, Sliders, Cpu, Settings2 } from 'lucide-react';

import { DataNode } from './nodes/DataNode';
import { TrainingNode } from './nodes/TrainingNode';
import { GeneralArgsNode } from './nodes/GeneralArgsNode';
import { NetworkNode } from './nodes/NetworkNode';

export const NODE_REGISTRY: Record<string, NodeConfig> = {
    [NodeId.GENERAL_ARGS]: {
        id: NodeId.GENERAL_ARGS,
        title: 'General',
        icon: Sliders,
        component: GeneralArgsNode,
        defaultPosition: { x: 100, y: 400 },
        defaultDimensions: { width: 400, height: 600 }
    },
    [NodeId.DATA]: {
        id: NodeId.DATA,
        title: 'Dataset',
        icon: Database,
        component: DataNode,
        defaultPosition: { x: 600, y: 500 },
        defaultDimensions: { width: 400, height: 500 }
    },
    [NodeId.TRAINING]: {
        id: NodeId.TRAINING,
        title: 'Training',
        icon: Settings2,
        component: TrainingNode,
        defaultPosition: { x: 1550, y: 150 },
        defaultDimensions: { width: 380, height: 350 }
    },
    [NodeId.NETWORK]: {
        id: NodeId.NETWORK,
        title: 'Network',
        icon: Database,
        component: NetworkNode,
        defaultPosition: { x: 100, y: 1100 },
        defaultDimensions: { width: 400, height: 600 }
    },
};

export const GRAPH_EDGES: GraphEdge[] = [
    { source: NodeId.GENERAL_ARGS, target: NodeId.DATA },
    { source: NodeId.DATA, target: NodeId.NETWORK },
    { source: NodeId.NETWORK, target: NodeId.TRAINING },
];

import { getSearchIndex, SearchItem } from '../lib/search-definitions';

export const SEARCH_INDEX: SearchItem[] = getSearchIndex();
