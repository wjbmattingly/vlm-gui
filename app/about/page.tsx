'use client';

import React from 'react';
import MainLayout from '../components/MainLayout';
import Link from 'next/link';
import { FiInfo, FiGithub, FiCode, FiFileText, FiTag } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 flex items-center gap-3 text-center">
          <FiInfo className="text-primary text-3xl md:text-4xl" /> About VLM Document Annotation
        </h1>

        <div className="flex flex-col gap-10 w-full items-center">
          {/* What is VLM Document Annotation */}
          <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-200 w-full max-w-xl">
            <div className="card-body flex flex-col items-start text-left gap-2 p-8">
              <h2 className="card-title text-2xl font-bold mb-2 flex items-center gap-2">
                <FiFileText className="text-primary" /> What is VLM Document Annotation?
              </h2>
              <p className="mb-3 text-base-content/80 max-w-2xl">
                <span className="font-semibold">VLM Document Annotation</span> is a web application designed to help users transcribe text from images and annotate Named Entities (people, organizations, locations, etc.) within those transcriptions.
              </p>
              <p className="mb-3 text-base-content/70 max-w-2xl">
                The application leverages Vision-Language Models (VLMs) to automatically extract text and identify entities from uploaded document images. Users can then review, correct, and enhance these annotations within a user-friendly interface.
              </p>
              <p className="text-base-content/60 max-w-2xl">
                All data is stored locally in a SQLite database, making it suitable for personal use or local team collaboration without requiring external services.
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-200 w-full max-w-xl">
            <div className="card-body flex flex-col items-start text-left gap-2 p-8">
              <h2 className="card-title text-2xl font-bold mb-2 flex items-center gap-2">
                <FiTag className="text-primary" /> Key Features
              </h2>
              <ul className="list-none flex flex-col gap-2 mt-2 mb-1 text-base-content/80 pl-0">
                <li className="flex items-center gap-2"><span className="badge badge-primary badge-sm"></span> Upload and organize documents in projects</li>
                <li className="flex items-center gap-2"><span className="badge badge-primary badge-sm"></span> Automatic transcription using a Vision-Language Model</li>
                <li className="flex items-center gap-2"><span className="badge badge-primary badge-sm"></span> Named Entity Recognition with customizable entity types</li>
                <li className="flex items-center gap-2"><span className="badge badge-primary badge-sm"></span> Manual correction and annotation of extracted text</li>
                <li className="flex items-center gap-2"><span className="badge badge-primary badge-sm"></span> Export of project data as JSON and images</li>
                <li className="flex items-center gap-2"><span className="badge badge-primary badge-sm"></span> Simple and intuitive user interface</li>
              </ul>
            </div>
          </div>

          {/* Technical Details */}
          <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-200 w-full max-w-xl">
            <div className="card-body flex flex-col items-start text-left gap-2 p-8">
              <h2 className="card-title text-2xl font-bold mb-2 flex items-center gap-2">
                <FiCode className="text-primary" /> Technical Details
              </h2>
              <p className="mb-4 text-base-content/80">This application is built with the following technologies:</p>
              <div className="overflow-x-auto w-full">
                <table className="table w-full">
                  <tbody>
                    <tr>
                      <td className="font-bold text-base-content/80">Frontend</td>
                      <td>Next.js, React, TailwindCSS, DaisyUI</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-base-content/80">Backend</td>
                      <td>Next.js API Routes, Prisma ORM</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-base-content/80">Database</td>
                      <td>SQLite (local database)</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-base-content/80">AI/ML</td>
                      <td>Hugging Face API (Qwen2.5-VL-7B-Instruct model)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-16 mb-2">
          <Link href="/projects" className="btn btn-primary btn-lg font-semibold px-10 shadow-md">Get Started</Link>
        </div>
      </div>
    </MainLayout>
  );
} 