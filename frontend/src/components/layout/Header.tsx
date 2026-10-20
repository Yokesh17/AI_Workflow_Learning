import React from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Eye,
  Save,
  Play,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { saveLearningPath } from '../../api/client';

export const Header: React.FC = () => {
  const {
    pathName,
    setPathName,
    pathStatus,
    setPathStatus,
    activeTab,
    setActiveTab,
    isSaving,
    setIsSaving,
    saveMessage,
    setSaveMessage,
    getPayload,
    loadLearningPathData,
    backToDashboard,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    setIsDirty,
  } = useFlowStore();

  const handleSave = async (status: 'draft' | 'published') => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      setPathStatus(status);
      const payload = getPayload();
      payload.status = status;

      const saved = await saveLearningPath(payload);
      loadLearningPathData(saved);
      setIsDirty(false);
      setSaveMessage(`Successfully saved as ${status}!`);
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message || 'Failed to save'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="!min-h-[72px] !bg-white !border-b-2 !border-blue-600 !px-6 !flex !items-center !justify-between !shrink-0 !z-20">
      {/* Left: Back button & Title & Status */}
      <div className="!flex !items-center !gap-4">
        <button
          onClick={backToDashboard}
          title="Back to All Paths"
          className="!flex !items-center !gap-1.5 !px-4 !py-2 !rounded-lg !border !border-slate-200 !text-xs !font-semibold !text-slate-600 hover:!bg-slate-50 hover:!text-slate-900 !transition-colors"
        >
          <ArrowLeft className="!w-3.5 !h-3.5" />
          <span>Paths</span>
        </button>

        <div className="!h-6 !w-px !bg-slate-200" />

        <div className="!flex !flex-col">
          <div className="!flex !items-center !gap-2">
            <input
              type="text"
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              className="!text-lg !font-bold !text-slate-900 !bg-transparent !border-b !border-transparent hover:!border-slate-300 focus:!border-blue-500 focus:!outline-none !transition-colors !px-1 !max-w-[280px] sm:!max-w-md !truncate"
              title="Click to rename"
            />
            <span
              className={`!text-[10px] !font-bold !uppercase !tracking-wider !px-2 !py-0.5 !rounded-full ${
                pathStatus === 'published'
                  ? '!bg-emerald-100 !text-emerald-700'
                  : '!bg-amber-100 !text-amber-700'
              }`}
            >
              {pathStatus}
            </span>
          </div>
          <span className="!text-[11px] !text-slate-400 !px-1 !truncate">
            Adaptive Learning Path Editor
          </span>
        </div>
      </div>

      {/* Center: Save notification, Unsaved indicator & Undo/Redo */}
      <div className="!flex !items-center !gap-4">
        {saveMessage && (
          <div
            className={`!flex !items-center !gap-1.5 !px-3 !py-1 !rounded-md !text-xs !font-medium !animate-fade-in ${
              saveMessage.startsWith('Error')
                ? '!bg-red-50 !text-red-700 !border !border-red-200'
                : '!bg-emerald-50 !text-emerald-700 !border !border-emerald-200'
            }`}
          >
            {saveMessage.startsWith('Error') ? (
              <AlertCircle className="!w-3.5 !h-3.5 !shrink-0" />
            ) : (
              <Check className="!w-3.5 !h-3.5 !shrink-0" />
            )}
            <span>{saveMessage}</span>
          </div>
        )}

        {isDirty && !isSaving && (
          <div className="!flex !items-center !gap-1.5 !px-2.5 !py-1 !rounded-full !bg-amber-50 !border !border-amber-200 !text-amber-700 !text-xs !font-semibold">
            <span className="!w-1.5 !h-1.5 !rounded-full !bg-amber-500 !animate-pulse" />
            Unsaved
          </div>
        )}

        {/* Undo / Redo */}
        <div className="!flex !items-center !gap-1 !bg-slate-100 !p-1 !rounded-lg !border !border-slate-200">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="!p-1 !rounded !text-slate-600 hover:!text-slate-900 hover:!bg-white disabled:!opacity-35 disabled:hover:!bg-transparent !transition-all"
          >
            <Undo2 className="!w-3.5 !h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="!p-1 !rounded !text-slate-600 hover:!text-slate-900 hover:!bg-white disabled:!opacity-35 disabled:hover:!bg-transparent !transition-all"
          >
            <Redo2 className="!w-3.5 !h-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Mode toggle & Save actions */}
      <div className="!flex !items-center !gap-3">
        {/* Builder / Preview Toggle */}
        <div className="!bg-slate-100 !p-1 !rounded-lg !flex !items-center !gap-1 !border !border-slate-200">
          <button
            onClick={() => setActiveTab('builder')}
            className={`!px-3 !py-1.5 !rounded-md !text-xs !font-semibold !transition-all ${
              activeTab === 'builder'
                ? '!bg-white !text-slate-900 !shadow-2xs'
                : '!text-slate-600 hover:!text-slate-900'
            }`}
          >
            Builder
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`!flex !items-center !gap-1.5 !px-3 !py-1.5 !rounded-md !text-xs !font-semibold !transition-all ${
              activeTab === 'preview'
                ? '!bg-white !text-slate-900 !shadow-2xs'
                : '!text-slate-600 hover:!text-slate-900'
            }`}
          >
            <Eye className="!w-3.5 !h-3.5" />
            <span>Simulator</span>
          </button>
        </div>

        <div className="!h-5 !w-px !bg-slate-200 !mx-0.5" />

        {/* Save Draft */}
        <button
          onClick={() => handleSave('draft')}
          disabled={isSaving}
          className="!flex !items-center !gap-1.5 !px-4 !py-2 !rounded-lg !border !border-slate-300 !text-xs !font-semibold !text-slate-700 hover:!bg-slate-50 active:!bg-slate-100 !transition-colors disabled:!opacity-50"
        >
          {isSaving ? (
            <Loader2 className="!w-3.5 !h-3.5 !animate-spin" />
          ) : (
            <Save className="!w-3.5 !h-3.5" />
          )}
          <span>Save Draft</span>
        </button>

        {/* Publish */}
        <button
          onClick={() => handleSave('published')}
          disabled={isSaving}
          className="!flex !items-center !gap-1.5 !px-4 !py-2 !rounded-lg !bg-slate-900 !text-white !text-xs !font-semibold hover:!bg-slate-800 active:!bg-slate-950 !transition-colors disabled:!opacity-50 !shadow-2xs"
        >
          <Play className="!w-3.5 !h-3.5 !fill-current" />
          <span>Publish</span>
        </button>
      </div>
    </header>
  );
};
