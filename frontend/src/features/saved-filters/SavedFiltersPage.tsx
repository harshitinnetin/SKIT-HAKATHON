import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookmarkCheck, Plus, Trash2, Edit2, Play, Share2, Copy } from 'lucide-react';
import {
  Card, CardContent, Button, Badge, EmptyState,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui';
import { MOCK_SAVED_FILTERS } from '@/mocks/data';
import { getCategoryLabel, getCategoryColor, formatRelativeTime } from '@/lib/utils';
import type { SavedFilter } from '@/types';

export function SavedFiltersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(MOCK_SAVED_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<SavedFilter | null>(null);

  const handleDelete = () => {
    if (deleteTarget) {
      setFilters(prev => prev.filter(f => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const handleApply = (filter: SavedFilter) => {
    const category = filter.category;
    const path = category === 'certificate' ? '/certificates' :
      category === 'question_paper' ? '/question-papers' : '/documents';
    navigate(path);
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-semibold">Saved Filters</h1>
          <p className="text-xs text-muted-foreground">Reusable filter configurations and saved views</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Create Filter
        </Button>
      </div>

      {filters.length === 0 ? (
        <EmptyState
          icon={<BookmarkCheck className="h-12 w-12" />}
          title="No saved filters"
          description="Save filter configurations to quickly apply them later."
          action={<Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> Create your first filter</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filters.map(filter => (
            <Card key={filter.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{filter.name}</div>
                    {filter.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{filter.description}</div>
                    )}
                  </div>
                  <div className="flex gap-0.5 ml-2 shrink-0">
                    {filter.isShared && (
                      <Badge variant="secondary" className="text-[9px] px-1">Shared</Badge>
                    )}
                  </div>
                </div>

                {filter.category && (
                  <Badge className={`text-[10px] border mb-2 ${getCategoryColor(filter.category)}`} variant="outline">
                    {getCategoryLabel(filter.category)}
                  </Badge>
                )}

                {/* Conditions summary */}
                <div className="space-y-0.5 mb-3">
                  {filter.filterDefinition.rootGroup.conditions.slice(0, 3).map((cond, i) => (
                    <div key={cond.id} className="flex items-center gap-1.5 text-[11px]">
                      {i > 0 && (
                        <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1 py-0.5 rounded">
                          {filter.filterDefinition.rootGroup.operator}
                        </span>
                      )}
                      <span className="text-muted-foreground">{cond.fieldLabel}</span>
                      <span className="text-foreground font-medium">{cond.operator.replace(/_/g, ' ')}</span>
                      {cond.value !== null && <span className="text-primary font-mono">{String(cond.value)}</span>}
                    </div>
                  ))}
                  {filter.filterDefinition.rootGroup.conditions.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{filter.filterDefinition.rootGroup.conditions.length - 3} more conditions
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-3">
                  <span>Used {filter.usageCount} times</span>
                  <span>Updated {formatRelativeTime(filter.updatedAt)}</span>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleApply(filter)}>
                    <Play className="h-3 w-3 mr-1" /> Apply
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7" title="Edit">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7" title="Duplicate">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete" onClick={() => setDeleteTarget(filter)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Saved Filter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
