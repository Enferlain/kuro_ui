import { NodeId } from './types';
import { GENERAL_ARGS_DEFS, NETWORK_ARGS_DEFS, DATA_ARGS_DEFS, TRAINING_ARGS_DEFS, FieldDefinition } from './field-definitions';
import { OPTIMIZER_SCHEMAS } from './optimizer-schema';

export interface SearchItem {
    id: string;
    label: string;
    nodeId: NodeId;
    keywords?: string[];
    validOptimizers?: string[]; // [Shiro] NEW: Context-Aware Filtering
}

/**
 * Generates the full search index by combining:
 * 1. Static Field Definitions (General, Network, Data, Training(static))
 * 2. Dynamic Optimizer Schemas
 */
export const getSearchIndex = (): SearchItem[] => {
    const items: SearchItem[] = [];

    // Helper to add from dictionary
    const addDefs = (defs: Record<string, FieldDefinition>) => {
        Object.values(defs).forEach(def => {
            items.push({
                id: def.id,
                label: def.label,
                nodeId: def.nodeId,
                keywords: def.keywords
            });
        });
    };

    // 1. Add Static Definitions
    addDefs(GENERAL_ARGS_DEFS);
    addDefs(NETWORK_ARGS_DEFS);
    addDefs(DATA_ARGS_DEFS);
    addDefs(TRAINING_ARGS_DEFS);

    // 2. Add Dynamic Optimizer Definitions
    // We add every argument from every optimizer schema.
    // We deduplicate by ID, but we track WHICH optimizers use this ID.
    // This allows us to filter later: "Show 'rectify' only if optimizer is 'AdaBelief'"
    const optimizerArgsMap = new Map<string, { label: string, optimizers: Set<string> }>();

    OPTIMIZER_SCHEMAS.forEach(opt => {
        // Add the optimizer name itself as a keyword for the Type field
        items.push({
            id: 'optimizer_type',
            label: opt.name,
            nodeId: NodeId.TRAINING,
            keywords: ['optimizer', 'algo', opt.name] // Tag it with self name 
        });

        opt.args.forEach(arg => {
            // Key is just the dependency ID (name), because that's what we want to be unique in the search result list
            // If multiple optimizers use 'weight_decay', we want ONE search result that works for all of them.
            if (!optimizerArgsMap.has(arg.name)) {
                optimizerArgsMap.set(arg.name, { label: arg.label, optimizers: new Set() });
            }
            const entry = optimizerArgsMap.get(arg.name)!;
            entry.optimizers.add(opt.id);
        });
    });

    // Convert Map to SearchItems
    optimizerArgsMap.forEach((entry, id) => {
        // If ALL optimizers use it, we don't need to filter (optimization)
        // But checking length of OPTIMIZER_SCHEMAS vs entry.optimizers.size is safer
        const allOptimizers = OPTIMIZER_SCHEMAS.map(o => o.id);
        const usedByAll = entry.optimizers.size === allOptimizers.length;

        items.push({
            id: id,
            label: entry.label,
            nodeId: NodeId.TRAINING,
            // If used by all, undefined. Else, array of allowed IDs.
            validOptimizers: usedByAll ? undefined : Array.from(entry.optimizers)
        });
    });

    return items;
};
