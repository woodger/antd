import { runCli } from './ant-design-common.mjs';
import { runCommands } from './cli-core.mjs';

// Passes only user arguments to the shared CLI error handler.
await runCli(() => runCommands(process.argv.slice(2)));
