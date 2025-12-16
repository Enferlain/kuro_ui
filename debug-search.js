
const items = [];

// Mocking defining logic
const define = (nodeId, defs) => {
    for (const [key, value] of Object.entries(defs)) {
        if (typeof value === 'string') {
            items.push({ id: key, label: value, nodeId });
        } else {
            items.push({ id: key, label: value.label, nodeId });
        }
    }
};

const NodeId = { TRAINING: 'training' };

// Mocking TRAINING_ARGS_DEFS
define(NodeId.TRAINING, {
    optimizer_type: 'Optimizer Type',
    learning_rate: 'Main Learning Rate',
});

// Mocking Optimizer Logic
const OPTIMIZER_SCHEMAS = [
    { name: 'AdaBelief', args: [{ name: 'lr', label: 'Lr' }] },
    { name: 'AdamW', args: [{ name: 'weight_decay', label: 'Weight Decay' }] }
];

OPTIMIZER_SCHEMAS.forEach(opt => {
    items.push({
        id: 'optimizer_type',
        label: opt.name,
        nodeId: NodeId.TRAINING
    });

    opt.args.forEach(arg => {
        items.push({
            id: arg.name,
            label: arg.label,
            nodeId: NodeId.TRAINING
        });
    });
});

const query = 'training';
const results = items.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.id.toLowerCase().includes(query.toLowerCase())
);

console.log('Query:', query);
console.log('Results:', results);
