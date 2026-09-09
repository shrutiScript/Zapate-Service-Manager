import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Wrench,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  History,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  CheckSquare,
  Square,
  ThumbsUp,
  ThumbsDown,
  X,
  FileCheck,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../utils/formatters.js';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { DependentDeviceSelect } from '../common/DependentDeviceSelect.jsx';

export const AiDiagnosticModal = ({
  isOpen,
  onClose,
  initialBrand = '',
  initialModel = '',
  initialSymptoms = '',
  repairJobId = null,
  onApplyToJob,
}) => {
  const { currentShop, user } = useAuth();
  const shopName = currentShop?.name || user?.shopName;
  const [deviceBrand, setDeviceBrand] = useState(initialBrand || '');
  const [deviceModel, setDeviceModel] = useState(initialModel || '');
  const [symptoms, setSymptoms] = useState(initialSymptoms || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [activeTab, setActiveTab] = useState('hypotheses'); // 'hypotheses' | 'tests' | 'history' | 'procedure'
  
  // Apply-to-job selection state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyOptions, setApplyOptions] = useState({
    applyDiagnosisNotes: true,
    applyEstimatedAmount: false,
    applyParts: false,
    selectedFaultIndex: 0,
  });
  const [isApplying, setIsApplying] = useState(false);

  // Feedback state
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [confirmedFaultInput, setConfirmedFaultInput] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (initialBrand) setDeviceBrand(initialBrand);
    if (initialModel) setDeviceModel(initialModel);
    if (initialSymptoms) setSymptoms(initialSymptoms);
  }, [initialBrand, initialModel, initialSymptoms]);

  const runDiagnosis = async (currentAnswers = followUpAnswers, overrideBrand = null, overrideModel = null, overrideSymptoms = null) => {
    const targetBrand = (overrideBrand !== null ? overrideBrand : deviceBrand).trim();
    const targetModel = (overrideModel !== null ? overrideModel : deviceModel).trim();
    const targetSymptoms = (overrideSymptoms !== null ? overrideSymptoms : symptoms).trim();

    if (!targetModel && !targetBrand) {
      toast.error('Please enter the device brand or model.');
      return;
    }
    if (!targetSymptoms) {
      toast.error('Please describe the observed symptoms and fault behavior.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post('/ai/diagnose', {
        deviceBrand: targetBrand,
        deviceModel: targetModel,
        symptoms: targetSymptoms,
        followUpAnswers: currentAnswers,
        repairJobId,
      });

      setAnalysisResult(response);
      setFeedbackSent(false);
      toast.success('Zapate AI Assistant analysis completed.');
    } catch (error) {
      console.error('[AiDiagnosticModal] Error:', error);
      toast.error(error.message || 'Failed to complete AI diagnosis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-run diagnosis when opened with brand/model/symptoms
  useEffect(() => {
    if (isOpen) {
      const b = initialBrand || deviceBrand;
      const m = initialModel || deviceModel;
      const s = initialSymptoms || symptoms;
      if ((b.trim() || m.trim()) && s.trim()) {
        runDiagnosis({}, b, m, s);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    toast.info('Updating AI analysis with inspection response...');
    runDiagnosis(updatedAnswers);
  };

  const handleReset = () => {
    setDeviceBrand('');
    setDeviceModel('');
    setSymptoms('');
    setAnalysisResult(null);
    setFollowUpAnswers({});
    setFeedbackSent(false);
  };

  const handleOpenApplyModal = () => {
    if (!analysisResult?.hypotheses?.length) {
      toast.error('No AI suggestions available to apply.');
      return;
    }
    setIsApplyModalOpen(true);
  };

  const handleConfirmApply = async () => {
    const selectedHypothesis = analysisResult?.hypotheses?.[applyOptions.selectedFaultIndex] || analysisResult?.hypotheses?.[0];
    if (!selectedHypothesis) return;

    const mainFaultText = `AI detected: ${selectedHypothesis.name}`;
    const diagnosisNotesText = `AI detected: ${selectedHypothesis.name}\nAI Confidence: ${selectedHypothesis.diagnosticConfidenceScore}%\nRationale: ${selectedHypothesis.whySuggested}\nThings to Check: ${selectedHypothesis.confirmationTests?.join(', ') || 'Visual & multimeter inspection'}`;

    const selections = {
      brand: deviceBrand,
      model: deviceModel,
      symptoms: symptoms,
      selectedFaultName: selectedHypothesis.name,
      faultDescription: mainFaultText,
      diagnosisNotes: diagnosisNotesText,
      estimatedAmount: analysisResult?.costEstimate?.amount || 0,
      parts: (selectedHypothesis.recommendedParts || []).map((p) => ({
        name: p,
        quantity: 1,
        unitPrice: 0,
      })),
    };

    if (onApplyToJob) {
      onApplyToJob(selections);
      setIsApplyModalOpen(false);
      onClose();
      return;
    }

    if (repairJobId) {
      setIsApplying(true);
      try {
        await api.post(`/ai/apply-to-job/${repairJobId}`, selections);
        toast.success('AI recommendations applied to repair job ticket!');
        setIsApplyModalOpen(false);
        onClose();
      } catch (error) {
        toast.error(error.message || 'Failed to apply AI suggestions to job card.');
      } finally {
        setIsApplying(false);
      }
    } else {
      window.dispatchEvent(new CustomEvent('openCreateJobWithAi', { detail: selections }));
      try {
        sessionStorage.setItem('pendingAiDiagnosis', JSON.stringify(selections));
      } catch (e) {}

      setIsApplyModalOpen(false);
      onClose();

      if (!window.location.pathname.startsWith('/repairs')) {
        window.location.href = '/repairs?fromAi=true';
      }
    }
  };

  const handleSendFeedback = async (wasUseful) => {
    if (!analysisResult) return;
    setIsSubmittingFeedback(true);
    try {
      await api.post('/ai/feedback', {
        repairJobId,
        deviceBrand,
        deviceModel,
        symptoms,
        predictedHypotheses: analysisResult.hypotheses?.map((h) => ({
          id: h.id,
          name: h.name,
          diagnosticConfidenceScore: h.diagnosticConfidenceScore,
        })),
        confirmedFault: confirmedFaultInput.trim() || analysisResult.hypotheses?.[0]?.name,
        technicianNotes: feedbackNotes.trim(),
        wasAiUseful: wasUseful,
      });
      setFeedbackSent(true);
      toast.success('Technician feedback saved. This helps calibrate future workshop accuracy.');
    } catch (err) {
      toast.error('Failed to submit feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '820px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                  Zapate AI Assistant
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    background: '#3b82f6',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {shopName ? `${shopName} · Zapate AI Assistant` : 'Zapate AI Assistant'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Get AI suggestions for the reported device problem.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Input Form */}
          <form onSubmit={handleFormSubmit} style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <DependentDeviceSelect
                selectedBrand={deviceBrand}
                selectedModel={deviceModel}
                onBrandChange={(brand) => setDeviceBrand(brand)}
                onModelChange={(model) => setDeviceModel(model)}
                required={true}
                disabled={isAnalyzing}
                brandLabel="Company / Brand *"
                modelLabel="Device Model *"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: '700' }}>
                Observed Problem Symptoms & Fault Behavior *
              </label>
              <textarea
                className="input-control"
                rows={2}
                placeholder="e.g. Phone fell on road. Screen is black but vibrates when plugged into charger, or phone garam thay chhe ane charge nathi thatu."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                disabled={isAnalyzing}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {analysisResult ? (
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
                  <RefreshCw size={13} /> Reset
                </button>
              ) : (
                <div />
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Evaluating Circuit Rules...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Run AI Diagnosis
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* AI Analysis Output */}
          {analysisResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Safety Warnings Banner */}
              {analysisResult.warnings?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysisResult.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: w.severity === 'CRITICAL' ? '#fef2f2' : w.severity === 'DANGER' ? '#fff1f2' : '#fffbeb',
                        border: `1px solid ${w.severity === 'CRITICAL' ? '#fecaca' : w.severity === 'DANGER' ? '#fecdd3' : '#fde68a'}`,
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

              {/* Triage Overview Bar: Symptoms & Confidence */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      Detected Problem ({analysisResult.normalizedSymptoms?.length || 0})
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {analysisResult.normalizedSymptoms?.length > 0 ? (
                        analysisResult.normalizedSymptoms.map((s, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: s.category === 'ENVIRONMENTAL_DAMAGE' ? '#dbeafe' : s.category === 'THERMAL' ? '#fee2e2' : '#e2e8f0',
                              color: s.category === 'ENVIRONMENTAL_DAMAGE' ? '#1e40af' : s.category === 'THERMAL' ? '#991b1b' : '#334155',
                            }}
                          >
                            {s.code}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>General diagnostic mode</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                      AI Confidence
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', justifyContent: 'flex-end' }}>
                      <span className={`status-badge ${getConfidenceBadgeColor(analysisResult.diagnosticConfidence?.level)}`}>
                        {analysisResult.diagnosticConfidence?.level} ({analysisResult.diagnosticConfidence?.score}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Missing Info Notes */}
                {analysisResult.missingInformation?.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '11px', color: '#64748b' }}>
                    <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    <span style={{ fontWeight: '700' }}>Information gap: </span>
                    {analysisResult.missingInformation.join(' • ')}
                  </div>
                )}
              </div>

              {/* Follow-up Questions (Interactive) */}
              {analysisResult.followUpQuestions?.length > 0 && (
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <HelpCircle size={16} style={{ color: '#2563eb' }} />
                    <strong style={{ fontSize: '13px', color: '#1e40af' }}>
                      Discriminating Follow-up Questions (Answer to refine diagnosis)
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
                                {isSelected ? <CheckCircle2 size={13} style={{ color: '#2563eb' }} /> : <span style={{ width: '13px' }} />}
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
              <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('hypotheses')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'hypotheses' ? '#2563eb' : '#64748b',
                    borderBottom: activeTab === 'hypotheses' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Possible Problems ({analysisResult.hypotheses?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tests')}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'tests' ? '#2563eb' : '#64748b',
                    borderBottom: activeTab === 'tests' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
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
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'procedure' ? '#2563eb' : '#64748b',
                    borderBottom: activeTab === 'procedure' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
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
                    border: 'none',
                    background: 'transparent',
                    color: activeTab === 'history' ? '#2563eb' : '#64748b',
                    borderBottom: activeTab === 'history' ? '2px solid #2563eb' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Similar Repairs ({analysisResult.similarRepairs?.totalMatches || 0})
                </button>
              </div>

              {/* Tab 1: Ranked Root Causes */}
              {activeTab === 'hypotheses' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysisResult.hypotheses?.map((hyp, i) => (
                    <div
                      key={hyp.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: i === 0 ? '#f8fafc' : '#ffffff',
                        border: i === 0 ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
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
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '30px' }}>
                            Category: {hyp.category} • Risk Level: <span style={{ color: getRiskBadgeColor(hyp.riskLevel), fontWeight: '700' }}>{hyp.riskLevel}</span>
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: i === 0 ? '#2563eb' : '#64748b' }}>
                            {hyp.diagnosticConfidenceScore}%
                          </span>
                          <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>Confidence</span>
                        </div>
                      </div>

                      {/* Why AI Suggested This */}
                      <div style={{ margin: '8px 0 8px 30px', fontSize: '12px', color: '#334155' }}>
                        <span style={{ fontWeight: '700', color: '#475569' }}>Why suggested: </span>
                        {hyp.whySuggested}
                      </div>

                      {/* Supporting Evidence */}
                      {hyp.supportingEvidence?.length > 0 && (
                        <div style={{ marginLeft: '30px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>
                            Supporting Evidence:
                          </span>
                          <ul style={{ margin: '2px 0 0 14px', fontSize: '11px', color: '#15803d' }}>
                            {hyp.supportingEvidence.map((ev, eIdx) => (
                              <li key={eIdx}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Conflicting Evidence */}
                      {hyp.conflictingEvidence?.length > 0 && (
                        <div style={{ marginLeft: '30px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase' }}>
                            Conflicting / Penalty Factors:
                          </span>
                          <ul style={{ margin: '2px 0 0 14px', fontSize: '11px', color: '#b91c1c' }}>
                            {hyp.conflictingEvidence.map((ev, eIdx) => (
                              <li key={eIdx}>{ev}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommended Parts */}
                      {hyp.recommendedParts?.length > 0 && (
                        <div style={{ marginLeft: '30px', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                          <span style={{ fontWeight: '700' }}>Recommended Parts: </span>
                          {hyp.recommendedParts.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Confirmation Tests */}
              {activeTab === 'tests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {analysisResult.recommendedTests?.map((t, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{t.name}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Tool: <strong>{t.tool_required}</strong></span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0' }}>{t.procedure}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '11px' }}>
                        <div style={{ color: '#16a34a' }}>
                          <strong>Expected Reading: </strong>{t.expected_reading}
                        </div>
                        <div style={{ color: '#dc2626' }}>
                          <strong>Fail Condition: </strong>{t.fail_condition}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Bench Procedure & Guidance */}
              {activeTab === 'procedure' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {analysisResult.hypotheses?.[0]?.benchSteps?.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                        Standard Bench Workflow for {analysisResult.hypotheses[0].name}:
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

                  {/* Post-Repair Quality Testing Checklist */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                      Post-Repair Quality Assurance Checklist (Before Customer Handover):
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

              {/* Tab 4: Workshop Similar Cases */}
              {activeTab === 'history' && (
                <div>
                  {analysisResult.similarRepairs?.totalMatches > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Found <strong>{analysisResult.similarRepairs.totalMatches}</strong> similar completed repairs in this workshop.
                      </div>
                      {analysisResult.similarRepairs.cases?.map((c, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
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
                      No prior matching repairs found in this workshop's private database yet.
                    </div>
                  )}
                </div>
              )}

              {/* Cost & Bench Time Estimation Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  background: '#ffffff',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    Estimated Bench Time
                  </span>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a', marginTop: '2px' }}>
                    {analysisResult.benchTimeEstimate}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    Estimated Repair Quote
                  </span>
                  <strong style={{ display: 'block', fontSize: '14px', color: analysisResult.costEstimate?.isEstimated ? '#2563eb' : '#64748b', marginTop: '2px' }}>
                    {analysisResult.costEstimate?.formatted || 'Inspection Required'}
                  </strong>
                  {analysisResult.costEstimate?.confidenceText && (
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                      {analysisResult.costEstimate.confidenceText}
                    </span>
                  )}
                </div>
              </div>

              {/* Feedback Section */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Was this diagnostic suggestion useful?</span>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Your feedback calibrates future case accuracy for your workshop.</span>
                </div>
                {feedbackSent ? (
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>✓ Feedback Recorded</span>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSendFeedback(true)}
                      disabled={isSubmittingFeedback}
                    >
                      <ThumbsUp size={13} style={{ color: '#16a34a' }} /> Accurate
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSendFeedback(false)}
                      disabled={isSubmittingFeedback}
                    >
                      <ThumbsDown size={13} style={{ color: '#dc2626' }} /> Inaccurate
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {analysisResult ? 'Recommendations are advisory based on probabilistic evidence.' : 'Enter symptoms to triage.'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {analysisResult && (
              <button type="button" className="btn btn-primary" onClick={handleOpenApplyModal}>
                <FileCheck size={15} /> Create Repair Job
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simplified Create Repair Job Confirmation Popup */}
      {isApplyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              background: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
          >
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Create Repair Job
            </h4>
            <p style={{ fontSize: '13px', color: '#334155', marginBottom: '6px', lineHeight: '1.4' }}>
              Your AI diagnosis will be added to the repair job automatically.
            </p>
            <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '20px' }}>
              The detected problem and diagnosis details will be pre-filled.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={isApplying}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmApply}
                disabled={isApplying}
                style={{ boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
              >
                {isApplying ? 'Creating...' : 'Create Repair Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
