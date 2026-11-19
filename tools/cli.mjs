import { runCli } from './ant-design-common.mjs';
import { runCommands } from './cli-core.mjs';

// Передаёт только пользовательские аргументы в общий обработчик ошибок CLI.
await runCli(() => runCommands(process.argv.slice(2)));
