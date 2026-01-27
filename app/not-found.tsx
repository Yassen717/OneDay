'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-900 dark:text-slate-50 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Page Not Found
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
