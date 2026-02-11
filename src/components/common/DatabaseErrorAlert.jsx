import React from 'react';
import { AlertCircle, Database, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DatabaseErrorAlert = ({ 
  error, 
  onRetry, 
  isRetrying = false,
  showDetails = false 
}) => {
  const isPostgreSQLError = error?.message?.includes('function year') ||
                            error?.message?.includes('42883') ||
                            error?.response?.data?.message?.includes('function year');

  if (!isPostgreSQLError) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
          <Database className="h-5 w-5" />
          Database Compatibility Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm text-orange-800 dark:text-orange-300">
              The backend database is using incompatible SQL syntax. This is a known issue with PostgreSQL compatibility.
            </p>
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-md p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-orange-700 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-orange-900 dark:text-orange-200">
                  <p className="font-semibold mb-1">Technical Details:</p>
                  <code className="block bg-white dark:bg-black/50 p-2 rounded text-xs font-mono">
                    Error: function year(timestamp without time zone) does not exist<br />
                    Code: 42883
                  </code>
                </div>
              </div>
            </div>
            {showDetails && (
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  Backend Fix Required:
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Replace <code className="bg-white dark:bg-black/50 px-1 rounded">year()</code> with <code className="bg-white dark:bg-black/50 px-1 rounded">EXTRACT(YEAR FROM ...)</code></li>
                  <li>Or use <code className="bg-white dark:bg-black/50 px-1 rounded">DATE_PART('year', ...)</code></li>
                  <li>Check backend endpoint: <code className="bg-white dark:bg-black/50 px-1 rounded">/api/manager/dashboard/sales</code></li>
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-white dark:bg-black/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://www.postgresql.org/docs/current/functions-datetime.html', '_blank')}
            className="text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100"
          >
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseErrorAlert;
