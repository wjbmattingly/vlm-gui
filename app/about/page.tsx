'use client';

import React from 'react';
import MainLayout from '../components/MainLayout';
import Link from 'next/link';
import { FiInfo, FiGithub, FiCode, FiFileText } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FiInfo className="mr-2" /> About VLM Document Annotation
        </h1>

        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">What is VLM Document Annotation?</h2>
            <p className="mb-4">
              VLM Document Annotation is a web application designed to help users transcribe text from images
              and annotate Named Entities (people, organizations, locations, etc.) within those transcriptions.
            </p>
            <p className="mb-4">
              The application leverages Vision-Language Models (VLMs) to automatically extract text and
              identify entities from uploaded document images. Users can then review, correct, and enhance
              these annotations within a user-friendly interface.
            </p>
            <p>
              All data is stored locally in a SQLite database, making it suitable for personal use or
              local team collaboration without requiring external services.
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Key Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Upload and organize documents in projects</li>
              <li>Automatic transcription using a Vision-Language Model</li>
              <li>Named Entity Recognition with customizable entity types</li>
              <li>Manual correction and annotation of extracted text</li>
              <li>Export of project data as JSON and images</li>
              <li>Simple and intuitive user interface</li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Technical Details</h2>
            <p className="mb-4">This application is built with the following technologies:</p>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <tbody>
                  <tr>
                    <td className="font-bold">Frontend</td>
                    <td>Next.js, React, TailwindCSS, DaisyUI</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Backend</td>
                    <td>Next.js API Routes, Prisma ORM</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Database</td>
                    <td>SQLite (local database)</td>
                  </tr>
                  <tr>
                    <td className="font-bold">AI/ML</td>
                    <td>Hugging Face API (Qwen2.5-VL-7B-Instruct model)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8 mb-4">
          <Link href="/projects" className="btn btn-primary btn-lg">
            Get Started
          </Link>
        </div>
      </div>
    </MainLayout>
  );
} 