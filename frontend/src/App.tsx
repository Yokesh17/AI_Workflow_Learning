import React from 'react';
import { Header } from './components/layout/Header';
import { LeftPanel } from './components/layout/LeftPanel';
import { Canvas } from './components/layout/Canvas';
import { RightPanel } from './components/layout/RightPanel';
import { PreviewSimulator } from './components/preview/PreviewSimulator';
import { Dashboard } from './pages/Dashboard';
import { useFlowStore } from './store/useFlowStore';

export const App: React.FC = () => {
  const { appView, activeTab, pathId, nodes, openPath } = useFlowStore();

  React.useEffect(() => {
    if (appView === 'builder' && nodes.length === 0 && pathId) {
      openPath(pathId);
    }
  }, [appView, pathId, nodes.length, openPath]);

  if (appView === 'dashboard') {
    return <Dashboard />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'builder' ? (
          <>
            <LeftPanel />
            <Canvas />
            <RightPanel />
          </>
        ) : (
          <PreviewSimulator />
        )}
      </main>
    </div>
  );
};

export default App;
