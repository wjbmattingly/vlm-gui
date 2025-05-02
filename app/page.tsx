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
      <div className="hero min-h-[60vh] bg-base-200 rounded-xl mb-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">VLM Document Annotation</h1>
            <p className="py-6">
              Upload, transcribe, and annotate your documents with Named Entity Recognition (NER).
              Organize your work in projects and export the results in JSON format.
            </p>
            <Link href="/projects" className="btn btn-primary mr-2">Get Started</Link>
            <Link href="/about" className="btn btn-outline">Learn More</Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <h2 className="text-3xl font-bold text-center mb-6">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <FiUpload className="text-4xl mb-2 text-primary" />
            <h3 className="card-title">Upload Documents</h3>
            <p>Upload image documents to be processed and organized in projects.</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <FiTag className="text-4xl mb-2 text-primary" />
            <h3 className="card-title">NER Transcription</h3>
            <p>Automatically transcribe and annotate documents with customizable NER labels.</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <FiDatabase className="text-4xl mb-2 text-primary" />
            <h3 className="card-title">Project Organization</h3>
            <p>Organize your documents in projects for better management and collaboration.</p>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <FiDownload className="text-4xl mb-2 text-primary" />
            <h3 className="card-title">Export Results</h3>
            <p>Export your annotated documents as ZIP archives with images and JSON data.</p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          <Link href="/projects" className="btn btn-sm btn-primary">View All</Link>
        </div>
        
        <div className="overflow-x-auto">
          {projects.length > 0 ? (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Documents</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((project) => (
                  <tr key={project.id}>
                    <td>{project.name}</td>
                    <td>{project.description || '-'}</td>
                    <td>{project._count?.documents || 0}</td>
                    <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/projects/${project.id}`} className="btn btn-sm btn-outline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="bg-base-200 p-8 text-center rounded-lg">
              <p className="mb-4">No projects yet. Create your first project to get started!</p>
              <Link href="/projects" className="btn btn-primary">
                Create Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
