"use client";
import { useNavigate, useParams } from "react-router-dom";
import { useJobsStore } from "@/lib/jobs-store";
import { Lock, CheckCircle, AlertTriangle, Zap, Shield, ArrowLeft, Download, Play, Loader2, Eye, FileText } from "lucide-react";
import { useState } from "react";
function formatCurrency(n) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function StatusBadge({ status }) {
    const map = {
        LOCKED: { bg: "hsl(220 16% 14%)", color: "hsl(220 15% 45%)", label: "Locked" },
        IN_PROGRESS: { bg: "hsl(217 91% 55% / 0.12)", color: "hsl(217 91% 70%)", label: "In Progress" },
        SUBMITTED: { bg: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 65%)", label: "Submitted" },
        UNDER_REVIEW: { bg: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 65%)", label: "Under Review" },
        APPROVED: { bg: "hsl(145 65% 42% / 0.12)", color: "hsl(145 65% 55%)", label: "Approved ✓" },
        NEEDS_REVISION: { bg: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 70%)", label: "Needs Revision" },
        ESCALATED: { bg: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 65%)", label: "Escalated" },
    };
    const style = map[status] || map.LOCKED;
    return (<span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 6, background: style.bg, color: style.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {style.label}
    </span>);
}
export default function ContractPage() {
    const params = useParams();
    const navigate = useNavigate();
    const jobs = useJobsStore((s) => s.jobs);
    const job = jobs.find((j) => j.id === params.id);
    const releasePay = useJobsStore((s) => s.releaseMilestonePayment);
    const unlockDownload = useJobsStore((s) => s.unlockDownload);
    const fundEscrow = useJobsStore((s) => s.fundEscrow);
    const [releasing, setReleasing] = useState(null);
    const [isFunding, setIsFunding] = useState(false);
    const [paymentCurrency, setPaymentCurrency] = useState('NGN');
    const [expandedVerdict, setExpandedVerdict] = useState(null);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([
        { sender: job?.freelancerName || "Freelancer", text: "Hi! Thanks for hiring me. I'm ready to get started. Can we review and lock the escrow budget?" }
    ]);

    function handleSendChat() {
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { sender: "You", text: chatInput.trim() }]);
        setChatInput("");
    }

    if (!job) {
        return (<div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "hsl(220 15% 55%)" }}>Contract not found.</p>
        <button onClick={() => navigate("/dashboard/employer/jobs")} className="btn btn-primary" style={{ marginTop: "1rem" }}>Back to Jobs</button>
      </div>);
    }
    const pct = Math.round((job.escrow.released / job.escrow.total) * 100);
    async function handleRelease(milestoneId, amount) {
        if (!job)
            return;
        setReleasing(milestoneId);
        await releasePay(job.id, milestoneId);
        // Check if all milestones approved → unlock download
        const updatedJob = useJobsStore.getState().jobs.find(j => j.id === job.id);
        const allDone = updatedJob.milestones.filter((m) => m.id !== milestoneId).every((m) => m.status === "APPROVED");
        if (allDone) {
            unlockDownload(job.id, ["final_deliverable.zip", "source_code.zip", "documentation.pdf"]);
        }
        setReleasing(null);
    }
    return (<div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => navigate("/dashboard/employer/jobs")} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: "hsl(220 15% 55%)", cursor: "pointer", fontSize: "0.875rem", marginBottom: "1.25rem", padding: 0 }}>
        <ArrowLeft size={16}/> Back to Jobs
      </button>

      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <h1 className="font-heading" style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>{job.title}</h1>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 6, background: "hsl(217 91% 55% / 0.12)", color: "hsl(217 91% 70%)", textTransform: "uppercase" }}>
            {job.status.replace("_", " ")}
          </span>
        </div>
        <p style={{ color: "hsl(220 15% 55%)", fontSize: "0.875rem" }}>
          Contractor: <strong style={{ color: "white" }}>{job.freelancerName}</strong> · Budget: <strong style={{ color: "white" }}>{formatCurrency(job.budget)}</strong>
        </p>
      </div>

      {/* Escrow Status Bar */}
      <div className="card" style={{ marginBottom: "1.5rem", background: job.escrow.status === "FUNDED" || job.escrow.status === "PARTIAL_RELEASE" ? "hsl(145 65% 42% / 0.05)" : "hsl(220 14% 9%)", border: `1px solid ${job.escrow.status === "FUNDED" || job.escrow.status === "PARTIAL_RELEASE" ? "hsl(145 65% 42% / 0.25)" : "hsl(220 20% 16%)"}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "hsl(145 65% 42% / 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={18} color="hsl(145 65% 55%)"/>
            </div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>Kora Escrow</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(145 65% 50%)" }}>
                {job.escrow.koraTxId ? `TX: ${job.escrow.koraTxId}` : "Pending"}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-heading" style={{ fontSize: "1.2rem", fontWeight: 800, color: "white" }}>{formatCurrency(job.escrow.funded)}</div>
            <div style={{ fontSize: "0.72rem", color: "hsl(220 15% 50%)" }}>locked on Kora network</div>
          </div>
        </div>
        <div style={{ height: 8, background: "hsl(220 20% 16%)", borderRadius: 99, overflow: "hidden", marginBottom: "0.6rem" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, hsl(145 65% 42%), hsl(145 65% 55%))", borderRadius: 99, transition: "width 1s ease" }}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "hsl(220 15% 50%)" }}>
          <span>{formatCurrency(job.escrow.released)} released → freelancer wallet</span>
          <span>{formatCurrency(job.escrow.total - job.escrow.released)} pending ({100 - pct}%)</span>
        </div>
      </div>

      {/* Download lock alert */}
      {!job.downloadUnlocked && job.status !== "COMPLETED" && (<div style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.25)", borderRadius: 10, padding: "0.875rem 1.125rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Lock size={16} color="hsl(38 92% 60%)"/>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(38 92% 65%)" }}>Download Lock Active</div>
            <div style={{ fontSize: "0.78rem", color: "hsl(220 15% 55%)" }}>Final deliverables are locked until all milestone payments are released. This protects the freelancer.</div>
          </div>
        </div>)}

      {/* Download unlocked! */}
      {job.downloadUnlocked && (<div style={{ background: "hsl(145 65% 42% / 0.08)", border: "1px solid hsl(145 65% 42% / 0.3)", borderRadius: 10, padding: "0.875rem 1.125rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <CheckCircle size={18} color="hsl(145 65% 55%)"/>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "hsl(145 65% 55%)" }}>🎉 Download Unlocked — All payments released!</div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {job.finalFiles?.map((file, idx) => (<button id={idx === 0 ? "download-deliverable-btn" : undefined} key={file} className="btn btn-outline btn-sm" style={{ fontSize: "0.78rem", gap: "0.35rem" }}>
                <Download size={13}/> {file}
              </button>))}
          </div>
        </div>)}

      {/* Milestones */}
      <div>
        <h2 className="font-heading" style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "1rem" }}>
          Milestones & Payment Release
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {job.milestones.map((milestone, i) => (<div key={milestone.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: milestone.status === "APPROVED" ? "hsl(145 65% 42%)" : milestone.status === "UNDER_REVIEW" ? "hsl(38 92% 50%)" : milestone.status === "IN_PROGRESS" ? "hsl(217 91% 55%)" : "hsl(220 20% 18%)" }}/>
              <div style={{ paddingLeft: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "hsl(220 15% 45%)", textTransform: "uppercase", letterSpacing: "0.06em" }}>M{i + 1}</span>
                      <StatusBadge status={milestone.status}/>
                    </div>
                    <h3 className="font-heading" style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>{milestone.title}</h3>
                    <p style={{ fontSize: "0.8rem", color: "hsl(220 15% 60%)", marginTop: "0.25rem" }}>{milestone.description}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="font-heading" style={{ fontSize: "1.15rem", fontWeight: 800, color: "white" }}>{formatCurrency(milestone.amount)}</div>
                    {milestone.paidAt && <div style={{ fontSize: "0.7rem", color: "hsl(145 65% 50%)" }}>Paid ✓</div>}
                  </div>
                </div>

                {/* Submission info */}
                {(milestone.status === "UNDER_REVIEW" || milestone.status === "APPROVED" || milestone.status === "NEEDS_REVISION" || milestone.status === "ESCALATED") && milestone.verificationResult && (<div>
                    {/* AI Verdict */}
                    <div style={{
                    background: milestone.verificationResult.verdict === "APPROVED" ? "hsl(145 65% 42% / 0.08)" : milestone.verificationResult.verdict === "NEEDS_REVISION" ? "hsl(0 84% 60% / 0.08)" : "hsl(38 92% 50% / 0.08)",
                    border: `1px solid ${milestone.verificationResult.verdict === "APPROVED" ? "hsl(145 65% 42% / 0.25)" : milestone.verificationResult.verdict === "NEEDS_REVISION" ? "hsl(0 84% 60% / 0.25)" : "hsl(38 92% 50% / 0.25)"}`,
                    borderRadius: 8, padding: "0.875rem", marginBottom: "0.75rem"
                }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Shield size={14} color={milestone.verificationResult.verdict === "APPROVED" ? "hsl(145 65% 55%)" : "hsl(0 84% 65%)"}/>
                          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "hsl(220 15% 75%)" }}>Gemini AI Verdict: <span style={{ color: milestone.verificationResult.verdict === "APPROVED" ? "hsl(145 65% 55%)" : "hsl(0 84% 65%)" }}>{milestone.verificationResult.verdict}</span></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "hsl(220 15% 50%)" }}>Confidence: <strong style={{ color: "white" }}>{milestone.verificationResult.confidence}%</strong></span>
                          <button onClick={() => setExpandedVerdict(expandedVerdict === milestone.id ? null : milestone.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(217 91% 60%)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            <Eye size={13}/> Details
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "hsl(220 15% 65%)", lineHeight: 1.5 }}>{milestone.verificationResult.summary}</p>

                      {expandedVerdict === milestone.id && (<div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid hsl(220 20% 18%)" }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(220 15% 50%)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Criteria Checklist</div>
                          {milestone.verificationResult.checklist?.map((item, ci) => (<div key={ci} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                              {item.passed ? <CheckCircle size={13} color="hsl(145 65% 55%)" style={{ flexShrink: 0, marginTop: 1 }}/> : <AlertTriangle size={13} color="hsl(0 84% 60%)" style={{ flexShrink: 0, marginTop: 1 }}/>}
                              <div>
                                <span style={{ fontSize: "0.78rem", color: item.passed ? "hsl(145 65% 55%)" : "hsl(0 84% 65%)", fontWeight: 600 }}>{item.criterion}: </span>
                                <span style={{ fontSize: "0.78rem", color: "hsl(220 15% 55%)" }}>{item.note}</span>
                              </div>
                            </div>))}
                          {milestone.verificationResult.suggestedRevisions && milestone.verificationResult.suggestedRevisions.length > 0 && (<div style={{ marginTop: "0.5rem" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "hsl(0 84% 65%)", marginBottom: "0.3rem" }}>Suggested Revisions:</div>
                              {milestone.verificationResult.suggestedRevisions.map((r, ri) => (<div key={ri} style={{ fontSize: "0.78rem", color: "hsl(220 15% 60%)", marginBottom: "0.2rem" }}>• {r}</div>))}
                            </div>)}
                        </div>)}
                    </div>

                    {/* Submitted files */}
                    {milestone.submittedFiles && milestone.submittedFiles.length > 0 && (<div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        {milestone.submittedFiles.map((f) => (<span key={f} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "hsl(217 91% 65%)", background: "hsl(217 91% 55% / 0.1)", border: "1px solid hsl(217 91% 55% / 0.2)", padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                            <FileText size={11}/> {f}
                          </span>))}
                      </div>)}

                    {/* Actions */}
                    {milestone.status === "APPROVED" && !milestone.paidAt && (<button id="approve-payout-btn" onClick={() => handleRelease(milestone.id, milestone.amount)} disabled={releasing === milestone.id} className="btn btn-primary btn-sm" style={{ fontWeight: 700, gap: "0.4rem" }}>
                        {releasing === milestone.id
                        ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }}/> Sending via Kora...</>
                        : <><Zap size={14}/> Release {formatCurrency(milestone.amount)} to Freelancer</>}
                      </button>)}
                  </div>)}

                {milestone.status === "IN_PROGRESS" && (<div style={{ fontSize: "0.8rem", color: "hsl(217 91% 60%)", display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <Play size={12} fill="currentColor"/> Awaiting freelancer submission
                  </div>)}
              </div>
            </div>))}
        </div>
      </div>

      {/* Chat & Escrow Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "2rem" }}>
        
        {/* Left Side: Escrow Funding Action */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 className="font-heading" style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>Escrow Funding</h3>
            <p style={{ color: "hsl(220 15% 55%)", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "1rem" }}>
              Pre-authorize and lock project budget into Kora (Kora Protocol) escrow contract. The contractor will see the funds are secured before starting work.
            </p>
            {job.escrow.status === "PENDING" && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: "0.8rem", color: "hsl(220 15% 65%)", display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>Payment Currency (DCC)</label>
                <select 
                  className="input" 
                  value={paymentCurrency} 
                  onChange={(e) => setPaymentCurrency(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", background: "hsl(220 20% 12%)", color: "white", border: "1px solid hsl(220 20% 18%)", borderRadius: 6, fontSize: "0.85rem" }}
                >
                  <option value="NGN">NGN (Local Settlement)</option>
                  <option value="USD">USD (Dynamic Currency Conversion)</option>
                  <option value="EUR">EUR (Dynamic Currency Conversion)</option>
                  <option value="GBP">GBP (Dynamic Currency Conversion)</option>
                </select>
                <p style={{ fontSize: "0.72rem", color: "hsl(217 91% 60%)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Zap size={12} />
                  Freelancer will receive NGN via local settlement.
                </p>
              </div>
            )}
          </div>
          {job.escrow.status === "PENDING" ? (
            <button 
              id="lock-escrow-btn" 
              onClick={async () => {
                setIsFunding(true);
                await fundEscrow(job.id, job.employerId, job.freelancerId, job.escrow.total, paymentCurrency, 'NGN');
                setIsFunding(false);
              }} 
              disabled={isFunding}
              className="btn btn-primary" 
              style={{ width: "100%", gap: "0.5rem" }}
            >
              {isFunding ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }}/> Redirecting to Kora...</> : <><Lock size={16}/> Fund & Lock Escrow</>}
            </button>
          ) : (
            <div style={{ background: "hsl(145 65% 42% / 0.08)", border: "1px solid hsl(145 65% 42% / 0.2)", borderRadius: 8, padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle size={16} color="hsl(145 65% 55%)"/>
              <span style={{ fontSize: "0.85rem", color: "hsl(145 65% 55%)", fontWeight: 600 }}>Escrow Funded on Kora ✓</span>
            </div>
          )}
        </div>

        {/* Right Side: Chat & Collaboration */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 className="font-heading" style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>Encrypted Collaboration</h3>
          
          {/* Chat Messages list */}
          <div style={{ flex: 1, minHeight: 120, background: "hsl(220 20% 6%)", border: "1px solid hsl(220 20% 12%)", borderRadius: 8, padding: "0.75rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.72rem", color: "hsl(220 15% 40%)", textAlign: "center", marginBottom: 4 }}>End-to-End Encrypted Tunnel</div>
            
            {chatMessages.map((msg, index) => (
              <div key={index} style={{ alignSelf: msg.sender === "You" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                <div style={{ 
                  background: msg.sender === "You" ? "hsl(217 91% 55%)" : "hsl(220 20% 12%)", 
                  color: "white", 
                  padding: "0.4rem 0.75rem", 
                  borderRadius: msg.sender === "You" ? "12px 12px 0 12px" : "12px 12px 12px 0", 
                  fontSize: "0.8rem", 
                  lineHeight: 1.4 
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: "0.65rem", color: "hsl(220 15% 45%)", textAlign: msg.sender === "You" ? "right" : "left", marginTop: 2 }}>{msg.sender}</div>
              </div>
            ))}
          </div>

          {/* Chat Form */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              id="chat-input"
              className="input" 
              placeholder="Type your message..." 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              style={{ fontSize: "0.8rem" }}
            />
            <button 
              id="send-msg-btn"
              onClick={handleSendChat} 
              className="btn btn-outline" 
              style={{ flexShrink: 0, fontSize: "0.8rem" }}
            >
              Send
            </button>
          </div>
        </div>

      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>);
}
