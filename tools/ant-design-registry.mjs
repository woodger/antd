// Обрабатывает команды реестра. Проверяет актуальность отчёта, а перезапись
// выполняет только по команде report.
import { readFile } from 'node:fs/promises';
import { projectPath, reportFile, writeAtomic } from './ant-design-common.mjs';
import { inspectRegistry, renderReport, coverage } from './ant-design-registry-core.mjs';

// Выводит отчёт о проверке или одну запись после общей проверки реестра.
export async function runRegistry(command, { component, upstream }, { root, stdout }) {
  const result = await inspectRegistry(root, { requireUpstream: upstream === true });
  if (result.errors.length) {
    throw new Error(result.errors.join('\n'));
  }

  const report = renderReport(result.data, result.componentExports);
  if (command === 'report') {
    const outputPath = projectPath(root, reportFile);
    await writeAtomic(outputPath, report);
    stdout.write(`Updated ${reportFile}\n`);
  }
  else if (command === 'show') {
    const item = result.data.components.find(item => item.id === component);
    if (!item) {
      throw new Error(`Unknown component: ${component}`);
    }

    const componentCoverage = coverage(item, result.data.upstream.revision);
    const record = { ...item, coverage: componentCoverage };
    const json = JSON.stringify(record, null, 2);
    stdout.write(`${json}\n`);
  }
  else {
    const outputPath = projectPath(root, reportFile);
    // Отсутствующий или недоступный отчёт проверяется так же, как устаревшая копия.
    const actual = await readFile(outputPath, 'utf8').catch(() => '');
    if (actual !== report) {
      throw new Error('Registry report is stale. Run npm run cli -- registry report');
    }

    const familyCount = result.data.components.length;
    const { componentExports, upstream, integrationEvidence } = result;
    stdout.write(
      `Local registry valid: ${familyCount} families, ${componentExports} Svelte component exports. Upstream: ${upstream}. Integration evidence (${integrationEvidence.length} contracts) must be checked by the consuming project. Test execution was not checked.\n`
    );
  }
}
