import React, { useState } from 'react';
import { 
  FolderTree, 
  Info, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import { ArchitectureGraph } from '../components/ArchitectureGraph';
import { FileTree } from '../components/FileTree';
import { FileIntelligence } from '../components/FileIntelligence';
import { 
  SoftwareGraph, 
  FileItem, 
  FileEvolution, 
  BlastRadiusResult, 
  ChangeImpactPrediction 
} from '../api/client';

interface ArchitecturePageProps {
  graph: SoftwareGraph | null;
  files: FileItem[];
  selectedFilePath: string | null;
  selectedFile: FileItem | null;
  fileEvolution: FileEvolution | null;
  blastRadius: BlastRadiusResult | null;
  predictions: ChangeImpactPrediction | null;
  onSelectFile: (path: string) => void;
  onAskAI: (prompt: string) => void;
  onOpenBlastModal?: () => void;
  onNavigateBlast?: () => void;
}

export const ArchitecturePage: React.FC<ArchitecturePageProps> = ({
  graph,
  files,
  selectedFilePath,
  selectedFile,
  fileEvolution,
  blastRadius,
  predictions,
  onSelectFile,
  onAskAI,
  onOpenBlastModal,
  onNavigateBlast
}) => {
  const [showFileTree, setShowFileTree] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  return (
    <div className="flex-1 flex overflow-hidden relative w-full h-full bg-[var(--bg-app)]">
      
      {/* Left Collapsible File Tree Sidebar */}
      {showFileTree && (
        <div className="w-64 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col shrink-0 animate-fade-in z-20 shadow-sm">
          <div className="h-10 px-3 border-b border-[var(--border-hairline)] flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
              <FolderTree className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Repository Files
            </span>
            <button
              onClick={() => setShowFileTree(false)}
              className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <FileTree
              files={files}
              selectedFilePath={selectedFilePath}
              onSelectFile={onSelectFile}
            />
          </div>
        </div>
      )}

      {/* Floating Toggle for File Tree if Collapsed */}
      {!showFileTree && (
        <button
          onClick={() => setShowFileTree(true)}
          className="absolute top-3 left-3 z-30 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-md backdrop-blur-sm"
          title="Open File Tree"
        >
          <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      )}

      {/* Main Center Stage: Topology Graph Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <ArchitectureGraph
          graph={graph}
          selectedFilePath={selectedFilePath}
          onSelectNode={onSelectFile}
          blastRadius={blastRadius}
        />
      </div>

      {/* Right Collapsible File Intelligence Inspector */}
      {showInspector && selectedFile && (
        <div className="w-84 border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col shrink-0 animate-fade-in z-20 shadow-sm">
          <div className="h-10 px-3 border-b border-[var(--border-hairline)] flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
              <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Node Inspector
            </span>
            <button
              onClick={() => setShowInspector(false)}
              className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
              title="Close Inspector"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <FileIntelligence
              file={selectedFile}
              evolution={fileEvolution}
              blastRadius={blastRadius}
              predictions={predictions}
              onAskAI={onAskAI}
              onOpenBlastModal={onOpenBlastModal || onNavigateBlast || (() => {})}
            />
          </div>
        </div>
      )}

      {/* Floating Toggle for Node Inspector if Collapsed */}
      {!showInspector && (
        <button
          onClick={() => setShowInspector(true)}
          className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-md backdrop-blur-sm"
          title="Open Node Inspector"
        >
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>
      )}
    </div>
  );
};
