export function snapshotGridRowPrefix() {
  // Убирает служебные классы рантайма и сортирует оставшиеся для сравнения.
  const classes = (node: Element) => [...node.classList].filter(name =>
    !name.startsWith('css-') && !/^s-[\w-]{12}$/.test(name)
      && !name.endsWith('-css-var') && !name.endsWith('-source-theme')).sort();
  // Сохраняет отдельные computed declarations. Сериализованный снимок сравнивается по именам
  // свойств.
  const style = (node: Element, properties: string[]) => {
    const computed = getComputedStyle(node);
    return Object.fromEntries(properties.map(property => [
      property, computed.getPropertyValue(property)
    ]));
  };

  return Object.fromEntries(
    [...document.querySelectorAll<HTMLElement>('[data-grid-row-prefix-scope]')].map(host => {
      const row = host.querySelector('.fixture-row-prefix')!;
      const bounds = row.getBoundingClientRect();

      return [host.dataset.gridRowPrefixScope!, {
        classes: classes(row),
        row: style(row, ['display', 'flex-flow', 'justify-content', 'align-items', 'direction',
          'margin-inline-start', 'margin-inline-end', 'row-gap', 'font-size']),
        columns: [...row.children].map(col => {
          const box = col.getBoundingClientRect();
          return { width: box.width, height: box.height, x: box.x - bounds.x, y: box.y - bounds.y,
            style: style(col, ['padding-inline-start', 'padding-inline-end', 'flex', 'min-width']) };
        })
      }];
    })
  );
}
