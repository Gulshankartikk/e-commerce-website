import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  IconSparkles,
  IconPlay,
  IconRefreshCw,
  IconCheckCircle2,
  IconXCircle,
  IconAlertCircle,
  IconClock,
  IconDollarSign,
  IconBookOpen,
  IconShieldCheck,
  IconSlidersHorizontal,
} from '../../components/ui/icons.jsx';
import api from '../../api/axios.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDate } from '../../utils/format.js';

/** Admin AI RAG & Evals Dashboard styled in clean white & soft mint. */
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
      toast.success(`Loaded run ${runId}`);
    } catch (err) {
      toast.error('Failed to load run details');
    }
  };

  const handleTriggerEval = async () => {
    try {
      setTriggering(true);
      toast('Starting benchmark evaluation...', { icon: '🚀' });
      const { data } = await api.post('/admin/rag/evals/trigger');
      toast.success(`Evaluation complete! Pass rate: ${data.run?.summaryMetrics?.passRate}%`);
      fetchEvals();
    } catch (err) {
      toast.error(err.message || 'Evaluation run failed');
    } finally {
      setTriggering(false);
    }
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      toast('Ingesting and embedding canonical knowledge documents...', { icon: '⚙️' });
      const { data } = await api.post('/admin/rag/reindex');
      toast.success(data.message || 'Knowledge base successfully re-indexed!');
      fetchEvals();
    } catch (err) {
      toast.error(err.message || 'Re-indexing failed');
    } finally {
      setReindexing(false);
    }
  };

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  const latestMetrics = selectedRun?.summaryMetrics || runs[0]?.summaryMetrics || {};
  const isGatePassed = selectedRun ? selectedRun.qualityGatePassed : runs[0]?.qualityGatePassed;

  const kpis = [
    {
      label: 'Quality Gate',
      value: isGatePassed ? 'PASSED' : 'FAILED',
      icon: isGatePassed ? IconCheckCircle2 : IconXCircle,
      bg: isGatePassed ? 'bg-[#EAF4EF]' : 'bg-[#B42318]/10',
      color: isGatePassed ? 'text-[#087F65]' : 'text-[#B42318]',
    },
    {
      label: 'Pass Rate',
      value: `${latestMetrics.passRate ?? 0}%`,
      sub: `${latestMetrics.passedCases ?? 0}/${latestMetrics.totalCases ?? 0} cases`,
      icon: IconSparkles,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
    },
    {
      label: 'Mean Recall@k',
      value: (latestMetrics.meanRecallAtK ?? 0).toFixed(2),
      sub: 'Top-k semantic retrieval',
      icon: IconBookOpen,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
    },
    {
      label: 'Citation Precision',
      value: (latestMetrics.meanCitationPrecision ?? 0).toFixed(2),
      sub: 'Zero hallucinated links',
      icon: IconShieldCheck,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
    },
    {
      label: 'Mean Faithfulness',
      value: (latestMetrics.meanFaithfulness ?? 0).toFixed(2),
      sub: 'Groundedness score',
      icon: IconCheckCircle2,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
    },
    {
      label: 'Abstention Accuracy',
      value: `${((latestMetrics.abstentionAccuracy ?? 0) * 100).toFixed(0)}%`,
      sub: 'Out-of-scope discipline',
      icon: IconShieldCheck,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
    },
    {
      label: 'Avg Latency',
      value: `${latestMetrics.averageLatencyMs ?? 0}ms`,
      sub: 'End-to-end response',
      icon: IconClock,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
    },
    {
      label: 'Total Cost',
      value: `$${(latestMetrics.totalCostUsd ?? 0).toFixed(4)}`,
      sub: `${latestMetrics.totalTokens ?? 0} tokens`,
      icon: IconDollarSign,
      bg: 'bg-[#EAF4EF]',
      color: 'text-[#087F65]',
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
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-[#202923]">
            <IconSparkles size={22} className="text-[#087F65]" />
            <span>AI RAG & Automated Evaluation Dashboard</span>
          </h1>
          <p className="mt-1 text-xs text-[#65716A]">
            Ground-truth dataset evaluations, verified citation audit, latency & faithfulness metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className="btn-outline !py-2 text-xs font-semibold disabled:opacity-50"
          >
            <IconRefreshCw size={15} className={reindexing ? 'animate-spin' : ''} />
            <span>{reindexing ? 'Re-indexing...' : 'Re-index Knowledge'}</span>
          </button>

          <button
            onClick={handleTriggerEval}
            disabled={triggering}
            className="btn-primary !py-2 text-xs font-semibold disabled:opacity-50"
          >
            <IconPlay size={15} className={triggering ? 'animate-pulse' : ''} />
            <span>{triggering ? 'Running Evals...' : 'Run Evaluation Suite'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#E4EAE6] bg-white p-4 shadow-sm flex items-center gap-3.5">
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${k.bg} text-lg ${k.color} border border-[#DDEBE3]`}
            >
              <k.icon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#65716A]">{k.label}</p>
              <p className="text-xl font-extrabold leading-tight text-[#202923] mt-0.5">{k.value}</p>
              {k.sub && <p className="text-[10px] text-[#89938D] mt-0.5">{k.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#E4EAE6] text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#087F65] text-[#087F65] font-bold'
              : 'border-transparent text-[#65716A] hover:text-[#202923]'
          }`}
        >
          Active Run Summary & Historical Runs
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'cases'
              ? 'border-[#087F65] text-[#087F65] font-bold'
              : 'border-transparent text-[#65716A] hover:text-[#202923]'
          }`}
        >
          Test Case Analysis ({selectedRun?.cases?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-5 py-3 border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-[#087F65] text-[#087F65] font-bold'
              : 'border-transparent text-[#65716A] hover:text-[#202923]'
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
            <div className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EAE6] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-[#202923]">{selectedRun.runId}</h2>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        selectedRun.qualityGatePassed
                          ? 'bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]'
                          : 'bg-[#B42318]/10 text-[#B42318] border border-[#B42318]/20'
                      }`}
                    >
                      {selectedRun.qualityGatePassed ? 'Quality Gate Passed' : 'Quality Gate Failed'}
                    </span>
                  </div>
                  <p className="text-xs text-[#65716A] mt-1">
                    Executed on {formatDate(selectedRun.createdAt)} • Dataset {selectedRun.datasetVersion} • Model{' '}
                    <span className="font-mono text-[#087F65] font-bold">{selectedRun.modelName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-[#65716A]">Trigger Type</p>
                  <p className="text-xs font-semibold uppercase text-[#202923]">{selectedRun.triggerType}</p>
                </div>
              </div>

              {/* Quality Thresholds vs Actuals */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
                <div className="rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-3">
                  <p className="text-[#65716A]">Pass Rate</p>
                  <p className="text-base font-bold text-[#202923] mt-1">{selectedRun.summaryMetrics?.passRate}%</p>
                  <p className="text-[10px] text-[#89938D]">Min {selectedRun.qualityThresholds?.minPassRate}%</p>
                </div>
                <div className="rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-3">
                  <p className="text-[#65716A]">Recall@k</p>
                  <p className="text-base font-bold text-[#202923] mt-1">{selectedRun.summaryMetrics?.meanRecallAtK}</p>
                  <p className="text-[10px] text-[#89938D]">Min {selectedRun.qualityThresholds?.minRecallAtK}</p>
                </div>
                <div className="rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-3">
                  <p className="text-[#65716A]">Citation Precision</p>
                  <p className="text-base font-bold text-[#202923] mt-1">{selectedRun.summaryMetrics?.meanCitationPrecision}</p>
                  <p className="text-[10px] text-[#89938D]">Min {selectedRun.qualityThresholds?.minCitationPrecision}</p>
                </div>
                <div className="rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-3">
                  <p className="text-[#65716A]">Faithfulness</p>
                  <p className="text-base font-bold text-[#202923] mt-1">{selectedRun.summaryMetrics?.meanFaithfulness}</p>
                  <p className="text-[10px] text-[#89938D]">Min {selectedRun.qualityThresholds?.minFaithfulness}</p>
                </div>
                <div className="rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-3">
                  <p className="text-[#65716A]">Abstention Accuracy</p>
                  <p className="text-base font-bold text-[#202923] mt-1">
                    {((selectedRun.summaryMetrics?.abstentionAccuracy ?? 0) * 100).toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-[#89938D]">Min {selectedRun.qualityThresholds?.minAbstentionAccuracy * 100}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Historical Runs Table */}
          <div className="rounded-xl border border-[#E4EAE6] bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E4EAE6] flex items-center justify-between bg-[#F1F7F4]/50">
              <h3 className="font-bold text-sm text-[#202923]">Evaluation Runs History</h3>
              <span className="text-xs text-[#65716A]">{runs.length} recorded runs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F7F4] uppercase tracking-wider text-[#65716A] border-b border-[#E4EAE6]">
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
                <tbody className="divide-y divide-[#E4EAE6] text-[#202923]">
                  {runs.map((r) => (
                    <tr
                      key={r.runId}
                      className={`hover:bg-[#F1F7F4] transition-colors ${
                        selectedRun?.runId === r.runId ? 'bg-[#EAF4EF]/50' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-[#202923]">{r.runId}</td>
                      <td className="p-3.5 text-[#65716A]">{formatDate(r.createdAt)}</td>
                      <td className="p-3.5">{r.datasetVersion}</td>
                      <td className="p-3.5 font-mono text-[#087F65]">{r.modelName}</td>
                      <td className="p-3.5 font-bold">
                        <span
                          className={
                            r.summaryMetrics?.passRate >= 80 ? 'text-[#168764]' : 'text-[#B42318]'
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
                              ? 'bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]'
                              : 'bg-[#B42318]/10 text-[#B42318]'
                          }`}
                        >
                          {r.qualityGatePassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleSelectRun(r.runId)}
                          className="btn-outline !py-1 !px-2.5 text-xs font-semibold"
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4EAE6] bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <IconSlidersHorizontal size={15} className="text-[#65716A]" />
              <span className="text-xs font-bold text-[#202923]">Filter cases:</span>
              <div className="flex flex-wrap gap-1">
                {['all', 'passed', 'failed', 'policy', 'specs', 'adversarial', 'unsupported'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setCaseFilter(f)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      caseFilter === f ? 'bg-[#087F65] text-white' : 'bg-[#F1F7F4] text-[#65716A] hover:bg-[#EAF4EF]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-[#65716A]">
              Showing {filteredCases.length} of {selectedRun?.cases?.length || 0} cases
            </span>
          </div>

          <div className="space-y-3">
            {filteredCases.map((c) => (
              <div
                key={c.caseId}
                className={`rounded-xl border border-[#E4EAE6] bg-white p-4 shadow-sm border-l-4 transition-all ${
                  c.passed ? 'border-l-[#168764]' : 'border-l-[#B42318]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4EAE6] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
                        c.passed ? 'bg-[#168764]' : 'bg-[#B42318]'
                      }`}
                    >
                      {c.passed ? '✓' : '✕'}
                    </span>
                    <span className="font-mono font-bold text-sm text-[#202923]">{c.caseId}</span>
                    <span className="rounded-md bg-[#F1F7F4] border border-[#E4EAE6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#65716A]">
                      {c.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#65716A]">
                    <span>Latency: {c.latencyMs}ms</span>
                    <span>Cost: ${c.costUsd?.toFixed(5)}</span>
                    <span
                      className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                        c.passed ? 'bg-[#EAF4EF] text-[#075E4B]' : 'bg-[#B42318]/10 text-[#B42318]'
                      }`}
                    >
                      {c.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-[#65716A]">Question: </span>
                    <span className="text-[#202923] font-semibold">{c.question}</span>
                  </div>

                  <div className="rounded-lg bg-[#F1F7F4] p-3 text-[#202923] border border-[#E4EAE6]">
                    <p className="font-bold text-[#65716A] text-[11px] mb-1">Generated Assistant Reply:</p>
                    <p className="leading-relaxed">{c.actualAnswer}</p>
                  </div>

                  {c.failureReason && (
                    <div className="rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 p-2.5 text-[#B42318] flex items-center gap-2">
                      <IconAlertCircle size={16} className="flex-shrink-0" />
                      <span>Failure Reason: {c.failureReason}</span>
                    </div>
                  )}

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                    <div className="rounded-lg bg-[#F1F7F4] p-2 text-center border border-[#E4EAE6]">
                      <p className="text-[#65716A]">Recall@k</p>
                      <p className="font-bold text-[#202923]">{c.metrics?.recallAtK}</p>
                    </div>
                    <div className="rounded-lg bg-[#F1F7F4] p-2 text-center border border-[#E4EAE6]">
                      <p className="text-[#65716A]">MRR</p>
                      <p className="font-bold text-[#202923]">{c.metrics?.mrr}</p>
                    </div>
                    <div className="rounded-lg bg-[#F1F7F4] p-2 text-center border border-[#E4EAE6]">
                      <p className="text-[#65716A]">Precision</p>
                      <p className="font-bold text-[#202923]">{c.metrics?.citationPrecision}</p>
                    </div>
                    <div className="rounded-lg bg-[#F1F7F4] p-2 text-center border border-[#E4EAE6]">
                      <p className="text-[#65716A]">Faithfulness</p>
                      <p className="font-bold text-[#202923]">{c.metrics?.faithfulness}</p>
                    </div>
                    <div className="rounded-lg bg-[#F1F7F4] p-2 text-center border border-[#E4EAE6]">
                      <p className="text-[#65716A]">Correctness</p>
                      <p className="font-bold text-[#202923]">{c.metrics?.answerCorrectness}</p>
                    </div>
                  </div>

                  {/* Citations Attached */}
                  {c.citations && c.citations.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[#65716A] text-[11px] font-semibold">Verified Sources:</span>
                      {c.citations.map((cite, ci) => (
                        <span
                          key={ci}
                          className="inline-flex items-center gap-1 rounded-md bg-[#EAF4EF] border border-[#DDEBE3] px-2 py-0.5 text-[10px] font-bold text-[#075E4B]"
                        >
                          <IconCheckCircle2 size={11} className="text-[#087F65]" />
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
        <div className="rounded-xl border border-[#E4EAE6] bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E4EAE6] flex items-center justify-between bg-[#F1F7F4]/50">
            <h3 className="font-bold text-sm text-[#202923]">Indexed Knowledge Base Documents</h3>
            <span className="text-xs text-[#65716A]">Total {documents.length} canonical documents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F1F7F4] uppercase tracking-wider text-[#65716A] border-b border-[#E4EAE6]">
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
              <tbody className="divide-y divide-[#E4EAE6] text-[#202923]">
                {documents.map((doc) => (
                  <tr key={doc.sourceId} className="hover:bg-[#F1F7F4] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#202923]">{doc.sourceId}</td>
                    <td className="p-3.5 font-semibold">{doc.title}</td>
                    <td className="p-3.5">
                      <span className="rounded-md bg-[#EAF4EF] border border-[#DDEBE3] px-2 py-0.5 text-[10px] font-bold uppercase text-[#075E4B]">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[#087F65]">{doc.chunkCount} chunks</td>
                    <td className="p-3.5 font-mono">{doc.version}</td>
                    <td className="p-3.5 font-mono text-[#65716A]">{doc.url}</td>
                    <td className="p-3.5">
                      <span className="rounded-full bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3] px-2.5 py-0.5 text-[10px] font-bold">
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
