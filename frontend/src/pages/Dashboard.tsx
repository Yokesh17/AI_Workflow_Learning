import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Layers,
  ArrowRight,
  Trash2,
  Calendar,
  Sparkles,
  GitBranch,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  FileQuestion,
} from 'lucide-react';
import { useFlowStore } from '../store/useFlowStore';
import { listLearningPaths, deleteLearningPath } from '../api/client';

export const Dashboard: React.FC = () => {
  const { newPath, openPath } = useFlowStore();
  const [paths, setPaths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listLearningPaths();
      setPaths(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const promptDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setDeleteError(null);
    setDeleteModal({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeletingId(deleteModal.id);
      setDeleteError(null);
      await deleteLearningPath(deleteModal.id);
      setPaths((prev) => prev.filter((p) => p.id !== deleteModal.id));
      setDeleteModal(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Could not delete learning path');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPaths = paths.filter((p) =>
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="!flex-1 !h-screen !w-screen !overflow-y-auto !bg-slate-50 !text-slate-900 !select-auto">
      {/* Header Banner */}
      <header className="!border-b !border-slate-200 !bg-white !sticky !top-0 !z-10 !shadow-2xs">
        <div className="!max-w-7xl !mx-auto !px-6 !h-18 !flex !items-center !justify-between">
          <div className="!flex !items-center !gap-3">
            <div className="!w-10 !h-10 !rounded-xl !bg-gradient-to-tr !from-blue-600 !to-purple-600 !flex !items-center !justify-center !text-white !shadow-sm">
              <GitBranch className="!w-5 !h-5" />
            </div>
            <div>
              <h1 className="!text-base !font-bold !text-slate-900 !leading-tight">
                Adaptive Learning Path Builder
              </h1>
              <p className="!text-xs !text-slate-500">
                Visual curriculum graph editor & LangGraph adaptive evaluation engine
              </p>
            </div>
          </div>

          <div className="!flex !items-center !gap-3">
            <button
              onClick={() => openPath('lp-sat-adaptive-001')}
              className="!flex !items-center !gap-2 !px-3.5 !py-2 !rounded-xl !border !border-slate-200 !text-xs !font-semibold !text-slate-700 hover:!bg-slate-50 hover:!border-slate-300 !transition-colors"
            >
              <Sparkles className="!w-3.5 !h-3.5 !text-purple-600" />
              <span>| Benchmark Demo</span>
            </button>

            <button
              onClick={newPath}
              className="!flex !items-center !gap-2 !px-4 !py-2 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !text-white !text-xs !font-bold !transition-all !shadow-sm hover:!shadow"
            >
              <Plus className="!w-4 !h-4" />
              <span>Create New Learning Path</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="!max-w-7xl !mx-auto !px-6 !py-8 !space-y-6">
        {/* Search & Stats Bar */}
        <div className="!flex !flex-col sm:!flex-row !items-center !justify-between !gap-4">
          <div className="!relative !w-full sm:!w-80">
            <Search className="!w-4 !h-4 !text-slate-400 !absolute !left-3 !top-1/2 !-translate-y-1/2" />
            <input
              type="text"
              placeholder="Search learning paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!w-full !pl-9 !pr-3 !py-2 !text-xs !bg-white !border !border-slate-200 !rounded-xl focus:!outline-none focus:!border-blue-500 !shadow-2xs"
            />
          </div>

          <div className="!text-xs !text-slate-500 !font-medium">
            Showing <strong className="!text-slate-800">{filteredPaths.length}</strong> paths
          </div>
        </div>

        {error && (
          <div className="!p-4 !bg-red-50 !border !border-red-200 !rounded-xl !text-xs !text-red-700 !flex !items-center !gap-2">
            <AlertCircle className="!w-4 !h-4 !shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="!py-24 !flex !flex-col !items-center !justify-center !text-slate-400 !gap-3">
            <Loader2 className="!w-8 !h-8 !animate-spin !text-blue-500" />
            <span className="!text-xs !font-medium">Loading your learning paths...</span>
          </div>
        ) : filteredPaths.length === 0 ? (
          /* Empty State */
          <div className="!py-16 !bg-white !border !border-dashed !border-slate-200 !rounded-2xl !flex !flex-col !items-center !justify-center !text-center !p-8 !space-y-4">
            <div className="!w-14 !h-14 !rounded-full !bg-blue-50 !flex !items-center !justify-center !text-blue-600">
              <FileQuestion className="!w-7 !h-7" />
            </div>
            <div>
              <h3 className="!text-sm !font-bold !text-slate-800">No learning paths found</h3>
              <p className="!text-xs !text-slate-500 !max-w-sm !mt-1">
                {searchQuery
                  ? `No paths matched "${searchQuery}". Try a different search term.`
                  : 'Start designing your curriculum by creating your first adaptive learning path.'}
              </p>
            </div>
            <button
              onClick={newPath}
              className="!flex !items-center !gap-2 !px-4 !py-2 !bg-blue-600 !text-white !rounded-xl !text-xs !font-bold hover:!bg-blue-700 !transition-colors !shadow-xs"
            >
              <Plus className="!w-4 !h-4" />
              <span>Create Learning Path</span>
            </button>
          </div>
        ) : (
          /* Grid of Learning Paths */
          <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-5">
            {filteredPaths.map((p) => {
              const nodeCount = p.node_count ?? 0;
              const edgeCount = p.edge_count ?? 0;
              const isDeleting = deletingId === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => openPath(p.id)}
                  className="!bg-white !rounded-2xl !border !border-slate-200 !p-5 hover:!border-blue-400 hover:!shadow-md !transition-all !cursor-pointer !group !flex !flex-col !justify-between"
                >
                  <div>
                    {/* Top row */}
                    <div className="!flex !items-start !justify-between !gap-2">
                      <span
                        className={`!text-[10px] !font-bold !uppercase !tracking-wider !px-2 !py-0.5 !rounded-full ${
                          p.status === 'published'
                            ? '!bg-emerald-50 !text-emerald-700 !border !border-emerald-200'
                            : '!bg-amber-50 !text-amber-700 !border !border-amber-200'
                        }`}
                      >
                        {p.status || 'draft'}
                      </span>

                      <button
                        onClick={(e) => promptDelete(e, p.id, p.name)}
                        disabled={isDeleting}
                        title="Delete path"
                        className="!text-slate-400 hover:!text-red-600 !p-1 !rounded-md hover:!bg-red-50 !transition-colors"
                      >
                        {isDeleting ? (
                          <Loader2 className="!w-3.5 !h-3.5 !animate-spin" />
                        ) : (
                          <Trash2 className="!w-3.5 !h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Title & Desc */}
                    <h2 className="!text-sm !font-bold !text-slate-900 group-hover:!text-blue-600 !transition-colors !mt-3">
                      {p.name}
                    </h2>
                    <p className="!text-xs !text-slate-500 !mt-1 !line-clamp-2 !leading-relaxed">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="!mt-5 !pt-4 !border-t !border-slate-100 !flex !items-center !justify-between !text-xs !text-slate-400">
                    <div className="!flex !items-center !gap-3">
                      <span className="!flex !items-center !gap-1 !font-medium !text-slate-600">
                        <BookOpen className="!w-3.5 !h-3.5 !text-blue-500" />
                        {nodeCount} nodes
                      </span>
                      <span className="!flex !items-center !gap-1 !font-medium !text-slate-600">
                        <Layers className="!w-3.5 !h-3.5 !text-purple-500" />
                        {edgeCount} edges
                      </span>
                    </div>

                    <div className="!flex !items-center !gap-1 !text-blue-600 !font-bold group-hover:!translate-x-0.5 !transition-transform">
                      <span>Open</span>
                      <ArrowRight className="!w-3.5 !h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Create Card */}
            <div
              onClick={newPath}
              className="!bg-slate-50/50 hover:!bg-blue-50/40 !rounded-2xl !border-2 !border-dashed !border-slate-200 hover:!border-blue-400 !p-6 !flex !flex-col !items-center !justify-center !text-center !cursor-pointer !transition-all !group !min-h-[180px]"
            >
              <div className="!w-10 !h-10 !rounded-full !bg-white !shadow-2xs !border !border-slate-200 !flex !items-center !justify-center !text-slate-600 group-hover:!text-blue-600 group-hover:!scale-110 !transition-all">
                <Plus className="!w-5 !h-5" />
              </div>
              <span className="!text-xs !font-bold !text-slate-800 !mt-3 group-hover:!text-blue-600">
                Create New Path
              </span>
              <span className="!text-[11px] !text-slate-400 !mt-0.5">
                Design custom nodes and rules from scratch
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div
          onClick={() => {
            if (!deletingId) setDeleteModal(null);
          }}
          className="!fixed !inset-0 !z-50 !bg-slate-900/50 !backdrop-blur-xs !flex !items-center !justify-center !p-4 !animate-in !fade-in !duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="!bg-white !rounded-2xl !max-w-md !w-full !p-6 !shadow-2xl !border !border-slate-200 !space-y-4 !animate-in !zoom-in-95 !duration-150"
          >
            <div className="!flex !items-start !gap-3.5">
              <div className="!w-11 !h-11 !rounded-full !bg-red-50 !border !border-red-100 !flex !items-center !justify-center !text-red-600 !shrink-0">
                <AlertTriangle className="!w-5 !h-5" />
              </div>
              <div className="!min-w-0 !flex-1">
                <div className="!flex !items-center !justify-between">
                  <h3 className="!text-sm !font-bold !text-slate-900">Delete Learning Path</h3>
                  <button
                    onClick={() => {
                      if (!deletingId) setDeleteModal(null);
                    }}
                    disabled={Boolean(deletingId)}
                    className="!text-slate-400 hover:!text-slate-600 !p-1 !rounded-lg hover:!bg-slate-100 !transition-colors"
                  >
                    <X className="!w-4 !h-4" />
                  </button>
                </div>
                <p className="!text-xs !text-slate-600 !mt-1.5 !leading-relaxed">
                  Are you sure you want to delete <strong className="!text-slate-900 font-semibold">"{deleteModal.name}"</strong>? This action cannot be undone and will permanently remove this learning path and all its adaptive nodes.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="!p-3 !bg-red-50 !border !border-red-200 !rounded-xl !text-xs !text-red-700 !flex !items-center !gap-2">
                <AlertCircle className="!w-4 !h-4 !shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="!flex !items-center !justify-end !gap-2.5 !pt-2 !border-t !border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                disabled={Boolean(deletingId)}
                className="!px-4 !py-2 !rounded-xl !border !border-slate-200 !text-slate-700 !text-xs !font-semibold hover:!bg-slate-50 !transition-colors disabled:!opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingId)}
                className="!px-4 !py-2 !rounded-xl !bg-red-600 hover:!bg-red-700 !text-white !text-xs !font-bold !transition-all !shadow-sm hover:!shadow !flex !items-center !gap-1.5 disabled:!opacity-60"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="!w-3.5 !h-3.5 !animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="!w-3.5 !h-3.5" />
                    <span>Delete Path</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
