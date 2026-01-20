"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Server, Database, Lock } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/auth";

export default function SystemHealthPage() {
    const [checks, setChecks] = useState<{ name: string, status: 'ok' | 'error' | 'warning', message: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkSystem();
    }, []);

    const checkSystem = async () => {
        setIsLoading(true);
        const newChecks: any[] = [];
        const supabase = getSupabaseBrowserClient();

        // 1. Check Database Connection
        try {
            const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
            if (error) throw error;
            newChecks.push({ name: 'Database Connection', status: 'ok', message: 'Connected to Supabase' });
        } catch (e: any) {
            newChecks.push({ name: 'Database Connection', status: 'error', message: e.message });
        }

        // 2. Check Auth Service
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            newChecks.push({ name: 'Auth Service', status: 'ok', message: 'Auth service operational' });
        } catch (e: any) {
            newChecks.push({ name: 'Auth Service', status: 'error', message: e.message });
        }

        // 3. Environment Variables
        const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
        const missing = requiredVars.filter(v => !process.env[v]);
        if (missing.length === 0) {
            newChecks.push({ name: 'Environment Config', status: 'ok', message: 'All required variables present' });
        } else {
            newChecks.push({ name: 'Environment Config', status: 'error', message: `Missing: ${missing.join(', ')}` });
        }

        setChecks(newChecks);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
                <p className="text-slate-500">Monitor system status and connectivity</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {checks.map((check, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
                        <div className={`
              mt-1 p-2 rounded-lg 
              ${check.status === 'ok' ? 'bg-emerald-100 text-emerald-600' : ''}
              ${check.status === 'error' ? 'bg-red-100 text-red-600' : ''}
              ${check.status === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
            `}>
                            {check.status === 'ok' && <CheckCircle className="h-5 w-5" />}
                            {check.status === 'error' && <XCircle className="h-5 w-5" />}
                            {check.status === 'warning' && <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{check.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{check.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
