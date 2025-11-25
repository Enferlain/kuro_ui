import ast
import json
import os
import re

# Mapping of Python types to our Schema types
TYPE_MAPPING = {
    'float': 'float',
    'int': 'int',
    'bool': 'bool',
    'str': 'string',
}

def parse_optimizer_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read())

    optimizers = []

    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            # Check if it looks like an optimizer (inherits from Optimizer or BaseOptimizer)
            is_optimizer = any(
                (isinstance(base, ast.Name) and base.id in ['Optimizer', 'BaseOptimizer']) 
                for base in node.bases
            )
            
            if is_optimizer:
                opt_def = {
                    'id': node.name,
                    'name': node.name,
                    'args': []
                }
                
                # Find __init__
                init_method = next((n for n in node.body if isinstance(n, ast.FunctionDef) and n.name == '__init__'), None)
                
                if init_method:
                    # Parse arguments
                    # defaults are aligned to the end of args
                    defaults = init_method.args.defaults
                    args = init_method.args.args
                    
                    # Skip 'self' and 'params'
                    start_idx = 0
                    if args and args[0].arg == 'self':
                        start_idx += 1
                    if len(args) > start_idx and args[start_idx].arg in ['params', 'params_group']:
                        start_idx += 1
                        
                    relevant_args = args[start_idx:]
                    # Calculate offset for defaults
                    default_offset = len(relevant_args) - len(defaults)
                    
                    for i, arg in enumerate(relevant_args):
                        arg_name = arg.arg
                        
                        # Skip generic kwargs
                        if arg_name == 'kwargs':
                            continue

                        # Determine default value
                        default_val = None
                        if i >= default_offset:
                            default_node = defaults[i - default_offset]
                            try:
                                default_val = ast.literal_eval(default_node)
                            except ValueError:
                                # Handle simple constant access or negative numbers
                                if isinstance(default_node, ast.UnaryOp) and isinstance(default_node.op, ast.USub):
                                     if isinstance(default_node.operand, ast.Constant):
                                         default_val = -default_node.operand.value
                                else:
                                    # Fallback for complex defaults (like function calls), just use null or string representation
                                    default_val = None

                        # Determine type annotation
                        arg_type = 'string' # Default
                        options = None
                        
                        if arg.annotation:
                            if isinstance(arg.annotation, ast.Name):
                                arg_type = TYPE_MAPPING.get(arg.annotation.id, 'string')
                            elif isinstance(arg.annotation, ast.Subscript): # e.g. Optional[float]
                                # Naive handling
                                if isinstance(arg.annotation.slice, ast.Name):
                                     arg_type = TYPE_MAPPING.get(arg.annotation.slice.id, 'string')
                        
                        # Infer type from default value if annotation missing or generic
                        if default_val is not None:
                            if isinstance(default_val, bool):
                                arg_type = 'bool'
                            elif isinstance(default_val, int):
                                arg_type = 'int'
                            elif isinstance(default_val, float):
                                arg_type = 'float'
                            elif isinstance(default_val, str):
                                arg_type = 'string' # Could be enum
                        
                        # Special handling for 'betas' tuple
                        if arg_name == 'betas':
                            if isinstance(default_val, tuple) or isinstance(default_val, list):
                                for b_idx, beta_val in enumerate(default_val):
                                    opt_def['args'].append({
                                        'name': f'beta{b_idx+1}',
                                        'label': f'Beta {b_idx+1}',
                                        'type': 'float',
                                        'default': beta_val,
                                        'step': 0.01 if b_idx == 0 else 0.001,
                                        'max': 1.0
                                    })
                            continue
                            
                        # Special handling for enums (detected by name or specific logic)
                        if arg_name == 'update_strategy':
                            arg_type = 'enum'
                            options = ['unmodified', 'cautious', 'grams'] # Hardcoded for CAME based on docstring analysis? 
                            # Ideally we parse docstrings but that's complex. For now, we can infer or leave empty.
                            # Let's try to extract from docstring if possible?
                            # For this script, I'll stick to basic extraction.
                        
                        if arg_name == 'spectral_clip_dtype':
                             arg_type = 'enum'
                             options = ['float32', 'float16', 'bfloat16', 'float64']

                        arg_def = {
                            'name': arg_name,
                            'label': arg_name.replace('_', ' ').title(),
                            'type': arg_type,
                            'default': default_val
                        }
                        
                        if options:
                            arg_def['options'] = options
                            
                        # Add reasonable steps for floats
                        if arg_type == 'float':
                            if 'decay' in arg_name:
                                arg_def['step'] = 0.001
                            elif 'lr' in arg_name or 'eps' in arg_name:
                                arg_def['step'] = default_val if default_val and default_val > 0 else 1e-8
                            else:
                                arg_def['step'] = 0.1

                        opt_def['args'].append(arg_def)
                
                optimizers.append(opt_def)
                
    return optimizers

def generate_typescript_schema(optimizers, output_path):
    ts_content = """
export interface OptimizerArgDef {
    name: string;
    label: string;
    type: 'float' | 'int' | 'bool' | 'string' | 'enum';
    default: any;
    min?: number;
    max?: number;
    step?: number;
    options?: string[]; // For enum
    description?: string;
    visible?: boolean; // Defaults to true
}

export interface OptimizerDef {
    id: string;
    name: string;
    args: OptimizerArgDef[];
}

export const OPTIMIZER_SCHEMAS: OptimizerDef[] = [
"""
    
    # Add standard fallbacks manually
    standard_optimizers = [
        {
            'id': 'AdamW',
            'name': 'AdamW',
            'args': [
                {'name': 'weight_decay', 'label': 'Weight Decay', 'type': 'float', 'default': 0.01, 'step': 0.001},
                {'name': 'beta1', 'label': 'Beta 1', 'type': 'float', 'default': 0.9, 'step': 0.01, 'max': 1.0},
                {'name': 'beta2', 'label': 'Beta 2', 'type': 'float', 'default': 0.999, 'step': 0.001, 'max': 1.0},
                {'name': 'epsilon', 'label': 'Epsilon', 'type': 'float', 'default': 1e-8, 'step': 1e-9},
            ]
        },
        {
            'id': 'AdamW8bit',
            'name': 'AdamW 8-bit',
            'args': [
                {'name': 'weight_decay', 'label': 'Weight Decay', 'type': 'float', 'default': 0.01, 'step': 0.001},
                {'name': 'beta1', 'label': 'Beta 1', 'type': 'float', 'default': 0.9, 'step': 0.01, 'max': 1.0},
                {'name': 'beta2', 'label': 'Beta 2', 'type': 'float', 'default': 0.999, 'step': 0.001, 'max': 1.0},
                {'name': 'epsilon', 'label': 'Epsilon', 'type': 'float', 'default': 1e-8, 'step': 1e-9},
            ]
        },
         {
            'id': 'Adafactor',
            'name': 'Adafactor',
            'args': [
                {'name': 'scale_parameter', 'label': 'Scale Parameter', 'type': 'bool', 'default': True},
                {'name': 'relative_step', 'label': 'Relative Step', 'type': 'bool', 'default': True},
                {'name': 'warmup_init', 'label': 'Warmup Init', 'type': 'bool', 'default': True},
            ]
        },
        {
            'id': 'Prodigy',
            'name': 'Prodigy',
            'args': [
                {'name': 'weight_decay', 'label': 'Weight Decay', 'type': 'float', 'default': 0.0, 'step': 0.01},
                {'name': 'decouple', 'label': 'Decouple', 'type': 'bool', 'default': True},
                {'name': 'use_bias_correction', 'label': 'Bias Correction', 'type': 'bool', 'default': True},
                {'name': 'safeguard_warmup', 'label': 'Safeguard Warmup', 'type': 'bool', 'default': True},
                {'name': 'd_coef', 'label': 'D Coefficient', 'type': 'float', 'default': 1.0, 'step': 0.1},
            ]
        }
    ]
    
    optimizers.extend(standard_optimizers)

    for opt in optimizers:
        ts_content += "    {\n"
        ts_content += f"        id: '{opt['id']}',\n"
        ts_content += f"        name: '{opt['name']}',\n"
        ts_content += "        args: [\n"
        for arg in opt['args']:
            ts_content += "            { "
            ts_content += f"name: '{arg['name']}', "
            ts_content += f"label: '{arg['label']}', "
            ts_content += f"type: '{arg['type']}', "
            
            # Handle default value formatting
            default_val = arg['default']
            if isinstance(default_val, bool):
                default_str = 'true' if default_val else 'false'
            elif isinstance(default_val, str):
                default_str = f"'{default_val}'"
            elif default_val is None:
                default_str = 'null'
            else:
                default_str = str(default_val)
            
            ts_content += f"default: {default_str}"
            
            if 'step' in arg:
                ts_content += f", step: {arg['step']}"
            if 'max' in arg:
                ts_content += f", max: {arg['max']}"
            if 'options' in arg:
                options_str = "[" + ", ".join([f"'{o}'" for o in arg['options']]) + "]"
                ts_content += f", options: {options_str}"
                
            ts_content += " },\n"
        ts_content += "        ]\n"
        ts_content += "    },\n"

    # Add standard fallbacks manually if needed, or rely on parsing
    ts_content += "];\n\n"
    
    ts_content += """export const SCHEDULER_OPTIONS = [
    { value: 'cosine', label: 'Cosine' },
    { value: 'cosine_with_restarts', label: 'Cosine with Restarts' },
    { value: 'linear', label: 'Linear' },
    { value: 'polynomial', label: 'Polynomial' },
    { value: 'constant', label: 'Constant' },
    { value: 'constant_with_warmup', label: 'Constant with Warmup' },
    { value: 'adafactor', label: 'Adafactor' },
];
"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Assuming scripts/generate_schema.py
    # Adjust root_dir to be the project root d:\Projects\trainer_ui\kuro_trainer
    # If this script is written to d:\Projects\trainer_ui\kuro_trainer\scripts\generate_schema.py
    # then os.path.dirname(os.path.dirname(...)) is correct.
    
    # However, I will write it to the root for simplicity in running: generate_schema.py
    root_dir = os.getcwd()
    
    files = [f for f in os.listdir(root_dir) if f.startswith('ref_opt_') and f.endswith('.py')]
    
    all_optimizers = []
    for f in files:
        print(f"Parsing {f}...")
        all_optimizers.extend(parse_optimizer_file(os.path.join(root_dir, f)))
        
    output_path = os.path.join(root_dir, 'web', 'lib', 'optimizer-schema.ts')
    print(f"Generating schema to {output_path}...")
    generate_typescript_schema(all_optimizers, output_path)
    print("Done.")

if __name__ == '__main__':
    main()
