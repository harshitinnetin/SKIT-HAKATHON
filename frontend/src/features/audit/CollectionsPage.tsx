import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { MOCK_COLLECTIONS } from '@/mocks/data';
import { getCategoryLabel, getCategoryColor, formatRelativeTime } from '@/lib/utils';

export function CollectionsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold">Smart Collections</h1>
          <p className="text-xs text-muted-foreground">Organize and group related documents</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MOCK_COLLECTIONS.map(col => (
          <Card key={col.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate('/documents')}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{col.name}</div>
                  {col.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{col.description}</div>}
                </div>
              </div>

              {col.category && (
                <Badge className={`text-[10px] border mb-2 ${getCategoryColor(col.category)}`} variant="outline">
                  {getCategoryLabel(col.category)}
                </Badge>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  <span>{col.documentCount.toLocaleString()} documents</span>
                </div>
                {col.isShared && <Badge variant="secondary" className="text-[9px]">Shared</Badge>}
              </div>

              <div className="text-[10px] text-muted-foreground mt-1">Updated {formatRelativeTime(col.updatedAt)}</div>

              <div className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Open <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
