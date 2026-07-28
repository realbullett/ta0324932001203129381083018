import React, { useState, useEffect } from 'react';
import { supabase, DiagnosisRecord } from '../services/supabase';
import { User } from '../types';
import { UrgencyLevel } from '../types';

interface DashboardProps {
  user: User;
}

type NavSection = 'history' | 'reports' | 'diagnosis' | 'medication';

export function Dashboard({ user }: DashboardProps) {
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'emergency' | 'normal' | 'medication'>('all');
  const [activeNav, setActiveNav] = useState<NavSection>('history');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRecords(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const parseConditions = (json: string) => {
    try { return JSON.parse(json); } catch { return []; }
  };

  const parseMessages = (json: string) => {
    try { return JSON.parse(json); } catch { return []; }
  };

  const parseMedicationData = (json: string) => {
    try { return JSON.parse(json); } catch { return null; }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case UrgencyLevel.CRITICAL: return '#ef4444';
      case UrgencyLevel.HIGH: return '#f97316';
      case UrgencyLevel.MEDIUM: return '#eab308';
      default: return '#22c55e';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const downloadReport = (html: string) => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`
        <html>
          <head>
            <title>Clinical Report - Tabib</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; }
              .report-content h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
              .report-content h2 { font-size: 18px; font-weight: 600; color: #334155; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
              .report-content p { margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
              .report-content ul { list-style-type: disc; padding-left: 20px; margin-bottom: 16px; font-size: 14px; }
              .report-content li { margin-bottom: 6px; }
            </style>
          </head>
          <body>
            ${html}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      w.document.close();
    }
  };

  const filteredRecords = records.filter(r => {
    if (activeTab === 'emergency') return r.is_emergency;
    if (activeTab === 'normal') return !r.is_emergency && r.type !== 'medication';
    if (activeTab === 'medication') return r.type === 'medication';
    return true;
  });

  const recordsWithReports = records.filter(r => r.report_html);

  const stats = {
    total: records.length,
    emergencies: records.filter(r => r.is_emergency).length,
    thisMonth: records.filter(r => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const navItems: { key: NavSection; label: string }[] = [
    { key: 'history', label: 'History' },
    { key: 'reports', label: 'Reports' },
    { key: 'diagnosis', label: 'New Diagnosis' },
    { key: 'medication', label: 'New Med Info' },
  ];

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* User */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <img
          src={user.picture}
          alt={user.name}
          className="w-10 h-10 rounded-full border border-white/10 mb-3"
        />
        <div className="text-sm font-semibold text-white truncate">{user.name}</div>
        <div className="text-[11px] text-zinc-500 truncate">{user.email}</div>
      </div>

      {/* Nav */}
      <div className="px-3 pt-4 pb-2">
        <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 px-2 mb-2">Menu</div>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => { setActiveNav(item.key); setSidebarOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
              activeNav === item.key
                ? 'bg-white/[0.08] text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Close */}
      <div className="mt-auto px-3 pb-4">
        <button
          onClick={() => window.close()}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          Close Tab
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-white/[0.01] sticky top-0 h-screen overflow-y-auto">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-black/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-400"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <span className="text-sm font-semibold text-white">
              {navItems.find(n => n.key === activeNav)?.label || 'Dashboard'}
            </span>
          </div>
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-white/10" />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-64 bg-black border-r border-white/[0.06] overflow-y-auto">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile spacer */}
        <div className="lg:hidden h-14" />

        {activeNav === 'diagnosis' && (
          <iframe src="/home" className="w-full border-0" style={{ height: 'calc(100vh - 0px)' }} title="Diagnosis" />
        )}

        {activeNav === 'medication' && (
          <iframe src="/medication" className="w-full border-0" style={{ height: 'calc(100vh - 0px)' }} title="Medication" />
        )}

        {activeNav === 'history' && (
          <div className="px-4 md:px-8 py-8 md:py-12 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Welcome back, {user.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-sm text-zinc-500">Here's an overview of your health consultation history.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total Visits</span>
                <div className="text-3xl font-black text-white mt-3">{stats.total}</div>
                <p className="text-[11px] text-zinc-600 mt-1">All time consultations</p>
              </div>
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Emergencies</span>
                <div className="text-3xl font-black text-white mt-3">{stats.emergencies}</div>
                <p className="text-[11px] text-zinc-600 mt-1">Urgent cases flagged</p>
              </div>
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">This Month</span>
                <div className="text-3xl font-black text-white mt-3">{stats.thisMonth}</div>
                <p className="text-[11px] text-zinc-600 mt-1">Recent activity</p>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit mb-6">
              {(['all', 'emergency', 'normal', 'medication'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab
                      ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab === 'emergency' ? 'Emergencies' : tab === 'normal' ? 'Normal' : 'Medications'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-24">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchRecords} className="mt-4 text-xs text-white/40 hover:text-white/60 underline">
                  Try again
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-zinc-400 text-sm font-medium mb-1">
                  {activeTab === 'all' ? 'No diagnoses yet' : `No ${activeTab} cases`}
                </p>
                <p className="text-zinc-600 text-xs">
                  {activeTab === 'all'
                    ? 'Start a consultation to see your history here.'
                    : 'Try a different filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => {
                  const conditions = parseConditions(record.conditions);
                  const medicationData = record.medication_data ? parseMedicationData(record.medication_data) : null;
                  const isExpanded = expandedId === record.id;
                  const topCondition = conditions[0];
                  const title = record.type === 'medication' && medicationData?.medication?.name
                    ? medicationData.medication.name
                    : topCondition?.name || 'Consultation';

                  return (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all hover:border-white/[0.1]"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : record.id)}
                        className="w-full flex items-center gap-4 p-5 text-left bg-transparent border-none cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white/90 truncate">
                            {record.type === 'medication' ? '💊 ' : ''}{title}
                          </h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-zinc-500">{formatDate(record.created_at)}</span>
                            <span className="text-zinc-700">·</span>
                            <span className="text-xs text-zinc-600">{formatTime(record.created_at)}</span>
                            {conditions.length > 1 && (
                              <>
                                <span className="text-zinc-700">·</span>
                                <span className="text-xs text-zinc-600">+{conditions.length - 1} more</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {topCondition?.urgency && (
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full hidden sm:inline-block"
                              style={{
                                color: getUrgencyColor(topCondition.urgency),
                                backgroundColor: `${getUrgencyColor(topCondition.urgency)}12`,
                                border: `1px solid ${getUrgencyColor(topCondition.urgency)}20`,
                              }}
                            >
                              {topCondition.urgency}
                            </span>
                          )}
                          <span className="text-zinc-500 text-xs">{isExpanded ? '−' : '+'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-white/[0.04]">
                          {record.report_html && (
                            <div className="mt-4 flex">
                              <button
                                onClick={() => downloadReport(record.report_html!)}
                                className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                Download Report
                              </button>
                            </div>
                          )}

                          {record.type === 'medication' && medicationData?.medication ? (
                            <div className="mt-4 space-y-3">
                              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="grid grid-cols-2 gap-4 text-[11px]">
                                  <div>
                                    <span className="text-zinc-600 block">Name</span>
                                    <span className="text-white/80">{medicationData.medication.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Generic</span>
                                    <span className="text-white/80">{medicationData.medication.generic_name}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Dosage</span>
                                    <span className="text-white/80">{medicationData.medication.specifications?.dosage || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Type</span>
                                    <span className="text-white/80">{medicationData.medication.specifications?.type || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Manufacturer</span>
                                    <span className="text-white/80">{medicationData.medication.manufacturer?.name || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Country of Origin</span>
                                    <span className="text-white/80">{medicationData.medication.manufacturer?.country_of_origin || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Expiry</span>
                                    <span className="text-white/80">{medicationData.medication.dates?.expiry_date || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">Confidence</span>
                                    <span className="text-white/80">{medicationData.analysis_confidence}%</span>
                                  </div>
                                </div>
                              </div>

                              {medicationData.medication.clinical_info?.uses?.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-2">Uses</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {medicationData.medication.clinical_info.uses.map((use: string, i: number) => (
                                      <span key={i} className="text-[10px] text-white/70 bg-white/[0.05] px-2 py-0.5 rounded-full">{use}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {medicationData.medication.clinical_info?.side_effects?.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-2">Side Effects</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {medicationData.medication.clinical_info.side_effects.map((se: string, i: number) => (
                                      <span key={i} className="text-[10px] text-yellow-400/70 bg-yellow-400/[0.06] px-2 py-0.5 rounded-full">{se}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {medicationData.medication.clinical_info?.administration_guide && (
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-2">Administration</span>
                                  <p className="text-[11px] text-zinc-500 leading-relaxed">{medicationData.medication.clinical_info.administration_guide}</p>
                                </div>
                              )}

                              {medicationData.medication.clinical_info?.warnings && (
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-yellow-400/10 bg-yellow-400/[0.02]">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-400/60 block mb-2">Warnings</span>
                                  <p className="text-[11px] text-zinc-500 leading-relaxed">{medicationData.medication.clinical_info.warnings}</p>
                                </div>
                              )}

                              {medicationData.disclaimer && (
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-2">Disclaimer</span>
                                  <p className="text-[11px] text-zinc-500 leading-relaxed italic">{medicationData.disclaimer}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 space-y-2">
                              {conditions.map((c: any, i: number) => (
                                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-white/80">{c.name}</span>
                                    <div className="flex items-center gap-3">
                                      {c.probability && (
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-12 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                            <div
                                              className="h-full rounded-full"
                                              style={{
                                                width: `${c.probability}%`,
                                                backgroundColor: getUrgencyColor(c.urgency),
                                              }}
                                            />
                                          </div>
                                          <span className="text-[10px] text-zinc-500">{c.probability}%</span>
                                        </div>
                                      )}
                                      <span
                                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                                        style={{
                                          color: getUrgencyColor(c.urgency),
                                          backgroundColor: `${getUrgencyColor(c.urgency)}12`,
                                        }}
                                      >
                                        {c.urgency}
                                      </span>
                                    </div>
                                  </div>
                                  {c.description && (
                                    <p className="text-[11px] text-zinc-500 leading-relaxed mt-2">{c.description}</p>
                                  )}
                                  {c.recommendations?.length > 0 && (
                                    <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-1.5">Recommendations</span>
                                      <ul className="space-y-1">
                                        {c.recommendations.map((r: string, j: number) => (
                                          <li key={j} className="text-[11px] text-zinc-500">
                                            {r}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {record.general_advice && (
                            <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-2">General Advice</span>
                              <p className="text-[11px] text-zinc-500 leading-relaxed">{record.general_advice}</p>
                            </div>
                          )}

                          {(() => {
                            const msgs = parseMessages(record.messages);
                            return msgs.length > 0 ? (
                              <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 block mb-3">Conversation</span>
                                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                  {msgs.map((m: any, i: number) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div
                                        className="max-w-[80%] text-[11px] leading-relaxed px-3.5 py-2.5 rounded-2xl"
                                        style={{
                                          background: m.role === 'user' ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.04)',
                                          color: m.role === 'user' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                                          borderBottomRightRadius: m.role === 'user' ? '6px' : '16px',
                                          borderBottomLeftRadius: m.role === 'assistant' ? '6px' : '16px',
                                        }}
                                      >
                                        {m.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeNav === 'reports' && (
          <div className="px-4 md:px-8 py-8 md:py-12 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Reports</h1>
              <p className="text-sm text-zinc-500">Download clinical reports from your past consultations.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
              </div>
            ) : recordsWithReports.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-zinc-400 text-sm font-medium mb-1">No reports yet</p>
                <p className="text-zinc-600 text-xs">Reports will appear here after you generate one from a diagnosis.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recordsWithReports.map((record) => {
                  const conditions = parseConditions(record.conditions);
                  const topCondition = conditions[0];

                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white/90 truncate">
                          {topCondition?.name || 'Consultation'}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-zinc-500">{formatDate(record.created_at)}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-600">{formatTime(record.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadReport(record.report_html!)}
                        className="shrink-0 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors px-4 py-2 rounded-lg border border-purple-400/20 bg-purple-400/5"
                      >
                        Download
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
