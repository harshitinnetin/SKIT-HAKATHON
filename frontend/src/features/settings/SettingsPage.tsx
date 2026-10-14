import React, { useState } from 'react';
import {
  Settings, Brain, Zap, Database, Bell, Shield, Palette,
  Globe, HardDrive, Key, Save, CheckCircle2, ChevronRight,
  Cpu, RefreshCw, Eye, EyeOff, AlertTriangle, Info
} from 'lucide-react';
import {
  Card, CardContent, Button, Input, Badge
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface SettingSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: SettingSection[] = [
  { id: 'ai',          label: 'AI & Processing',    icon: Brain,     description: 'Configure OCR, classification, and extraction models' },
  { id: 'storage',     label: 'Storage & Retention', icon: HardDrive, description: 'Manage file storage, limits, and retention policies' },
  { id: 'security',    label: 'Security & Access',   icon: Shield,    description: 'Authentication, permissions and audit settings' },
  { id: 'integration', label: 'Integrations & API',  icon: Zap,       description: 'API keys, webhooks, and third-party connections' },
  { id: 'notify',      label: 'Notifications',       icon: Bell,      description: 'Email alerts, Slack notifications, and webhook events' },
  { id: 'appearance',  label: 'Appearance',          icon: Palette,   description: 'Theme, language, and display preferences' },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
        checked ? 'bg-primary' : 'bg-border'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  );
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('ai');
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // AI settings state
  const [aiSettings, setAiSettings] = useState({
    ocrEnabled: true,
    autoClassify: true,
    confidenceThreshold: 75,
    languageDetect: true,
    extractTables: true,
    extractSignatures: false,
    model: 'gemini-1.5-pro',
    maxConcurrent: 5,
  });

  // Storage settings state
  const [storageSettings, setStorageSettings] = useState({
    retentionDays: 365,
    maxFileSizeMb: 50,
    autoCompress: true,
    keepOriginals: true,
  });

  // Notification settings
  const [notifySettings, setNotifySettings] = useState({
    emailOnComplete: true,
    emailOnError: true,
    slackEnabled: false,
    weeklyDigest: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeConfig = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure AI pipeline, storage, security and platform preferences
          </p>
        </div>
        <Button size="sm" onClick={handleSave} className={cn(saved && 'bg-emerald-600 hover:bg-emerald-700')}>
          {saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <aside className="w-56 shrink-0">
          <nav className="flex flex-col gap-1">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors w-full',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{section.label}</span>
                  <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', activeSection === section.id && 'rotate-90 text-primary')} />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Settings content */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          {activeConfig && (
            <div className="mb-4 flex items-center gap-3 pb-3 border-b border-border">
              <div className="p-2 rounded-lg bg-primary/10">
                <activeConfig.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{activeConfig.label}</h2>
                <p className="text-xs text-muted-foreground">{activeConfig.description}</p>
              </div>
            </div>
          )}

          {/* ── AI Settings ─────────────────────────────────────────── */}
          {activeSection === 'ai' && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable OCR Processing</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Automatically extract text from scanned documents and images</p>
                    </div>
                    <ToggleSwitch checked={aiSettings.ocrEnabled} onChange={v => setAiSettings(s => ({ ...s, ocrEnabled: v }))} />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-Classification</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Automatically categorize documents on upload using AI models</p>
                    </div>
                    <ToggleSwitch checked={aiSettings.autoClassify} onChange={v => setAiSettings(s => ({ ...s, autoClassify: v }))} />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Language Detection</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Detect and tag document language for multilingual support</p>
                    </div>
                    <ToggleSwitch checked={aiSettings.languageDetect} onChange={v => setAiSettings(s => ({ ...s, languageDetect: v }))} />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Extract Tables &amp; Structured Data</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Parse tables, key-value pairs and structured metadata from documents</p>
                    </div>
                    <ToggleSwitch checked={aiSettings.extractTables} onChange={v => setAiSettings(s => ({ ...s, extractTables: v }))} />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Signature Detection</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Detect and flag handwritten signatures in documents
                        <Badge variant="secondary" className="ml-2 text-[10px]">Beta</Badge>
                      </p>
                    </div>
                    <ToggleSwitch checked={aiSettings.extractSignatures} onChange={v => setAiSettings(s => ({ ...s, extractSignatures: v }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Classification Model</label>
                    <select
                      value={aiSettings.model}
                      onChange={e => setAiSettings(s => ({ ...s, model: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Faster)</option>
                      <option value="custom">Custom Fine-tuned Model</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Model affects accuracy and processing speed
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Confidence Threshold: <span className="text-primary">{aiSettings.confidenceThreshold}%</span>
                    </label>
                    <input
                      type="range"
                      min={50} max={99} step={1}
                      value={aiSettings.confidenceThreshold}
                      onChange={e => setAiSettings(s => ({ ...s, confidenceThreshold: Number(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>50% (More results)</span><span>99% (Higher accuracy)</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Max Concurrent Processing Jobs: <span className="text-primary">{aiSettings.maxConcurrent}</span></label>
                    <input
                      type="range"
                      min={1} max={20} step={1}
                      value={aiSettings.maxConcurrent}
                      onChange={e => setAiSettings(s => ({ ...s, maxConcurrent: Number(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Storage Settings ─────────────────────────────────────── */}
          {activeSection === 'storage' && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Document Retention Period (days)</label>
                    <Input
                      type="number"
                      value={storageSettings.retentionDays}
                      onChange={e => setStorageSettings(s => ({ ...s, retentionDays: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Set to 0 for unlimited retention</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Maximum File Size (MB)</label>
                    <Input
                      type="number"
                      value={storageSettings.maxFileSizeMb}
                      onChange={e => setStorageSettings(s => ({ ...s, maxFileSizeMb: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-compress Uploaded Files</p>
                      <p className="text-xs text-muted-foreground">Reduce storage usage by compressing large PDFs</p>
                    </div>
                    <ToggleSwitch checked={storageSettings.autoCompress} onChange={v => setStorageSettings(s => ({ ...s, autoCompress: v }))} />
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Keep Original Files</p>
                      <p className="text-xs text-muted-foreground">Retain unprocessed originals alongside extracted versions</p>
                    </div>
                    <ToggleSwitch checked={storageSettings.keepOriginals} onChange={v => setStorageSettings(s => ({ ...s, keepOriginals: v }))} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Storage Usage</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Documents & Metadata', used: 68, total: 100, color: 'bg-blue-500' },
                      { label: 'Processed Outputs', used: 23, total: 100, color: 'bg-violet-500' },
                      { label: 'Audit Logs', used: 4, total: 100, color: 'bg-amber-500' },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{item.label}</span>
                          <span>{item.used} GB / {item.total} GB</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.used}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Security Settings ─────────────────────────────────────── */}
          {activeSection === 'security' && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">API Access Key</span>
                  </div>
                  <div className="relative">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value="sk-docintel-prod-a4f9b2c1d8e3f7a0"
                      readOnly
                      className="font-mono pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1 rounded hover:bg-accent"
                      >
                        {showApiKey ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      <button type="button" className="p-1 rounded hover:bg-accent">
                        <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">Keep your API key secret. Never expose it in client-side code or public repositories.</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 space-y-4">
                  {[
                    { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin users', checked: true },
                    { label: 'Session Timeout (30 min)', desc: 'Automatically log out inactive users', checked: true },
                    { label: 'IP Allowlist', desc: 'Restrict access to specific IP ranges', checked: false },
                    { label: 'Audit Log Immutability', desc: 'Prevent modification of audit trail entries', checked: true },
                  ].map((item, i, arr) => (
                    <React.Fragment key={item.label}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <ToggleSwitch checked={item.checked} onChange={() => {}} />
                      </div>
                      {i < arr.length - 1 && <div className="h-px bg-border" />}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Integration Settings ───────────────────────────────────── */}
          {activeSection === 'integration' && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  {[
                    { name: 'Google Drive', desc: 'Import documents directly from Google Drive', connected: true, icon: '🔗' },
                    { name: 'Microsoft SharePoint', desc: 'Sync with SharePoint document libraries', connected: false, icon: '📁' },
                    { name: 'Slack', desc: 'Send processing alerts and summaries to Slack', connected: false, icon: '💬' },
                    { name: 'Zapier', desc: 'Automate workflows via Zapier integrations', connected: false, icon: '⚡' },
                  ].map((int, i, arr) => (
                    <React.Fragment key={int.name}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{int.icon}</span>
                          <div>
                            <p className="text-sm font-medium">{int.name}</p>
                            <p className="text-xs text-muted-foreground">{int.desc}</p>
                          </div>
                        </div>
                        <Button variant={int.connected ? 'outline' : 'default'} size="sm">
                          {int.connected ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                      {i < arr.length - 1 && <div className="h-px bg-border" />}
                    </React.Fragment>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Notification Settings ──────────────────────────────────── */}
          {activeSection === 'notify' && (
            <Card>
              <CardContent className="p-5 space-y-5">
                {[
                  { key: 'emailOnComplete' as const, label: 'Email on Processing Complete', desc: 'Get notified when document batches finish processing' },
                  { key: 'emailOnError'    as const, label: 'Email on Processing Errors',   desc: 'Receive alerts when documents fail to process' },
                  { key: 'slackEnabled'   as const, label: 'Slack Notifications',           desc: 'Post real-time updates to your Slack workspace' },
                  { key: 'weeklyDigest'   as const, label: 'Weekly Activity Digest',        desc: 'Receive a weekly summary email with analytics and stats' },
                ].map((item, i, arr) => (
                  <React.Fragment key={item.key}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ToggleSwitch
                        checked={notifySettings[item.key]}
                        onChange={v => setNotifySettings(s => ({ ...s, [item.key]: v }))}
                      />
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-border" />}
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── Appearance Settings ────────────────────────────────────── */}
          {activeSection === 'appearance' && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Theme</label>
                    <div className="flex gap-3">
                      {['Light', 'Dark', 'System'].map(theme => (
                        <button
                          key={theme}
                          className={cn(
                            'flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                            theme === 'Light'
                              ? 'bg-primary text-white border-primary'
                              : 'border-border text-muted-foreground hover:bg-accent'
                          )}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Language</label>
                    <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>English (US)</option>
                      <option>Hindi (हिंदी)</option>
                      <option>Gujarati (ગુજરાતી)</option>
                    </select>
                  </div>
                  <div className="h-px bg-border" />
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Date Format</label>
                    <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD (ISO 8601)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
