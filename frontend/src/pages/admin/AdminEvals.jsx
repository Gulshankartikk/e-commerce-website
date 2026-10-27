import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiActivity,
  FiPlay,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiDollarSign,
  FiBookOpen,
  FiShield,
  FiExternalLink,
  FiFilter,
} from 'react-icons/fi';
import api from '../../api/axios.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDate } from '../../utils/format.js';

export default function AdminEvals() {
  const [activeTab, setActiveTab] = useState('overview');
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [caseFilter, setCaseFilter] = useState('all');

  const fetchEvals = async () => {
    try {
      setLoading(true);
      const [evalsRes, docsRes] = await Promise.all([
        api.get('/admin/rag/evals'),
        api.get('/admin/rag/documents'),
      ]);

      setRuns(evalsRes.data.runs || []);
      setDocuments(docsRes.data.documents || []);

      if (evalsRes.data.runs?.length > 0) {
        // Fetch full details of the latest run
        const detailRes = await api.get(`/admin/rag/evals/${evalsRes.data.runs[0].runId}`);
        setSelectedRun(detailRes.data.run);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvals();
  }, []);

  const handleSelectRun = async (runId) => {
    try {
      const res = await api.get(`/admin/rag/evals/${runId}`);
      setSelectedRun(res.data.run);
      setActiveTab('cases');
    } catch (err) {
      toast.error('Could not load run details');
    }
  };

  const handleTriggerEval = async () => {
    try {
      setTriggering(true);
      toast('Starting LLM evaluation run...', { icon: '🧪' });
      const res = await api.post('/admin/rag/evals/trigger');
      toast.success('Evaluation run completed!');
      await fetchEvals();
      if (res.data.evaluation?.runId) {
        handleSelectRun(res.data.evaluation.runId);
      }
    } catch (err) {
      toast.error(err.message || 'Evaluation run failed');
    } finally {
      setTriggering(false);
    }
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      toast('Re-indexing canonical knowledge documents...', { icon: '📚' });
      const res = await api.post('/admin/rag/reindex');
      toast.success(res.data.message || 'Knowledge base successfully re-indexed!');
      await fetchEvals();
    } catch (err) {
      toast.error(err.message || 'Re-indexing failed');
    } finally {
      setReindexing(false);
    }
  };

  if (loading && !selectedRun && runs.length === 0) {
    return <TableSkeleton rows={8} />;
  }

  const latestMetrics = selectedRun?.summaryMetrics || runs[0]?.summaryMetrics || {};
  const isGatePassed = selectedRun ? selectedRun.qualityGatePassed : runs[0]?.qualityGatePassed;

  const kpis = [
    {
      label: 'Quality Gate',
      value: isGatePassed ? 'PASSED' : 'FAILED',
      icon: isGatePassed ? FiCheckCircle : FiXCircle,
      color: isGatePassed ? 'from-emerald-600 to-emerald-400' : 'from-rose-600 to-rose-400',
    },
    {
      label: 'Pass Rate',
      value: `${latestMetrics.passRate ?? 0}%`,
      sub: `${latestMetrics.passedCases ?? 0}/${latestMetrics.totalCases ?? 0} cases`,
      icon: FiActivity,
      color: 'from-primary to-primary-400',
    },
    {
      label: 'Mean Recall@k',
      value: (latestMetrics.meanRecallAtK ?? 0).toFixed(2),
      sub: 'Top-k semantic retrieval',
      icon: FiBookOpen,
      color: 'from-secondary-500 to-secondary-400',
    },
    {
      label: 'Citation Precision',
      value: (latestMetrics.meanCitationPrecision ?? 0).toFixed(2),
      sub: 'Zero hallucinated links',
      icon: FiShield,
      color: 'from-amber-500 to-amber-400',
    },
    {
      label: 'Mean Faithfulness',
      value: (latestMetrics.meanFaithfulness ?? 0).toFixed(2),
      sub: 'Groundedness score',
      icon: FiCheckCircle,
      color: 'from-purple-600 to-purple-400',
    },
    {
      label: 'Abstention Accuracy',
      value: `${((latestMetrics.abstentionAccuracy ?? 0) * 100).toFixed(0)}%`,
      sub: 'Out-of-scope discipline',
      icon: FiShield,
      color: 'from-teal-600 to-teal-400',
    },
    {
      label: 'Avg Latency',
      value: `${latestMetrics.averageLatencyMs ?? 0}ms`,
      sub: 'End-to-end response',
      icon: FiClock,
      color: 'from-blue-600 to-blue-400',
    },
    {
      label: 'Total Cost',
      value: `$${(latestMetrics.totalCostUsd ?? 0).toFixed(4)}`,
      sub: `${latestMetrics.totalTokens ?? 0} tokens`,
      icon: FiDollarSign,
      color: 'from-emerald-600 to-emerald-400',
    },
  ];

  const filteredCases = (selectedRun?.cases || []).filter((c) => {
    if (caseFilter === 'passed') return c.passed;
    if (caseFilter === 'failed') return !c.passed;
    if (caseFilter === 'adversarial') return c.category === 'adversarial';
    if (caseFilter === 'unsupported') return c.category === 'unsupported';
    if (caseFilter === 'policy') return c.category.includes('policy');
    if (caseFilter === 'specs') return c.category.includes('specs');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <FiActivity className="text-primary-400" />
            <span>AI RAG & Automated Evaluation Dashboard</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Ground-truth dataset evaluations, verified citation audit, latency & faithfulness metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={reindexing ? 'animate-spin' : ''} />
            <span>{reindexing ? 'Re-indexing...' : 'Re-index Knowledge'}</span>
          </button>

          <button
            onClick={handleTriggerEval}
            disabled={triggering}
            className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-all disabled:opacity-50"
          >
            <FiPlay className={triggering ? 'animate-pulse' : ''} />
            <span>{triggering ? 'Running Evals...' : 'Run Evaluation Suite'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-surface flex items-center gap-3.5 p-4">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${k.color} text-lg text-white shadow-sm`}
            >
              <k.icon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{k.label}</p>
              <p className="text-lg font-black leading-tight text-white">{k.value}</p>
              {k.sub && <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Run Summary & Historical Runs
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'cases'
              ? 'border-primary text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Test Case Analysis ({selectedRun?.cases?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-primary text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Indexed Knowledge Documents ({documents.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & RUN HISTORY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active run meta box */}
          {selectedRun && (
            <div className="card-surface p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-white">{selectedRun.runId}</h2>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        selectedRun.qualityGatePassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {selectedRun.qualityGatePassed ? 'Gate Passed' : 'Gate Failed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Executed on {formatDate(selectedRun.createdAt)} • Dataset {selectedRun.datasetVersion} • Model{' '}
                    <span className="font-mono text-purple-300">{selectedRun.modelName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Trigger Type</p>
                  <p className="text-xs font-semibold uppercase text-slate-200">{selectedRun.triggerType}</p>
                </div>
              </div>

              {/* Quality Thresholds vs Actuals */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-slate-400">Pass Rate</p>
                  <p className="text-base font-bold text-white mt-1">{selectedRun.summaryMetrics?.passRate}%</p>
                  <p className="text-[10px] text-slate-500">Min {selectedRun.qualityThresholds?.minPassRate}%</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-slate-400">Recall@k</p>
                  <p className="text-base font-bold text-white mt-1">{selectedRun.summaryMetrics?.meanRecallAtK}</p>
                  <p className="text-[10px] text-slate-500">Min {selectedRun.qualityThresholds?.minRecallAtK}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-slate-400">Citation Precision</p>
                  <p className="text-base font-bold text-white mt-1">{selectedRun.summaryMetrics?.meanCitationPrecision}</p>
                  <p className="text-[10px] text-slate-500">Min {selectedRun.qualityThresholds?.minCitationPrecision}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-slate-400">Faithfulness</p>
                  <p className="text-base font-bold text-white mt-1">{selectedRun.summaryMetrics?.meanFaithfulness}</p>
                  <p className="text-[10px] text-slate-500">Min {selectedRun.qualityThresholds?.minFaithfulness}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                  <p className="text-slate-400">Abstention Accuracy</p>
                  <p className="text-base font-bold text-white mt-1">
                    {((selectedRun.summaryMetrics?.abstentionAccuracy ?? 0) * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-slate-500">Min {selectedRun.qualityThresholds?.minAbstentionAccuracy * 100}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Historical Runs Table */}
          <div className="card-surface overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Evaluation Runs History</h3>
              <span className="text-xs text-slate-400">{runs.length} recorded runs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-3.5">Run ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Dataset</th>
                    <th className="p-3.5">Model</th>
                    <th className="p-3.5">Pass Rate</th>
                    <th className="p-3.5">Recall@k</th>
                    <th className="p-3.5">Faithfulness</th>
                    <th className="p-3.5">Latency</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {runs.map((r) => (
                    <tr
                      key={r.runId}
                      className={`hover:bg-white/5 transition-colors ${
                        selectedRun?.runId === r.runId ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-white">{r.runId}</td>
                      <td className="p-3.5 text-slate-400">{formatDate(r.createdAt)}</td>
                      <td className="p-3.5">{r.datasetVersion}</td>
                      <td className="p-3.5 font-mono text-purple-300">{r.modelName}</td>
                      <td className="p-3.5 font-bold">
                        <span
                          className={
                            r.summaryMetrics?.passRate >= 80 ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {r.summaryMetrics?.passRate}%
                        </span>
                      </td>
                      <td className="p-3.5">{r.summaryMetrics?.meanRecallAtK}</td>
                      <td className="p-3.5">{r.summaryMetrics?.meanFaithfulness}</td>
                      <td className="p-3.5">{r.summaryMetrics?.averageLatencyMs}ms</td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            r.qualityGatePassed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {r.qualityGatePassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSelectRun(r.runId)}
                          className="rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-slate-200 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED TEST CASES */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 card-surface p-3.5">
            <div className="flex items-center gap-2">
              <FiFilter className="text-slate-400 text-sm" />
              <span className="text-xs font-semibold text-slate-300">Filter cases:</span>
              <div className="flex flex-wrap gap-1">
                {['all', 'passed', 'failed', 'policy', 'specs', 'adversarial', 'unsupported'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setCaseFilter(f)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      caseFilter === f ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredCases.length} of {selectedRun?.cases?.length || 0} cases
            </span>
          </div>

          <div className="space-y-3">
            {filteredCases.map((c, i) => (
              <div
                key={c.caseId}
                className={`card-surface p-4 border-l-4 transition-all ${
                  c.passed ? 'border-l-emerald-500' : 'border-l-rose-500'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                        c.passed ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      {c.passed ? '✓' : '✕'}
                    </span>
                    <span className="font-mono font-bold text-sm text-white">{c.caseId}</span>
                    <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300">
                      {c.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Latency: {c.latencyMs}ms</span>
                    <span>Cost: ${c.costUsd?.toFixed(5)}</span>
                    <span
                      className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                        c.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {c.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-400">Question: </span>
                    <span className="text-slate-100 font-medium">{c.question}</span>
                  </div>

                  <div className="rounded-xl bg-white/5 p-3 text-slate-300">
                    <p className="font-bold text-slate-400 text-[11px] mb-1">Generated Assistant Reply:</p>
                    <p className="leading-relaxed">{c.actualAnswer}</p>
                  </div>

                  {c.failureReason && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300 flex items-center gap-2">
                      <FiAlertTriangle className="flex-shrink-0" />
                      <span>Failure Reason: {c.failureReason}</span>
                    </div>
                  )}

                  {/* Metrics bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-slate-400">Recall@k</p>
                      <p className="font-bold text-white">{c.metrics?.recallAtK}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-slate-400">MRR</p>
                      <p className="font-bold text-white">{c.metrics?.mrr}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-slate-400">Precision</p>
                      <p className="font-bold text-white">{c.metrics?.citationPrecision}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-slate-400">Faithfulness</p>
                      <p className="font-bold text-white">{c.metrics?.faithfulness}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-slate-400">Correctness</p>
                      <p className="font-bold text-white">{c.metrics?.answerCorrectness}</p>
                    </div>
                  </div>

                  {/* Citations Attached */}
                  {c.citations && c.citations.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 text-[11px] font-semibold">Verified Sources:</span>
                      {c.citations.map((cite, ci) => (
                        <span
                          key={ci}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
                        >
                          <FiCheckCircle className="text-[9px]" />
                          {cite.sourceId} ({cite.chunkId})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INDEXED DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Indexed Knowledge Base Documents</h3>
            <span className="text-xs text-slate-400">Total {documents.length} canonical documents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">Source ID</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category / Type</th>
                  <th className="p-3.5">Chunks</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">URL Target</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.sourceId} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{doc.sourceId}</td>
                    <td className="p-3.5 font-medium">{doc.title}</td>
                    <td className="p-3.5">
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-200">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-primary-400">{doc.chunkCount} chunks</td>
                    <td className="p-3.5 font-mono">{doc.version}</td>
                    <td className="p-3.5 font-mono text-slate-400">{doc.url}</td>
                    <td className="p-3.5">
                      <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
