'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAppStore } from './lib/store';
import MainLayout from './components/MainLayout';
import { FiUpload, FiTag, FiDownload, FiDatabase } from 'react-icons/fi';

export default function Home() {
  const { fetchProjects, projects } = useAppStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[55vh] bg-base-200 rounded-xl mb-4 pt-8 pb-12">
        <div className="w-full flex flex-col items-center text-center max-w-2xl">
          <h1 className="text-5xl font-extrabold mb-4">VLM Document Annotation</h1>
          <p className="text-lg text-base-content/80 mb-8 max-w-xl">
            Upload, transcribe, and annotate your documents with Named Entity Recognition (NER).<br />
            Organize your work in projects and export the results in JSON format.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-4">
            <Link href="/projects" className="btn btn-primary btn-lg font-semibold px-8 shadow-md">Get Started</Link>
            <Link href="/about" className="btn btn-outline btn-lg font-semibold px-8">Learn More</Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <h2 className="text-3xl font-bold text-center mb-4 mt-2">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="card bg-base-100 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-150 border border-base-200">
          <div className="flex flex-col items-center text-center gap-2">
            <FiUpload className="text-5xl mb-2 text-primary" />
            <h3 className="card-title text-xl font-bold mb-1">Upload Documents</h3>
            <p className="text-base-content/70">Upload image documents to be processed and organized in projects.</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-150 border border-base-200">
          <div className="flex flex-col items-center text-center gap-2">
            <FiTag className="text-5xl mb-2 text-primary" />
            <h3 className="card-title text-xl font-bold mb-1">NER Transcription</h3>
            <p className="text-base-content/70">Automatically transcribe and annotate documents with customizable NER labels.</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-150 border border-base-200">
          <div className="flex flex-col items-center text-center gap-2">
            <FiDatabase className="text-5xl mb-2 text-primary" />
            <h3 className="card-title text-xl font-bold mb-1">Project Organization</h3>
            <p className="text-base-content/70">Organize your documents in projects for better management and collaboration.</p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-150 border border-base-200">
          <div className="flex flex-col items-center text-center gap-2">
            <FiDownload className="text-5xl mb-2 text-primary" />
            <h3 className="card-title text-xl font-bold mb-1">Export Results</h3>
            <p className="text-base-content/70">Export your annotated documents as ZIP archives with images and JSON data.</p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          <Link href="/projects" className="btn btn-primary btn-md font-semibold px-6 shadow-md hover:scale-105 transition">View All</Link>
        </div>
        <div className="overflow-x-auto">
          {projects.length > 0 ? (
            <div className="card bg-base-100 shadow-xl rounded-2xl p-4 border border-base-200">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-base font-semibold">Name</th>
                    <th className="text-base font-semibold">Description</th>
                    <th className="text-base font-semibold">Documents</th>
                    <th className="text-base font-semibold">Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="hover:bg-primary/10 transition">
                      <td className="font-semibold">{project.name}</td>
                      <td className="text-base-content/70">{project.description || '-'}</td>
                      <td>{project._count?.documents || 0}</td>
                      <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link href={`/projects/${project.id}`} className="btn btn-accent btn-sm font-semibold px-5 shadow hover:scale-105 transition">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-base-200 p-8 text-center rounded-lg">
              <p className="mb-4">No projects yet. Create your first project to get started!</p>
              <Link href="/projects" className="btn btn-primary btn-lg font-semibold px-8 shadow-md">Create Project</Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
