import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Compass,
  Sliders,
  GitBranch,
  Play,
  Check,
  XCircle,
  AlertCircle,
  RotateCcw,
  FileText,
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
  const [activeTab, setActiveTab] = useState('hypotheses'); // 'hypotheses' | 'whatif' | 'journey' | 'gaps' | 'tests' | 'procedure' | 'history'

  // Copilot Test Recording State
  const [actualTestResults, setActualTestResults] = useState([]);
  const [recordResultType, setRecordResultType] = useState('PASS'); // 'PASS' | 'FAIL' | 'OBSERVED_VALUE' | 'INCONCLUSIVE'
  const [recordObservedValue, setRecordObservedValue] = useState('');
  const [recordNotes, setRecordNotes] = useState('');
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  // What-if Simulation State
  const [whatIfSelectedTestId, setWhatIfSelectedTestId] = useState('');
  const [whatIfSelectedOutcome, setWhatIfSelectedOutcome] = useState('PASS');
  const [whatIfObservedValue, setWhatIfObservedValue] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // Available curated test procedures from backend
  const [allProcedures, setAllProcedures] = useState({});

  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        const procedures = await api.get('/ai/procedures');
        if (procedures) {
          setAllProcedures(procedures);
        }
      } catch (err) {
        console.warn('[AiDiagnosticPage] Failed to fetch test procedures catalog:', err);
      }
    };
    fetchProcedures();
  }, []);

  const runDiagnosis = async (currentAnswers = followUpAnswers, currentTests = actualTestResults) => {
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
        testResults: currentTests,
      });

      setAnalysisResult(response);
      if (response?.recommendedNextTest?.testId && !whatIfSelectedTestId) {
        setWhatIfSelectedTestId(response.recommendedNextTest.testId);
      }
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
    setActualTestResults([]);
    setSimulationResult(null);
    runDiagnosis({}, []);
  };

  const handleFollowUpAnswer = (questionId, optionValue) => {
    const updatedAnswers = {
      ...followUpAnswers,
      [questionId]: optionValue,
    };
    setFollowUpAnswers(updatedAnswers);
    toast.info('Refining diagnostic analysis with inspection evidence...');
    runDiagnosis(updatedAnswers, actualTestResults);
  };

  // Record actual bench test result
  const handleRecordTestResult = async (e) => {
    e.preventDefault();
    const testToRecord = analysisResult?.recommendedNextTest;
    if (!testToRecord?.testId) {
      toast.error('No active test selected to record.');
      return;
    }

    setIsSubmittingTest(true);
    try {
      const payload = {
        deviceBrand: deviceBrand.trim(),
        deviceModel: deviceModel.trim(),
        symptoms: symptoms.trim(),
        testId: testToRecord.testId,
        testName: testToRecord.name,
        result: recordResultType,
        observedValue: recordObservedValue.trim(),
        notes: recordNotes.trim(),
      };

      const response = await api.post('/ai/test-planner/record-result', payload);
      const updatedDiagnosis = response.diagnosis || response;

      setAnalysisResult(updatedDiagnosis);
      const updatedTests = [
        ...actualTestResults,
        {
          test_id: testToRecord.testId,
          testId: testToRecord.testId,
          testName: testToRecord.name,
          result: recordResultType,
          observedValue: recordObservedValue.trim(),
          notes: recordNotes.trim(),
          timestamp: new Date().toISOString(),
        },
      ];
      setActualTestResults(updatedTests);

      // Reset form fields
      setRecordObservedValue('');
      setRecordNotes('');
      setRecordResultType('PASS');

      if (updatedDiagnosis?.recommendedNextTest?.testId) {
        setWhatIfSelectedTestId(updatedDiagnosis.recommendedNextTest.testId);
      }

      toast.success(`Bench test observation recorded. Diagnostic scores and journey updated.`);
    } catch (error) {
      console.error('[AiDiagnosticPage.handleRecordTestResult] Error:', error);
      toast.error(error.message || 'Failed to record test result.');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  // Run non-persistent what-if simulation
  const handleRunWhatIf = async () => {
    if (!whatIfSelectedTestId) {
      toast.error('Please select a test procedure to simulate.');
      return;
    }

    setIsSimulating(true);
    try {
      const response = await api.post('/ai/test-planner/simulate', {
        deviceBrand: deviceBrand.trim(),
        deviceModel: deviceModel.trim(),
        symptoms: symptoms.trim(),
        testId: whatIfSelectedTestId,
        hypotheticalOutcome: whatIfSelectedOutcome,
        observedValue: whatIfObservedValue.trim(),
        completedTests: actualTestResults,
      });

      setSimulationResult(response);
      setActiveTab('whatif');
      toast.info('Hypothetical simulation executed. Real data was NOT modified.');
    } catch (error) {
      console.error('[AiDiagnosticPage.handleRunWhatIf] Error:', error);
      toast.error(error.message || 'What-if simulation failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetSimulation = () => {
    setSimulationResult(null);
    setWhatIfObservedValue('');
    toast.info('Returned to actual verified diagnostic state.');
  };

  const handleReset = () => {
    setDeviceBrand('');
    setDeviceModel('');
    setSymptoms('');
    setAnalysisResult(null);
    setFollowUpAnswers({});
    setActualTestResults([]);
    setSimulationResult(null);
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

  const recommendedTest = analysisResult?.recommendedNextTest;
  const testPlan = analysisResult?.testPlan;
  const diagnosticJourney = analysisResult?.diagnosticJourney || [];
  const knowledgeGaps = analysisResult?.knowledgeGaps || [];

  return (
    <MainLayout title="Zapate AI Diagnostic Copilot" subtitle="Adaptive Diagnostic Test Planner & What-if Simulation">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> ZAPATE AI DIAGNOSTIC COPILOT
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Zapate AI Diagnostic Copilot
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: '#dbeafe',
                color: '#1e40af',
                verticalAlign: 'middle',
              }}
            >
              Adaptive Test Planner v2.0
            </span>
          </h1>
          <p>
            Test-guided expert reasoning, actual bench evidence updates, and non-persistent what-if hypothetical simulation.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Symptom Input Card & Quick Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  placeholder="e.g. Phone fell on floor. Display is blank but vibrates on charger. Current meter reads 0.00A."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  required
                  disabled={isAnalyzing}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Supports technical terminology, English, Hinglish, or Gujarati symptom phrases.
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
                      <Sparkles size={15} /> Run Diagnostic Copilot
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Stats & Bench Summary if Result Exists */}
          {analysisResult && (
            <div className="card" style={{ padding: '16px 20px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Diagnostic Summary</span>
                <span className={`status-badge ${getConfidenceBadgeColor(analysisResult.diagnosticConfidence?.level)}`}>
                  {analysisResult.diagnosticConfidence?.level} ({analysisResult.diagnosticConfidence?.score}%)
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>• Verified Symptoms: <strong>{analysisResult.normalizedSymptoms?.length || 0}</strong></div>
                <div>• Actual Tests Performed: <strong>{actualTestResults.length}</strong></div>
                <div>• Estimated Bench Time: <strong>{analysisResult.benchTimeEstimate || '30 - 45 min'}</strong></div>
                <div>• Parts Availability: <strong>{analysisResult.partsEstimate?.has_inventory_match ? 'In Shop Stock' : 'Order Required'}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Copilot Recommended Next Test, Record Result, and Tabs */}
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
                <Compass size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                Ready for Adaptive Diagnostic Planning
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                Enter the device brand, model, and symptoms to initiate test-guided reasoning.
                The copilot will recommend deterministic tests to separate competing hypotheses and allow what-if outcome simulation.
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

              {/* SECTION 1: RECOMMENDED NEXT TEST & RECORD ACTUAL RESULT */}
              {recommendedTest ? (
                <div
                  className="card"
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                    border: '2px solid #3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
                  }}
                >
                  {/* Test Header */}
                  <div
                    style={{
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Compass size={20} />
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '800', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Copilot Recommended Next Diagnostic Test
                        </span>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                          {recommendedTest.name}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Clock size={12} /> ~{recommendedTest.benchTimeMinutes} min bench time
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: '#ffffff',
                        }}
                      >
                        {recommendedTest.category}
                      </span>
                    </div>
                  </div>

                  {/* Test Details Body */}
                  <div style={{ padding: '16px 20px', background: '#ffffff' }}>
                    {/* Why this test was chosen (Selection Reason) */}
                    <div
                      style={{
                        padding: '12px 14px',
                        background: '#eff6ff',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe',
                        marginBottom: '14px',
                      }}
                    >
                      <strong style={{ fontSize: '12px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} /> Selection Rationale (Adaptive Separation Heuristic):
                      </strong>
                      <p style={{ fontSize: '12px', color: '#1e3a8a', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        {testPlan?.selectionReason || 'Selects the fastest non-destructive test to separate top competing hypotheses.'}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '12px',
                        fontSize: '12px',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>Required Tool / Equipment:</strong>
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>{recommendedTest.toolRequired}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>Expected Normal Reading:</strong>
                        <span style={{ color: '#16a34a', fontWeight: '600' }}>{recommendedTest.expectedReading}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>Fail Condition:</strong>
                        <span style={{ color: '#dc2626', fontWeight: '600' }}>{recommendedTest.failCondition}</span>
                      </div>
                      {recommendedTest.ruleReference && (
                        <div>
                          <strong style={{ color: '#475569', display: 'block', marginBottom: '2px' }}>Standard Reference:</strong>
                          <span style={{ color: '#64748b' }}>{recommendedTest.ruleReference}</span>
                        </div>
                      )}
                    </div>

                    {/* Prerequisites and Precautions */}
                    {(recommendedTest.prerequisites?.length > 0 || recommendedTest.safetyPrecautions?.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {recommendedTest.prerequisites?.map((p, pIdx) => (
                          <span key={pIdx} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#334155' }}>
                            Prerequisite: {p}
                          </span>
                        ))}
                        {recommendedTest.safetyPrecautions?.map((sp, spIdx) => (
                          <span key={spIdx} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: '600' }}>
                            Precaution: {sp}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* SECTION 2: RECORD ACTUAL TEST OBSERVATION FORM */}
                    <div
                      style={{
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                        Record Technician Bench Observation:
                      </strong>

                      <form onSubmit={handleRecordTestResult}>
                        {/* Result Selector Buttons */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                          <button
                            type="button"
                            onClick={() => setRecordResultType('PASS')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: recordResultType === 'PASS' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                              background: recordResultType === 'PASS' ? '#f0fdf4' : '#ffffff',
                              color: recordResultType === 'PASS' ? '#15803d' : '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Check size={14} /> PASS (Meets Expected Reading)
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecordResultType('FAIL')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: recordResultType === 'FAIL' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                              background: recordResultType === 'FAIL' ? '#fef2f2' : '#ffffff',
                              color: recordResultType === 'FAIL' ? '#b91c1c' : '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <XCircle size={14} /> FAIL (Fault Confirmed)
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecordResultType('OBSERVED_VALUE')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: recordResultType === 'OBSERVED_VALUE' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                              background: recordResultType === 'OBSERVED_VALUE' ? '#eff6ff' : '#ffffff',
                              color: recordResultType === 'OBSERVED_VALUE' ? '#1d4ed8' : '#475569',
                              cursor: 'pointer',
                            }}
                          >
                            Numerical Reading
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecordResultType('INCONCLUSIVE')}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: recordResultType === 'INCONCLUSIVE' ? '2px solid #d97706' : '1px solid #cbd5e1',
                              background: recordResultType === 'INCONCLUSIVE' ? '#fffbeb' : '#ffffff',
                              color: recordResultType === 'INCONCLUSIVE' ? '#b45309' : '#475569',
                              cursor: 'pointer',
                            }}
                          >
                            Inconclusive
                          </button>
                        </div>

                        {/* Observed Value & Notes Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '10px', alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Observed Reading:
                            </label>
                            <input
                              type="text"
                              className="input-control"
                              placeholder="e.g. 0.00A or 0.485V"
                              value={recordObservedValue}
                              onChange={(e) => setRecordObservedValue(e.target.value)}
                              disabled={isSubmittingTest}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Technician Bench Notes (Optional):
                            </label>
                            <input
                              type="text"
                              className="input-control"
                              placeholder="e.g. Verified with FNIRSI meter on OEM Type-C cable"
                              value={recordNotes}
                              onChange={(e) => setRecordNotes(e.target.value)}
                              disabled={isSubmittingTest}
                            />
                          </div>

                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmittingTest}
                            style={{ height: '38px', padding: '0 16px', whiteSpace: 'nowrap' }}
                          >
                            {isSubmittingTest ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" /> Updating Evidence...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} /> Submit Observation
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '16px 20px', background: '#f8fafc', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      Diagnostic Threshold Reached
                    </strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 26px' }}>
                    {testPlan?.selectionReason || 'Standard non-destructive bench tests completed. Review ranked hypotheses below or proceed with repair.'}
                  </p>
                </div>
              )}

              {/* SECTION 5: KNOWLEDGE GAP ALERT BANNER (If Ambiguity Exists) */}
              {knowledgeGaps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {knowledgeGaps.map((gap, gIdx) => (
                    <div
                      key={gIdx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <AlertTriangle size={18} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '12px', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#9a3412' }}>{gap.title}</strong>
                          <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: '#ffedd5', color: '#c2410c' }}>
                            {gap.gapType}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0', color: '#431407' }}>{gap.description}</p>
                        <p style={{ margin: '2px 0', color: '#7c2d12', fontStyle: 'italic' }}>
                          Suggested Expert Action: {gap.suggestedExpertReview}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NAVIGATION TABS */}
              <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
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
                    onClick={() => setActiveTab('whatif')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'whatif' ? '#2563eb' : 'transparent',
                      color: activeTab === 'whatif' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Sliders size={13} /> What-if Simulator
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('journey')}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: activeTab === 'journey' ? '#2563eb' : 'transparent',
                      color: activeTab === 'journey' ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <GitBranch size={13} /> Diagnostic Journey ({diagnosticJourney.length})
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
                  {/* TAB 1: RANKED HYPOTHESES */}
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
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                                {hyp.category}
                              </span>
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '800', color: i === 0 ? '#2563eb' : '#64748b' }}>
                              {hyp.diagnosticConfidenceScore}%
                            </span>
                          </div>

                          {/* Supporting Evidence */}
                          {hyp.supportingEvidence?.length > 0 && (
                            <div style={{ marginLeft: '30px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', display: 'block' }}>
                                Supporting Evidence:
                              </span>
                              <ul style={{ margin: '2px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: '#334155' }}>
                                {hyp.supportingEvidence.map((ev, evIdx) => (
                                  <li key={evIdx}>{ev}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Conflicting Evidence */}
                          {hyp.conflictingEvidence?.length > 0 && (
                            <div style={{ marginLeft: '30px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', display: 'block' }}>
                                Contradicting Evidence:
                              </span>
                              <ul style={{ margin: '2px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: '#64748b' }}>
                                {hyp.conflictingEvidence.map((cev, cevIdx) => (
                                  <li key={cevIdx}>{cev}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Parts & Estimated Time */}
                          <div style={{ display: 'flex', gap: '16px', marginLeft: '30px', marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                            <span>Estimated Bench Time: <strong>{hyp.estBenchMinutes}</strong></span>
                            {hyp.recommendedParts?.length > 0 && (
                              <span>Recommended Parts: <strong>{hyp.recommendedParts.join(', ')}</strong></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: WHAT-IF SIMULATOR */}
                  {activeTab === 'whatif' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Interactive Simulation Controls */}
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <Sliders size={18} style={{ color: '#2563eb' }} />
                          <div>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                              Simulate Hypothetical Test Outcomes
                            </strong>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                              Explore how fault rankings shift under hypothetical pass/fail results without saving changes.
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 180px auto', gap: '10px', alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Choose Test Procedure to Simulate:
                            </label>
                            <select
                              className="input-control"
                              value={whatIfSelectedTestId}
                              onChange={(e) => setWhatIfSelectedTestId(e.target.value)}
                            >
                              <option value="">-- Select Diagnostic Test --</option>
                              {Object.entries(allProcedures).map(([tId, tDef]) => (
                                <option key={tId} value={tId}>
                                  {tDef.name} ({tDef.bench_time_minutes} min)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Hypothetical Outcome:
                            </label>
                            <select
                              className="input-control"
                              value={whatIfSelectedOutcome}
                              onChange={(e) => setWhatIfSelectedOutcome(e.target.value)}
                            >
                              <option value="PASS">PASS (Normal)</option>
                              <option value="FAIL">FAIL (Defect Found)</option>
                              <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                              Simulated Reading:
                            </label>
                            <input
                              type="text"
                              className="input-control"
                              placeholder="e.g. 1.80A or 0.00A"
                              value={whatIfObservedValue}
                              onChange={(e) => setWhatIfObservedValue(e.target.value)}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleRunWhatIf}
                              disabled={isSimulating}
                              style={{ height: '38px', padding: '0 16px' }}
                            >
                              {isSimulating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} Simulate
                            </button>
                            {simulationResult && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleResetSimulation}
                                style={{ height: '38px', padding: '0 12px' }}
                              >
                                <RotateCcw size={14} /> Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Simulation Results Output */}
                      {simulationResult ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Hypothetical Disclaimer Banner */}
                          <div
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#1e40af' }}>
                              <Info size={16} />
                              <span>
                                <strong>HYPOTHETICAL SIMULATION ONLY:</strong> Showing projected ranking shifts if{' '}
                                <strong>{simulationResult.simulatedTest?.name}</strong> results in{' '}
                                <strong style={{ color: simulationResult.hypotheticalOutcome === 'PASS' ? '#16a34a' : '#dc2626' }}>
                                  {simulationResult.hypotheticalOutcome}
                                </strong>
                                . Real repair data was NOT modified.
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleResetSimulation}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              Exit Simulation
                            </button>
                          </div>

                          {/* Hypothesis Shifts Grid */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {simulationResult.rankShifts?.map((shift) => (
                              <div
                                key={shift.id}
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color)',
                                  background: shift.direction === 'GAINS_SUPPORT' ? '#f0fdf4' : shift.direction === 'LOSES_SUPPORT' ? '#fef2f2' : '#ffffff',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{shift.name}</strong>
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: shift.direction === 'GAINS_SUPPORT' ? '#dcfce7' : shift.direction === 'LOSES_SUPPORT' ? '#fee2e2' : '#f1f5f9',
                                        color: shift.direction === 'GAINS_SUPPORT' ? '#15803d' : shift.direction === 'LOSES_SUPPORT' ? '#b91c1c' : '#475569',
                                      }}
                                    >
                                      {shift.direction}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                                    {shift.rationale}
                                  </p>
                                </div>

                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                      Rank #{shift.oldRank} → <strong>#{shift.newRank}</strong>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: shift.probabilityDelta > 0 ? '#16a34a' : shift.probabilityDelta < 0 ? '#dc2626' : '#64748b' }}>
                                      {shift.oldProbability}% → {shift.newProbability}% ({shift.probabilityDelta > 0 ? `+${shift.probabilityDelta}` : shift.probabilityDelta}%)
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Next Logical Test in Simulation */}
                          {simulationResult.nextLogicalTest && (
                            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                                Logical Follow-up Test After Hypothetical {simulationResult.hypotheticalOutcome}:
                              </strong>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
                                {simulationResult.nextLogicalTest.name}
                              </span>
                              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                                {simulationResult.nextLogicalTestReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                          Select a test procedure and an outcome above, then click <strong>Simulate</strong> to see how competing hypotheses would change.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: DIAGNOSTIC JOURNEY */}
                  {activeTab === 'journey' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                        Traceable timeline of symptom inputs, actual completed tests, and hypothesis re-ranking throughout this session:
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                        {diagnosticJourney.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '14px 16px',
                              borderRadius: '8px',
                              background: '#ffffff',
                              border: '1px solid var(--border-color)',
                              borderLeft: `4px solid ${step.stepType === 'INITIAL_EVALUATION' ? '#64748b' : step.stepType === 'TEST_EXECUTED' ? '#2563eb' : '#16a34a'}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                                Step {step.stepIndex}: {step.title}
                              </strong>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                {new Date(step.timestamp || Date.now()).toLocaleTimeString()}
                              </span>
                            </div>

                            <p style={{ fontSize: '12px', color: '#334155', margin: '2px 0 8px 0' }}>
                              {step.description}
                            </p>

                            {/* Hypotheses at this step */}
                            {step.hypothesesRanking?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {step.hypothesesRanking.map((h, hIdx) => (
                                  <span
                                    key={hIdx}
                                    style={{
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: hIdx === 0 ? '#eff6ff' : '#f1f5f9',
                                      color: hIdx === 0 ? '#1d4ed8' : '#475569',
                                      fontWeight: hIdx === 0 ? '700' : '500',
                                    }}
                                  >
                                    #{hIdx + 1} {h.name} ({h.probability}%)
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Remaining uncertainties */}
                            {step.remainingUncertainties?.length > 0 && (
                              <div style={{ marginTop: '8px', fontSize: '11px', color: '#d97706' }}>
                                ⚠️ {step.remainingUncertainties.join(' ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: THINGS TO CHECK (CONFIRMATION PROCEDURES) */}
                  {activeTab === 'tests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {analysisResult.recommendedTests?.map((test, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: '#ffffff',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{test.name}</strong>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb' }}>
                              ⏱️ {test.bench_time_minutes || 5} min
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0' }}>
                            <strong>Tool:</strong> {test.tool_required}
                          </p>
                          <p style={{ fontSize: '12px', color: '#334155', margin: '4px 0' }}>
                            <strong>Procedure:</strong> {test.procedure}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                            <span style={{ color: '#16a34a' }}>Expected: {test.expected_reading}</span>
                            <span style={{ color: '#dc2626' }}>Fail Condition: {test.fail_condition}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 5: REPAIR STEPS */}
                  {activeTab === 'procedure' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {analysisResult.repairGuidance?.bench_steps?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                            Step-by-Step Bench Repair Protocol:
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analysisResult.repairGuidance.bench_steps.map((step, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#334155' }}>
                                <span
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {idx + 1}
                                </span>
                                <span style={{ paddingTop: '2px' }}>{step}</span>
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

                  {/* TAB 6: WORKSHOP HISTORY */}
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
