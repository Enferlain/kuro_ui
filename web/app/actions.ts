// app/actions.ts
'use server';

import { inspect } from 'util';

export async function logToTerminal(type: 'log' | 'error' | 'warn', args: any[]) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  
  // Format the output to be readable in the terminal
  const formattedArgs = args.map(arg => 
    typeof arg === 'string' ? arg : inspect(arg, { colors: true, depth: 2 })
  );

  const prefix = type === 'error' ? '\x1b[31m[CLIENT-ERR]\x1b[0m' : 
                 type === 'warn'  ? '\x1b[33m[CLIENT-WARN]\x1b[0m' : 
                                    '\x1b[36m[CLIENT-LOG]\x1b[0m';

  console.log(`${prefix} ${timestamp}:`, ...formattedArgs);
}