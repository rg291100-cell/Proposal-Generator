import { useState, useEffect } from 'react';
import { Plus, Save, FileText, CheckCircle2, ChevronRight, Download } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
    const [activeTab, setActiveTab] = useState('clients');
    const [clients, setClients] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const [draftProposal, setDraftProposal] = useState<any>({
        title: '',
        clientName: '',
        proposalDate: '',
        intro: '',
        features: '',
        techStack: '',
        deliverables: '',
        timeline: '',
        changeRequest: '',
        aboutCompany: '',
        projectId: '',
        templateId: '',
        sections: [],
        costItems: []
    });

    const [generatedPdf, setGeneratedPdf] = useState<string | null>(null);

    useEffect(() => {
        // Fetch basic metadata
        fetch(`${API_BASE_URL}/clients`)
            .then(r => r.json())
            .then(d => setClients(d));

        fetch(`${API_BASE_URL}/templates`)
            .then(r => r.json())
            .then(d => setTemplates(d));

        fetch(`${API_BASE_URL}/sections`)
            .then(r => r.json())
            .then(d => setSections(d));
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        const tmpl = templates.find(t => t.id === templateId);
        if (!tmpl) return;

        setDraftProposal({
            ...draftProposal,
            templateId,
            sections: tmpl.sections.map((s: any) => ({
                sectionId: s.sectionId,
                order: s.order,
                enabled: s.isDefault,
                name: s.section.name
            }))
        });
    };

    const toggleSection = (sectionId: string) => {
        setDraftProposal((prev: any) => ({
            ...prev,
            sections: prev.sections.map((s: any) =>
                s.sectionId === sectionId ? { ...s, enabled: !s.enabled } : s
            )
        }));
    };

    const addCostRow = () => {
        setDraftProposal((prev: any) => ({
            ...prev,
            costItems: [...prev.costItems, { description: '', quantity: 1, unitPrice: 0 }]
        }));
    };

    const updateCostRow = (index: number, field: string, value: any) => {
        setDraftProposal((prev: any) => {
            const newItems = [...prev.costItems];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, costItems: newItems };
        });
    };

    const removeCostRow = (index: number) => {
        setDraftProposal((prev: any) => ({
            ...prev,
            costItems: prev.costItems.filter((_: any, i: number) => i !== index)
        }));
    };

    const generateProposal = async () => {
        try {
            // 1. Create Project implicitly for a client (Hack for UI simplicity)
            const projectRes = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: draftProposal.title || 'New Project', clientId: draftProposal.clientId })
            });
            // Assuming a project system exists on BE, otherwise let's mock the projectId or skip Project creation entirely if BE doesn't support generic /api/projects via API controller yet.

            // Let's assume we skip Project creation if API isn't exactly built, but to be compliant we should pass a UUID.
            const payload = {
                title: draftProposal.title || 'Untitled Proposal',
                clientName: draftProposal.clientName,
                proposalDate: draftProposal.proposalDate,
                intro: draftProposal.intro,
                features: draftProposal.features,
                techStack: draftProposal.techStack,
                deliverables: draftProposal.deliverables,
                timeline: draftProposal.timeline,
                changeRequest: draftProposal.changeRequest,
                aboutCompany: draftProposal.aboutCompany,
                projectId: '50690296-e3c8-4da0-91eb-e554e0a5ff94',
                templateId: draftProposal.templateId,
                sections: draftProposal.sections.map((s: any) => ({
                    sectionId: s.sectionId,
                    order: s.order,
                    enabled: s.enabled
                })),
                costItems: draftProposal.costItems.map((c: any) => ({
                    description: c.description,
                    quantity: Number(c.quantity),
                    unitPrice: Number(c.unitPrice)
                }))
            };

            const res = await fetch(`${API_BASE_URL}/proposals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const resultingProposal = await res.json();

            // Generate PDF
            const pdfRes = await fetch(`${API_BASE_URL}/proposals/${resultingProposal.id}/generate`, {
                method: 'POST'
            });
            const finalDoc = await pdfRes.json();

            if (finalDoc.base64Pdf) {
                const linkSource = `data:application/pdf;base64,${finalDoc.base64Pdf}`;
                const downloadLink = document.createElement("a");
                downloadLink.href = linkSource;
                downloadLink.download = `Proposal_${resultingProposal.id}.pdf`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                setGeneratedPdf('Downloaded successfully!');
            } else if (finalDoc.pdfPath) {
                setGeneratedPdf(finalDoc.pdfPath); // local fallback
            }

        } catch (e) {
            console.error(e);
            alert('Failed to generate. Make sure Backend is running and Project UUID is valid.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white p-6 shadow-xl">
                <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
                    <FileText className="text-blue-400" />
                    Acme Admin
                </h1>
                <nav className="space-y-2">
                    {[
                        { id: 'clients', label: 'Clients' },
                        { id: 'create', label: 'Create Proposal' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === t.id ? 'bg-blue-600 font-medium' : 'hover:bg-slate-800 text-slate-300'
                                }`}
                        >
                            <ChevronRight size={16} className={activeTab === t.id ? 'opacity-100' : 'opacity-0'} />
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-10 overflow-y-auto">

                {activeTab === 'clients' && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">Client Directory</h2>
                        <p className="text-slate-500 mb-6">Manage your active clients.</p>
                        <div className="grid gap-4">
                            {clients.length === 0 ? <p className="text-slate-400 italic">No clients found. Seed the database first.</p> : null}
                            {clients.map(c => (
                                <div key={c.id} className="p-4 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-slate-50">
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{c.name}</h3>
                                        <p className="text-sm text-slate-500">{c.company}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <h2 className="text-2xl font-bold mb-2 text-slate-800">Proposal Builder</h2>
                            <p className="text-slate-500 mb-8">Configure your proposal structure and calculate costs.</p>

                            {/* Step 1: Meta */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    Select Template
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {templates.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleTemplateSelect(t.id)}
                                            className={`p-4 border rounded-xl text-left transition-all ${draftProposal.templateId === t.id
                                                ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <h4 className="font-semibold text-slate-800">{t.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1 truncate">{t.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Sections */}
                            {draftProposal.templateId && (
                                <div className="mb-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                        Toggle Sections
                                    </h3>
                                    <div className="space-y-3">
                                        {draftProposal.sections.map((s: any) => (
                                            <div key={s.sectionId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                <span className="font-medium text-slate-700">{s.name}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={s.enabled} onChange={() => toggleSection(s.sectionId)} />
                                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Project Details */}
                            {draftProposal.templateId && (
                                <div className="mb-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                        Project Specifics &amp; Details
                                    </h3>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Proposal Title / Project Name <span className="text-slate-400 font-normal">(Shown on cover page)</span></label>
                                            <input
                                                className="w-full border-slate-200 border rounded-lg p-3 outline-none focus:border-blue-500 text-slate-700"
                                                placeholder="e.g. Grocery App Development 2026"
                                                value={draftProposal.title}
                                                onChange={(e) => setDraftProposal({ ...draftProposal, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Client / Company Name <span className="text-slate-400 font-normal">(Cover &amp; sign-off)</span></label>
                                                <input
                                                    className="w-full border-slate-200 border rounded-lg p-3 outline-none focus:border-blue-500 text-slate-700"
                                                    placeholder="e.g. Indgrocart Pvt. Ltd."
                                                    value={draftProposal.clientName}
                                                    onChange={(e) => setDraftProposal({ ...draftProposal, clientName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Proposal Date <span className="text-slate-400 font-normal">(Defaults to today)</span></label>
                                                <input
                                                    type="date"
                                                    className="w-full border-slate-200 border rounded-lg p-3 outline-none focus:border-blue-500 text-slate-700"
                                                    value={draftProposal.proposalDate}
                                                    onChange={(e) => {
                                                        const d = new Date(e.target.value);
                                                        const formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                                        setDraftProposal({ ...draftProposal, proposalDate: formatted });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Introduction <span className="text-slate-400 font-normal">(Markdown supported)</span></label>
                                            <textarea
                                                className="w-full border-slate-200 border rounded-lg p-4 min-h-[6rem] outline-none focus:border-blue-500 text-slate-700 resize-y"
                                                placeholder="Project background, goal, or introduction..."
                                                value={draftProposal.intro}
                                                onChange={(e) => setDraftProposal({ ...draftProposal, intro: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Features &amp; Functionalities <span className="text-slate-400 font-normal">(Markdown supported)</span></label>
                                            <textarea
                                                className="w-full border-slate-200 border rounded-lg p-4 min-h-[12rem] outline-none focus:border-blue-500 text-slate-700 resize-y"
                                                placeholder="Type or paste the comprehensive features list here..."
                                                value={draftProposal.features}
                                                onChange={(e) => setDraftProposal({ ...draftProposal, features: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack <span className="text-slate-400 font-normal">(Markdown)</span></label>
                                                <textarea
                                                    className="w-full border-slate-200 border rounded-lg p-4 min-h-[8rem] outline-none focus:border-blue-500 text-slate-700 resize-y"
                                                    placeholder="- React Native&#10;- Node.js"
                                                    value={draftProposal.techStack}
                                                    onChange={(e) => setDraftProposal({ ...draftProposal, techStack: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Deliverables <span className="text-slate-400 font-normal">(Markdown)</span></label>
                                                <textarea
                                                    className="w-full border-slate-200 border rounded-lg p-4 min-h-[8rem] outline-none focus:border-blue-500 text-slate-700 resize-y"
                                                    placeholder="- Source Code&#10;- Figma Designs"
                                                    value={draftProposal.deliverables}
                                                    onChange={(e) => setDraftProposal({ ...draftProposal, deliverables: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Timeline <span className="text-slate-400 font-normal">(Markdown)</span></label>
                                                <textarea
                                                    className="w-full border-slate-200 border rounded-lg p-4 min-h-[6rem] outline-none focus:border-blue-500 text-slate-700 resize-y"
                                                    placeholder="Week 1: Design&#10;Week 2: Backend..."
                                                    value={draftProposal.timeline}
                                                    onChange={(e) => setDraftProposal({ ...draftProposal, timeline: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Change Request Mgmt <span className="text-slate-400 font-normal">(Markdown)</span></label>
                                                <textarea
                                                    className="w-full border-slate-200 border rounded-lg p-4 min-h-[6rem] outline-none focus:border-blue-500 text-slate-700 resize-y"
                                                    placeholder="Any changes outside the initial scope..."
                                                    value={draftProposal.changeRequest}
                                                    onChange={(e) => setDraftProposal({ ...draftProposal, changeRequest: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Costing */}
                            {draftProposal.templateId && (
                                <div className="mb-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                            <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                                            Costing Table
                                        </h3>
                                        <button onClick={addCostRow} className="flex items-center gap-1 text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
                                            <Plus size={16} /> Add Row
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                                        <table className="w-full text-sm text-left align-middle text-slate-700">
                                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3 w-24">Qty</th>
                                                    <th className="px-4 py-3 w-32">Unit Price (₹)</th>
                                                    <th className="px-4 py-3 w-32">Total (₹)</th>
                                                    <th className="px-4 py-3 w-16"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {draftProposal.costItems.map((item: any, i: number) => (
                                                    <tr key={i} className="border-b border-slate-100 last:border-0">
                                                        <td className="px-4 py-2">
                                                            <input type="text" className="w-full border-slate-200 border rounded-md px-3 py-2 outline-none focus:border-blue-500" value={item.description} onChange={e => updateCostRow(i, 'description', e.target.value)} placeholder="e.g. Frontend Development" />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="number" className="w-full border-slate-200 border rounded-md px-3 py-2 outline-none focus:border-blue-500" value={item.quantity} onChange={e => updateCostRow(i, 'quantity', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input type="number" className="w-full border-slate-200 border rounded-md px-3 py-2 outline-none focus:border-blue-500" value={item.unitPrice} onChange={e => updateCostRow(i, 'unitPrice', e.target.value)} />
                                                        </td>
                                                        <td className="px-4 py-2 font-medium text-slate-800">
                                                            ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <button onClick={() => removeCostRow(i)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1">&times;</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {draftProposal.costItems.length === 0 && (
                                                    <tr><td colSpan={5} className="text-center py-6 text-slate-400">No cost items added.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Preview */}
                            {draftProposal.templateId && (
                                <div className="mb-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
                                        Preview Payload (JSON)
                                    </h3>
                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                                        <pre className="text-sm text-green-400 font-mono">
                                            {JSON.stringify(draftProposal, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Generate Action */}
                            {draftProposal.templateId && (
                                <div className="pt-6 border-t border-slate-200 mt-8 flex justify-end gap-4">
                                    <button onClick={generateProposal} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm">
                                        <Save size={18} /> Generate PDF Proposal
                                    </button>
                                </div>
                            )}

                            {generatedPdf && (
                                <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-green-800">
                                        <CheckCircle2 className="text-green-600" />
                                        <div>
                                            <p className="font-semibold">Successfully Generated!</p>
                                            <p className="text-sm opacity-80">{generatedPdf}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
