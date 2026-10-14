import React from 'react';
import type { FilterDefinition, FilterCondition } from '@/types';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';

interface ActiveFilterChipsProps {
  filters: FilterDefinition;
  onRemoveCondition: (conditionId: string) => void;
  onClearAll: () => void;
}

function formatConditionLabel(condition: FilterCondition): string {
  const opLabels: Record<string, string> = {
    equals: '=',
    not_equals: '≠',
    contains: 'contains',
    not_contains: 'not contains',
    starts_with: 'starts with',
    ends_with: 'ends with',
    greater_than: '>',
    less_than: '<',
    greater_than_or_equal: '≥',
    less_than_or_equal: '≤',
    between: 'between',
    in: 'in',
    not_in: 'not in',
    is_empty: 'is empty',
    is_not_empty: 'is not empty',
    before: 'before',
    after: 'after',
    true: 'is true',
    false: 'is false',
  };
  const op = opLabels[condition.operator] ?? condition.operator;
  const val = condition.value !== null ? String(condition.value) : '';
  if (['is_empty', 'is_not_empty', 'true', 'false'].includes(condition.operator)) {
    return `${condition.fieldLabel} ${op}`;
  }
  return `${condition.fieldLabel} ${op} ${val}`;
}

export function ActiveFilterChips({ filters, onRemoveCondition, onClearAll }: ActiveFilterChipsProps) {
  const conditions = filters.rootGroup.conditions;
  if (conditions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2">
      <span className="text-xs text-muted-foreground shrink-0">Active filters:</span>
      {conditions.map((cond, i) => (
        <React.Fragment key={cond.id}>
          {i > 0 && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {filters.rootGroup.operator}
            </span>
          )}
          <Badge
            variant="info"
            className="gap-1 pr-1 text-[11px] font-normal max-w-xs"
          >
            <span className="truncate">{formatConditionLabel(cond)}</span>
            <button
              type="button"
              onClick={() => onRemoveCondition(cond.id)}
              className="ml-0.5 rounded-full hover:bg-blue-200 p-0.5 shrink-0"
              aria-label={`Remove filter: ${formatConditionLabel(cond)}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        </React.Fragment>
      ))}
      <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive px-1.5" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
