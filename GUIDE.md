## Node Development Guide

This section outlines the high-level process for creating and working on nodes in the Trainer UI.

### 1. Component Structure
Nodes are React components located in `web/components/nodes/`. Each node typically corresponds to a specific configuration section (e.g., Network, Optimizer, Data).

- **File Naming**: Use PascalCase (e.g., `MyNewNode.tsx`).
- **Basic Structure**:
  ```tsx
  import React from 'react';
  import { useStore } from '../../lib/store';
  import { Input, Select } from '../FormComponents';
  import { NodeSeparator, NodeHeader } from '../NodeStyles';

  export const MyNewNode: React.FC = () => {
      const { config, updateConfig } = useStore();

      return (
          <div className="space-y-5">
              {/* Content goes here */}
          </div>
      );
  };
  ```

### 2. State Management
The application uses `zustand` for global state management.
- **Accessing State**: `const { config } = useStore();`
- **Updating State**: `const { updateConfig } = useStore();`
- **Usage**: Bind inputs directly to the store.
  ```tsx
  <Input
      label="Learning Rate"
      name="learning_rate"
      value={config.learningRate}
      onChange={(e) => updateConfig({ learningRate: parseFloat(e.target.value) })}
  />
  ```

### 3. Styling & Layout
Consistency is key. Use the shared components and standard spacing utilities.

- **Separators**: Use `<NodeSeparator />` to divide major sections.
- **Headers**: Use `<NodeHeader title="Section Name" />` for section titles.
- **Spacing**:
  - Use `space-y-5` for the main node container.
  - Use `space-y-3` for subsections.
  - Use `space-y-2` for tight groups of controls.
- **Grids**: Use `grid grid-cols-2` or `grid-cols-3` with `gap-3` for aligning multiple inputs side-by-side.

### 4. Form Components
Use the pre-built form components in `web/components/FormComponents.tsx` to ensure consistent styling and behavior (including the "Query Intelligence" feature).

- **Input**: Standard text/number input.
- **Select**: Dropdown menu.
- **Toggle**: Boolean switch.
- **TextArea**: Multi-line text input.
- **FieldWrapper**: Wraps any custom content with a label and help button.

### 5. Registration
To make the node visible in the UI, it must be registered in `web/components/NodeRegistry.ts`.
1. Import your component.
2. Add it to the `nodeRegistry` object with a unique key, label, and description.

### 6. Considerations
- **Responsiveness**: The UI is generally fixed-width or flexible within panels, but avoid hardcoding pixel widths that might break layouts.
- **Performance**: For complex nodes, consider using `useStore` selectors to avoid re-rendering on unrelated state changes.
- **User Experience**: Group related fields logically. Use separators to break up long lists of inputs. Provide meaningful labels and placeholders.
