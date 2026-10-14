import React, { useState } from 'react';
import { X, Plus, Trash2, Save, ChevronDown, Info } from 'lucide-react';
import type { FilterDefinition, FilterCondition, FilterGroup, MetadataField, FilterOperator, FilterGroupOperator } from '@/types';
import { MOCK_CERTIFICATE_FIELDS, MOCK_QP_FIELDS } from '@/mocks/data';
import {
  Button, Input, Badge, SelectNative, Separator, ScrollArea, Label
} from '@/components/ui';
import { generateId, cn } from '@/lib/utils';

const ALL_FIELDS: MetadataField[] = [
  ...MOCK_CERTIFICATE_FIELDS,
  ...MOCK_QP_FIELDS.filter(f => !MOCK_CERTIFICATE_FIELDS.find(cf => cf.id === f.id)),
  { id: 'name', label: 'Document Name', type: 'text', isSearchable: true, isFilterable: true, isSortable: true, recordCount: 4287, missingCount: 0 },
  { id: 'category', label: 'Document Category', type: 'select', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 4287, missingCount: 0, availableValues: ['certificate', 'question_paper', 'invoice', 'form', 'report', 'qr_barcode', 'general'].map(v => ({ value: v, label: v.replace(/_/g, ' '), count: 0 })) },
  { id: 'uploadedAt', label: 'Upload Date', type: 'date', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 4287, missingCount: 0 },
  { id: 'has_qr_code', label: 'Has QR Code', type: 'boolean', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 4287, missingCount: 0 },
  { id: 'confidence', label: 'Extraction Confidence', type: 'confidence', isSearchable: false, isFilterable: true, isSortable: true, recordCount: 4287, missingCount: 0 },
  { id: 'processingStatus', label: 'Processing Status', type: 'status', isSearchable: false, isFilterable: true, isSortable: false, recordCount: 4287, missingCount: 0 },
];

const OPERATORS_BY_TYPE: Record<string, { value: FilterOperator; label: string }[]> = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  identifier: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_than_or_equal', label: 'Greater than or equal' },
    { value: 'less_than_or_equal', label: 'Less than or equal' },
    { value: 'between', label: 'Between' },
  ],
  confidence: [
    { value: 'greater_than_or_equal', label: 'At least (%)' },
    { value: 'less_than', label: 'Below (%)' },
    { value: 'between', label: 'Between (%)' },
  ],
  date: [
    { value: 'equals', label: 'On date' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
    { value: 'is_empty', label: 'Is missing' },
    { value: 'is_not_empty', label: 'Is present' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'in', label: 'Is one of' },
    { value: 'is_empty', label: 'Is empty' },
  ],
  multi_select: [
    { value: 'in', label: 'Includes any of' },
    { value: 'not_in', label: 'Excludes' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
  boolean: [
    { value: 'true', label: 'Is true' },
    { value: 'false', label: 'Is false' },
  ],
  status: [
    { value: 'equals', label: 'Equals' },
    { value: 'in', label: 'Is one of' },
  ],
};

interface FilterPanelProps {
  filters: FilterDefinition | null;
  onFiltersChange: (filters: FilterDefinition | null) => void;
  onClose: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const [localGroup, setLocalGroup] = useState<FilterGroup>(
    filters?.rootGroup ?? { id: 'root', operator: 'AND', conditions: [] }
  );
  const [fieldSearch, setFieldSearch] = useState('');

  const filteredFields = ALL_FIELDS.filter(f =>
    f.label.toLowerCase().includes(fieldSearch.toLowerCase()) && f.isFilterable
  );

  const addCondition = (field: MetadataField) => {
    const operators = OPERATORS_BY_TYPE[field.type] ?? OPERATORS_BY_TYPE.text;
    const newCondition: FilterCondition = {
      id: generateId(),
      fieldId: field.id,
      fieldLabel: field.label,
      fieldType: field.type,
      operator: operators[0].value,
      value: null,
    };
    setLocalGroup(g => ({ ...g, conditions: [...g.conditions, newCondition] }));
  };

  const updateCondition = (condId: string, updates: Partial<FilterCondition>) => {
    setLocalGroup(g => ({
      ...g,
      conditions: g.conditions.map(c => c.id === condId ? { ...c, ...updates } : c),
    }));
  };

  const removeCondition = (condId: string) => {
    setLocalGroup(g => ({ ...g, conditions: g.conditions.filter(c => c.id !== condId) }));
  };

  const applyFilters = () => {
    if (localGroup.conditions.length === 0) {
      onFiltersChange(null);
    } else {
      onFiltersChange({ rootGroup: localGroup });
    }
  };

  return (
    <div className="w-72 shrink-0 border-r bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="text-sm font-semibold">Filters & Refinement</div>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Group operator */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-2">Combine conditions with</Label>
            <div className="flex gap-2">
              {(['AND', 'OR'] as FilterGroupOperator[]).map(op => (
                <button
                  key={op}
                  type="button"
                  className={cn(
                    'flex-1 h-8 text-xs rounded-md border font-medium transition-colors',
                    localGroup.operator === op
                      ? 'bg-primary text-white border-primary'
                      : 'text-muted-foreground border-input hover:bg-accent'
                  )}
                  onClick={() => setLocalGroup(g => ({ ...g, operator: op }))}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Active conditions */}
          {localGroup.conditions.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground block mb-2">Active conditions ({localGroup.conditions.length})</Label>
              <div className="space-y-2">
                {localGroup.conditions.map((cond, i) => (
                  <ConditionRow
                    key={cond.id}
                    condition={cond}
                    index={i}
                    operator={localGroup.operator}
                    onUpdate={updates => updateCondition(cond.id, updates)}
                    onRemove={() => removeCondition(cond.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Field picker */}
          <div>
            <Label className="text-xs text-muted-foreground block mb-2">Add filter field</Label>
            <Input
              placeholder="Search fields…"
              className="h-7 text-xs mb-2"
              value={fieldSearch}
              onChange={e => setFieldSearch(e.target.value)}
            />
            <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
              {filteredFields.map(field => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => addCondition(field)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{field.label}</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">{field.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {field.missingCount && field.missingCount > 0 && (
                      <span className="text-[9px]">{field.missingCount} missing</span>
                    )}
                    <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </button>
              ))}
              {filteredFields.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No matching fields</p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={() => { setLocalGroup({ id: 'root', operator: 'AND', conditions: [] }); onFiltersChange(null); }}
        >
          Clear
        </Button>
        <Button
          size="sm"
          className="flex-1 h-8 text-xs"
          onClick={applyFilters}
        >
          Apply ({localGroup.conditions.length})
        </Button>
      </div>
    </div>
  );
}

// ─── Condition Row ────────────────────────────────────────────────────────────
interface ConditionRowProps {
  condition: FilterCondition;
  index: number;
  operator: FilterGroupOperator;
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

function ConditionRow({ condition, index, operator, onUpdate, onRemove }: ConditionRowProps) {
  const operators = OPERATORS_BY_TYPE[condition.fieldType] ?? OPERATORS_BY_TYPE.text;
  const field = ALL_FIELDS.find(f => f.id === condition.fieldId);
  const needsValue = !['is_empty', 'is_not_empty', 'true', 'false'].includes(condition.operator);
  const isBetween = condition.operator === 'between';

  return (
    <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{operator}</span>
          )}
          <span className="text-[11px] font-medium text-foreground">{condition.fieldLabel}</span>
        </div>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive p-0.5 rounded">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Operator select */}
      <SelectNative
        className="h-7 text-[11px] w-full"
        value={condition.operator}
        onChange={e => onUpdate({ operator: e.target.value as FilterOperator, value: null })}
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </SelectNative>

      {/* Value input */}
      {needsValue && (
        <>
          {(condition.fieldType === 'select' || condition.fieldType === 'multi_select' || condition.fieldType === 'status') && field?.availableValues ? (
            <SelectNative
              className="h-7 text-[11px] w-full"
              value={String(condition.value ?? '')}
              onChange={e => onUpdate({ value: e.target.value })}
            >
              <option value="">Select value…</option>
              {field.availableValues.map(v => (
                <option key={v.value} value={v.value}>{v.label}{v.count > 0 ? ` (${v.count})` : ''}</option>
              ))}
            </SelectNative>
          ) : isBetween ? (
            <div className="flex items-center gap-1">
              <Input
                className="h-7 text-[11px] flex-1"
                placeholder="From…"
                type={condition.fieldType === 'number' || condition.fieldType === 'confidence' ? 'number' : 'text'}
                value={Array.isArray(condition.value) ? String(condition.value[0] ?? '') : ''}
                onChange={e => {
                  const arr = Array.isArray(condition.value) ? [...condition.value] : [null, null];
                  arr[0] = condition.fieldType === 'confidence' ? Number(e.target.value) / 100 : e.target.value;
                  onUpdate({ value: arr as [string, string] });
                }}
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                className="h-7 text-[11px] flex-1"
                placeholder="To…"
                type={condition.fieldType === 'number' || condition.fieldType === 'confidence' ? 'number' : 'text'}
                value={Array.isArray(condition.value) ? String(condition.value[1] ?? '') : ''}
                onChange={e => {
                  const arr = Array.isArray(condition.value) ? [...condition.value] : [null, null];
                  arr[1] = condition.fieldType === 'confidence' ? Number(e.target.value) / 100 : e.target.value;
                  onUpdate({ value: arr as [string, string] });
                }}
              />
            </div>
          ) : (
            <Input
              className="h-7 text-[11px]"
              placeholder={condition.fieldType === 'confidence' ? 'e.g. 75 (for 75%)' : 'Enter value…'}
              type={condition.fieldType === 'number' || condition.fieldType === 'confidence' ? 'number' : condition.fieldType === 'date' ? 'date' : 'text'}
              value={condition.value !== null ? String(condition.value) : ''}
              onChange={e => {
                const v = e.target.value;
                onUpdate({ value: condition.fieldType === 'confidence' ? Number(v) / 100 : condition.fieldType === 'number' ? Number(v) : v });
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
