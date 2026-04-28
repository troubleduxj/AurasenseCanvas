/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactFlowProvider } from '@xyflow/react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Canvas } from './components/Canvas';
import { useStore } from './store';
import { X } from 'lucide-react';

export default function App() {
  const { previewImageUrl, setPreviewImageUrl } = useStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 text-zinc-900 font-sans align-top relative">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 relative">
          <ReactFlowProvider>
            <Canvas />
          </ReactFlowProvider>
        </main>
      </div>

      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative max-w-5xl w-full max-h-screen flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImageUrl}
              alt="Preview"
              className="w-auto h-auto max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
