import { useState } from 'react';
import Sidebar, { type Page } from '../components/Sidebar';
import GeneratePage from './GeneratePage';
import HistoryPage from './HistoryPage';
import SettingsPage from './SettingsPage';
import { useSettings } from '../components/SettingsPanel';

export default function Dashboard() {
  const [activePage, setActivePage] = useState<Page>('generate');
  const { settings, updateSettings } = useSettings();

  return (
    <div className="min-h-screen relative">
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main content */}
      <main className="ml-56 min-h-screen">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {activePage === 'generate' && <GeneratePage settings={settings} />}
          {activePage === 'history' && <HistoryPage />}
          {activePage === 'settings' && <SettingsPage settings={settings} onUpdate={updateSettings} />}
        </div>
      </main>
    </div>
  );
}
