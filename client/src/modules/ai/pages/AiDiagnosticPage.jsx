import React, { useState } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import {
  Cpu,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  History,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../../utils/formatters.js';
import api from '../../../services/api.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { DependentDeviceSelect } from '../../../components/common/DependentDeviceSelect.jsx';

export const AiDiagnosticPage = () => {
  const { currentShop, user } = useAuth();
  const shopName = currentShop?.name || user?.shopName;

  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('hypotheses'); // 'hypotheses' | 'tests' | 'procedure' | 'history'

  const runDiagnosis = async (currentAnswers = followUpAnswers) => {
    if (!deviceModel.trim() && !deviceBrand.trim()) {
      toast.error('Please select the device brand or enter the model.');
      return;
    }
    if (!symptoms.trim()) {
      toast.error('Please describe the observed symptoms and fault behavior.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post('/ai/diagnose', {
        deviceBrand: deviceBrand.trim(),
        deviceModel: deviceModel.trim(),
        symptoms: symptoms.trim(),
        followUpAnswers: currentAnswers,
      });

      setAnalysisResult(response);
      toast.success('AI Hardware Diagnostic Triage Completed.');
    } catch (error) {
      console.error('[AiDiagnosticPage] Error:', error);
      toast.error(error.message || 'Failed to complete AI diagnosis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFollowUpAnswers({});
    runDiagnosis({});
  };

  const handleFollowUpAnswer = (questionId, optionValue) => {
    const updatedAnswers = {
      ...followUpAnswers,
      [questionId]: optionValue,
    };
    setFollowUpAnswers(updatedAnswers);
    toast.info('Refining diagnostic analysis with inspection evidence...');
    runDiagnosis(updatedAnswers);
  };

  const handleReset = () => {
    setDeviceBrand('');
    setDeviceModel('');
    setSymptoms('');
    setAnalysisResult(null);
    setFollowUpAnswers({});
  };

  const getConfidenceBadgeColor = (level) => {
    if (level === 'HIGH') return 'badge-green';
    if (level === 'MEDIUM') return 'badge-blue';
    return 'badge-amber';
  };

  const getRiskBadgeColor = (risk) => {
    if (risk === 'HIGH' || risk === 'CRITICAL') return '#ef4444';
    if (risk === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  };

  return (
    <MainLayout title="Zapate AI Assistant" subtitle="Get AI suggestions for the reported device problem.">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> ZAPATE AI ASSISTANT
          </div>
          <h1>Zapate AI Assistant</h1>
          <p>
            Get AI suggestions for the reported device problem.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Symptom Input Card */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>Diagnostic Inputs</strong>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Select device & symptoms</span>
            </div>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <DependentDeviceSelect
                selectedBrand={deviceBrand}
                selectedModel={deviceModel}
                onBrandChange={(b) => setDeviceBrand(b)}
                onModelChange={(m) => setDeviceModel(m)}
                required={true}
                disabled={isAnalyzing}
                brandLabel="Device Brand *"
                modelLabel="Device Model *"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                Observed Problem Symptoms & Fault Behavior *
              </label>
              <textarea
                className="textarea-control"
                rows={4}
                placeholder="e.g. Phone fell in water. Display flickers and back panel gets hot near IC. Battery drains quickly."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                disabled={isAnalyzing}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Supports technical terms, Hinglish, or Gujarati symptom descriptions.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {analysisResult && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
                  <RefreshCw size={13} /> Reset
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Analyzing Circuit...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} /> Run AI Triage
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Triage Output Sheet */}
        <div>
          {!analysisResult ? (
            <div className="card" style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Cpu size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                Ready for Hardware Triage
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                Select a device brand, model, and symptoms on the left to run expert circuit rules and historical repair analysis.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Safety Warnings Banner */}
              {analysisResult.warnings?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysisResult.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: w.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${w.severity === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <ShieldAlert size={20} style={{ color: w.severity === 'CRITICAL' ? '#dc2626' : '#d97706', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '12px', color: '#1e293b' }}>
                        <strong style={{ color: w.severity === 'CRITICAL' ? '#991b1b' : '#92400e', display: 'block', marginBottom: '2px' }}>
                          SAFETY ALERT: {w.title}
                        </strong>
                        <p style={{ margin: '0 0 4px 0' }}>{w.message}</p>
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>Action Required: </span>
                        <span>{w.action_required}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Triage Overview Card */}
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Normalized Symptom Codes ({analysisResult.normalizedSymptoms?.length || 0})
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {analysisResult.normalizedSymptoms?.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: s.category === 'ENVIRONMENTAL_DAMAGE' ? '#dbeafe' : s.category === 'THERMAL' ? '#fee2e2' : '#f1f5f9',
                            color: s.category === 'ENVIRONMENTAL_DAMAGE' ? '#1e40af' : s.category === 'THERMAL' ? '#991b1b' : '#334155',
                          }}
                        >
                          {s.code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Diagnostic Confidence
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`status-badge ${getConfidenceBadgeColor(analysisResult.diagnosticConfidence?.level)}`}>
                        {analysisResult.diagnosticConfidence?.level} ({analysisResult.diagnosticConfidence?.score}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discriminating Follow-up Questions */}
              {analysisResult.followUpQuestions?.length > 0 && (
                <div className="card" style={{ padding: '16px 20px', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <HelpCircle size={16} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#1e40af' }}>
                      Refine Diagnosis: Answer Inspection Questions
                    </strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analysisResult.followUpQuestions.map((q) => (
                      <div key={q.id} style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
                          {q.question}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {q.options?.map((opt, oIdx) => {
                            const isSelected = followUpAnswers[q.id] === opt.value;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleFollowUpAnswer(q.id, opt.value)}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: isSelected ? '700' : '500',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                                  background: isSelected ? '#eff6ff' : '#ffffff',
                                  color: isSelected ? '#1d4ed8' : '#334155',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                {isSelected ? <CheckCircle2 size={13} style={{ color: '#2563eb' }} /> : null}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hypotheses')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'hypotheses' ? '#2563eb' : 'transparent',
                      color: activeTab === 'hypotheses' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Ranked Fault Hypotheses ({analysisResult.hypotheses?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tests')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'tests' ? '#2563eb' : 'transparent',
                      color: activeTab === 'tests' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Things to Check ({analysisResult.recommendedTests?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('procedure')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'procedure' ? '#2563eb' : 'transparent',
                      color: activeTab === 'procedure' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Repair Steps
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'history' ? '#2563eb' : 'transparent',
                      color: activeTab === 'history' ? '#ffffff' : '#64748b',
                    }}
                  >
                    Similar Workshop Cases ({analysisResult.similarRepairs?.totalMatches || 0})
                  </button>
                </div>

                <div style={{ padding: '20px' }}>
                  {/* Tab 1: Hypotheses */}
                  {activeTab === 'hypotheses' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysisResult.hypotheses?.map((hyp, i) => (
                        <div
                          key={hyp.id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '8px',
                            background: i === 0 ? '#f8fafc' : '#ffffff',
                            border: i === 0 ? '1px solid #93c5fd' : '1px solid var(--border-color)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: i === 0 ? '#2563eb' : '#94a3b8',
                                  color: '#ffffff',
                                  fontSize: '11px',
                                  fontWeight: '800',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {i + 1}
                              </span>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{hyp.name}</strong>
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: i === 0 ? '#2563eb' : '#64748b' }}>
                              {hyp.diagnosticConfidenceScore}%
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#334155', marginLeft: '30px', margin: '4px 0 8px 30px' }}>
                            <strong>Why suggested: </strong>{hyp.whySuggested}
                          </div>

                          {hyp.recommendedParts?.length > 0 && (
                            <div style={{ marginLeft: '30px', fontSize: '11px', color: '#64748b' }}>
                              <strong>Suggested Replacement Parts: </strong>{hyp.recommendedParts.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 2: Confirmation Tests */}
                  {activeTab === 'tests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysisResult.recommendedTests?.map((t, i) => (
                        <div key={i} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{t.name}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Tool: <strong>{t.tool_required}</strong></span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0' }}>{t.procedure}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '11px' }}>
                            <div style={{ color: '#16a34a' }}><strong>Expected: </strong>{t.expected_reading}</div>
                            <div style={{ color: '#dc2626' }}><strong>Fail: </strong>{t.fail_condition}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 3: Bench Guidance */}
                  {activeTab === 'procedure' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {analysisResult.hypotheses?.[0]?.benchSteps?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                            Bench Workflow Step-by-Step:
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {analysisResult.hypotheses[0].benchSteps.map((step, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#334155' }}>
                                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                          Post-Repair Quality Assurance Checklist:
                        </strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {analysisResult.postRepairChecklist?.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155' }}>
                              <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Workshop History */}
                  {activeTab === 'history' && (
                    <div>
                      {analysisResult.similarRepairs?.totalMatches > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {analysisResult.similarRepairs.cases?.map((c, idx) => (
                            <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#ffffff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ fontSize: '12px', color: '#0f172a' }}>Job #{c.repair_number} ({c.device_model})</strong>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>{c.similarity_percentage}% Similarity</span>
                              </div>
                              <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0' }}>Issue: {c.issue_summary}</p>
                              <p style={{ fontSize: '11px', color: '#16a34a', margin: '2px 0' }}>Action Taken: {c.diagnosis_notes}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                          No matching historical repair cases recorded yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
