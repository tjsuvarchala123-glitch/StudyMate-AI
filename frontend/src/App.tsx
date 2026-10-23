import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { VoiceVisualizer } from './components/voice/VoiceVisualizer';
import { DashboardView } from './views/DashboardView';
import { AssistantView } from './views/AssistantView';
import { StudyPlansView } from './views/StudyPlansView';
import { TasksView } from './views/TasksView';
import { QuizCenterView } from './views/QuizCenterView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { currentView } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Layout Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header setMobileOpen={setMobileOpen} isCollapsed={isCollapsed} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'home' && <DashboardView />}
          {currentView === 'assistant' && <AssistantView />}
          {currentView === 'plans' && <StudyPlansView />}
          {currentView === 'tasks' && <TasksView />}
          {currentView === 'quizzes' && <QuizCenterView />}
          {currentView === 'progress' && <ProgressView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Persistent Voice Assistant HUD */}
      <VoiceVisualizer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
