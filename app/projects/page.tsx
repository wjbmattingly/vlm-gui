'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '../lib/store';
import MainLayout from '../components/MainLayout';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';

export default function ProjectsPage() {
  const { projects, fetchProjects, createProject, deleteProject } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    try {
      await createProject(name, description);
      setName('');
      setDescription('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? This will delete all documents in this project.')) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8 pb-2 border-b">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          className="btn btn-primary btn-lg rounded-xl shadow-md px-6 py-3 flex items-center gap-2 text-lg font-semibold transition-all duration-150 hover:scale-105 hover:shadow-xl"
          onClick={() => setIsModalOpen(true)}
        >
          <FiPlus className="text-2xl" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-base-200 p-8 text-center rounded-lg">
          <div className="flex flex-col items-center justify-center">
            <FiFolder className="text-6xl mb-4 text-primary opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Projects Yet</h2>
            <p className="mb-4">Create your first project to get started with document transcription and annotation.</p>
            <button
              className="btn btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <FiPlus className="mr-2" /> Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group bg-white dark:bg-base-200 rounded-2xl shadow-lg border border-base-200 hover:shadow-2xl transition-all duration-150 p-0 flex flex-col min-h-[210px] cursor-pointer hover:border-primary/40"
            >
              <div className="flex-1 p-6 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold text-primary group-hover:text-primary-focus transition-colors">
                    {project.name}
                  </span>
                  <span className="ml-auto badge badge-primary badge-outline text-xs font-semibold px-2 py-1">
                    {project._count?.documents || 0} Docs
                  </span>
                </div>
                <div className="text-base-content/70 text-sm mb-4 min-h-[32px]">
                  {project.description || <span className="italic text-base-content/40">No description</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-base-content/50">
                  <span>Created:</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 px-6 pb-4 pt-2">
                <button
                  className="btn btn-sm btn-circle btn-ghost text-error hover:bg-error/10"
                  onClick={() => handleDeleteProject(project.id)}
                  title="Delete Project"
                >
                  <FiTrash2 />
                </button>
                <Link
                  href={`/projects/${project.id}`}
                  className="btn btn-primary btn-sm rounded-lg px-4 font-semibold shadow-none"
                >
                  Open Project
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg p-0 overflow-visible animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4 border-b">
              <div className="flex items-center gap-3">
                <FiPlus className="text-2xl text-primary" />
                <h3 className="font-bold text-2xl">Create New Project</h3>
              </div>
              <button
                className="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-error"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
                type="button"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="px-8 pt-6 pb-8">
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text text-base font-semibold">Project Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  className="input input-bordered input-lg w-full text-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
                <span className="text-xs text-base-content/50 mt-1">This will help you identify your project later.</span>
              </div>
              <div className="form-control mb-8">
                <label className="label">
                  <span className="label-text text-base font-semibold">Description <span className="text-base-content/40">(optional)</span></span>
                </label>
                <textarea
                  placeholder="Enter project description"
                  className="textarea textarea-bordered textarea-lg w-full text-base min-h-[80px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  className="btn btn-lg btn-ghost rounded-xl px-6 text-base"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-lg rounded-xl px-8 text-base flex items-center gap-2">
                  <FiPlus className="text-lg" /> Create
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}

      {/* Add animation utility class */}
      <style jsx global>{`
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: none; }
      }
      .animate-fade-in {
        animation: fade-in 0.25s cubic-bezier(0.4,0,0.2,1);
      }
      `}</style>
    </MainLayout>
  );
} 