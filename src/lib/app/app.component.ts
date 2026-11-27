import AppRoot from './App.svelte';
import { useApp } from './app-context';

// A named signature retains generic component props in the package declarations.
const App: typeof AppRoot & { useApp: typeof useApp; } = Object.assign(AppRoot, { useApp });

export default App;
