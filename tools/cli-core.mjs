// Defines tooling CLI arguments and routes validated input to commands. Help uses the same
// definitions and can be printed without reading project files.
import { createCommand, CliUsageError } from 'icore';
import { projectRoot } from './ant-design-common.mjs';
import { runRegistry } from './ant-design-registry.mjs';
import { runCss } from './ant-design-css.mjs';
import { runCheck } from './cli-checks.mjs';

const command = createCommand();
const helpOption = { type: 'boolean', alias: 'h', syntax: 'flag' };
const flag = { type: 'boolean', syntax: 'flag' };

// Prints general help or the command subtree for a given prefix.
function writeHelp(context, prefix = []) {
  const definitions = commands.definitions.filter(
    definition => prefix.every((part, index) => definition.path[index] === part)
  );
  const lines = ['Usage: npm run cli -- <command> [options]', ''];
  for (const definition of definitions) {
    const usage = `${definition.path.join(' ')}${definition.metadata.argument
      ? ` ${definition.metadata.argument}`
      : ''}`;
    lines.push(`  ${usage.padEnd(32)}${definition.metadata.description}`);
    for (const [name, schema] of Object.entries(definition.options)) {
      if (name === 'help')
        continue;
      lines.push(`    --${name}${schema.type === 'string' ? ' <path>' : ''}`);
    }
  }
  lines.push('', '  -h, --help                     Show command help', '');
  context.stdout.write(lines.join('\n'));
}

// Registers help for a command section.
function sectionHelp(section, description) {
  return command.define({
    path: [section],
    options: { help: helpOption },
    metadata: { description },
    // Lists commands in the section from the shared CLI definitions.
    handle({ context }) {
      writeHelp(context, [section]);
    }
  });
}

// Registers a registry command with shared flags and a separate argument for show.
function registryCommand(action, description) {
  return command.define({
    path: ['registry', action],
    options: { upstream: flag, help: helpOption },
    allowExtraPositionals: action === 'show',
    metadata: { description, argument: action === 'show' ? '<component>' : '' },
    // Validates the required identifier before reading the registry.
    handle({ options, positionals, context }) {
      if (options.help) {
        writeHelp(context, ['registry', action]);
        return;
      }
      if (action === 'show' && positionals.length !== 1) {
        throw new CliUsageError('registry show requires exactly one component identifier');
      }

      return runRegistry(
        action,
        { component: positionals[0], upstream: options.upstream },
        context
      );
    }
  });
}

// Prints help for a check or forwards positional arguments to its tool.
function checkCommand(path, kind, description) {
  return command.define({
    path,
    options: { help: helpOption },
    allowExtraPositionals: true,
    metadata: { description, argument: '[-- <args...>]' },
    // Forwards arguments after -- directly to the tool without parsing them again.
    handle({ options, positionals, context }) {
      if (options.help) {
        writeHelp(context, path);
        return;
      }

      return runCheck(kind, positionals, context);
    }
  });
}

const commands = command.registry([
  command.define({
    path: ['help'],
    options: {},
    metadata: { description: 'Show all commands' },
    // Prints help for all commands from the shared registry.
    handle({ context }) {
      writeHelp(context);
    }
  }),
  sectionHelp('registry', 'Show registry commands'),
  registryCommand('check', 'Validate local coverage and the generated report'),
  registryCommand('report', 'Regenerate the coverage report'),
  registryCommand('show', 'Print a component record as JSON'),
  sectionHelp('check', 'Show type checks'),
  checkCommand(['check', 'tests'], 'types', 'Build the package and type-check its tests'),
  sectionHelp('test', 'Show package and browser tests'),
  checkCommand(['test', 'package'], 'package', 'Build the package and run its SSR and API tests'),
  checkCommand(['test', 'browser'], 'browser', 'Run browser scenarios against the package'),
  command.define({
    path: ['css'],
    options: {
      list: flag,
      check: flag,
      write: flag,
      fetch: flag,
      archive: { type: 'string' },
      help: helpOption
    },
    allowExtraPositionals: true,
    metadata: {
      description: 'Extract, compare or write pinned upstream CSS',
      argument: '[recipe|all]'
    },
    // Separates listing recipes from acting on the selected CSS recipe.
    handle({ options, provided, positionals, context }) {
      if (options.help) {
        writeHelp(context, ['css']);
        return;
      }
      if (options.list) {
        if (positionals.length
          || ['check', 'write', 'fetch', 'archive'].some(name => provided[name])) {
          throw new CliUsageError('css --list cannot be combined with a recipe or extraction options');
        }
      }
      else if (positionals.length !== 1) {
        throw new CliUsageError('css requires exactly one recipe or all; use --list to list recipes');
      }

      return runCss({ ...options, recipe: positionals[0] }, context);
    }
  })
]);

// Runs the CLI with strict argument validation and replaceable input and output.
export async function runCommands(
  args,
  {
    root = projectRoot,
    stdout = process.stdout,
    stderr = process.stderr,
    fetch = globalThis.fetch
  } = {}
) {
  const input = !args.length || args.length === 1 && ['--help', '-h'].includes(args[0])
    ? ['help']
    : args;
  await commands.runFromArgs(input, { root, stdout, stderr, fetch }, { strict: true });
}
