import AppRoot from './App.svelte';
import { useApp } from './app-context';

// Именованная сигнатура сохраняет generic props компонента в декларациях пакета.
const App: typeof AppRoot & { useApp: typeof useApp; } = Object.assign(AppRoot, { useApp });

export default App;
