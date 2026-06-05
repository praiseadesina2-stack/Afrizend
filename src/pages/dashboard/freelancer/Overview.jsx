"use client";
import { useAuthStore } from "@/lib/store";
import { DEMO_JOBS, DEMO_TRANSACTIONS } from "@/lib/data";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Zap, FileText, Clock, CheckCircle, ArrowRight, DollarSign, Star, Cpu, Globe, Briefcase } from "lucide-react";
export default function FreelancerDashboard() {
    const user = useAuthStore((s) => s.user);
    const activeJobs = DEMO_JOBS.filter(j => j.status === "IN_PROGRESS");
    const completedJobs = DEMO_JOBS.filter(j => j.status === "COMPLETED");
    const stats = [
        { label: "Total Earned", value: formatCurrency(user?.balance || 0), sub: "Kora Balance", icon: DollarSign, color: "green" },
        { label: "Active Contracts", value: "0", sub: "0 milestone pending", icon: FileText, color: "blue" },
        { label: "TrustScore", value: `${user?.trustScore || 75} / 100`, sub: "New Account", icon: Star, color: "cyan" },
        { label: "Avg. Pay Time", value: "8 sec", sub: "Post-approval", icon: Zap, color: "blue" },
    ];
    return (<div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <div className="status-dot online"/>
            <span style={{ fontSize: "0.78rem", color: "hsl(145 65% 45%)", fontWeight: 600 }}>Kora Network Connected</span>
          </div>
          <h1 className="font-heading" style={{ fontSize: "1.75rem", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            Good afternoon, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "hsl(220 15% 55%)", fontSize: "0.875rem", marginTop: 4 }}>
            Platform Wallet: <code style={{ color: "hsl(200 100% 65%)", fontSize: "0.8rem" }}>{user?.walletAddress}</code>
          </p>
        </div>
        
        {/* Virtual Bank Account Widget */}
        <div className="card" style={{ padding: "1rem", minWidth: 280, background: "hsl(145 65% 42% / 0.05)", border: "1px solid hsl(145 65% 42% / 0.25)" }}>
          <div style={{ fontSize: "0.8rem", color: "hsl(220 15% 65%)", marginBottom: "0.5rem" }}>Local Virtual Account (NGN)</div>
          {user?.virtual_account_number ? (
            <div>
              <div className="font-heading" style={{ fontSize: "1.3rem", fontWeight: 700, color: "white" }}>{user.virtual_account_number}</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(145 65% 50%)" }}>{user.virtual_bank_name}</div>
              <div style={{ fontSize: "0.7rem", color: "hsl(220 15% 50%)", marginTop: "0.25rem" }}>Ref: {user.virtual_account_reference}</div>
            </div>
          ) : (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={async (e) => {
                const btn = e.currentTarget;
                const orig = btn.innerText;
                btn.innerText = "Issuing...";
                btn.disabled = true;
                try {
                  await useAuthStore.getState().issueVirtualWallet();
                } catch(err) {
                  alert("Failed: " + err.message);
                } finally {
                  btn.innerText = orig;
                  btn.disabled = false;
                }
              }}
              style={{ width: "100%" }}
            >
              Issue Virtual Account
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {stats.map(({ label, value, sub, icon: Icon, color }) => (<div key={label} className="card metric-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", color: "hsl(220 15% 55%)", fontWeight: 600 }}>{label}</span>
              <div style={{
                width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                background: color === "green" ? "hsl(145 65% 42% / 0.15)" : color === "cyan" ? "hsl(200 100% 60% / 0.12)" : "hsl(217 91% 55% / 0.15)",
              }}>
                <Icon size={16} color={color === "green" ? "hsl(145 65% 50%)" : color === "cyan" ? "hsl(200 100% 65%)" : "hsl(217 91% 70%)"}/>
              </div>
            </div>
            <div>
              <div className="font-heading" style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: color === "green" ? "hsl(145 65% 50%)" : "hsl(220 15% 50%)", marginTop: 2 }}>{sub}</div>
            </div>
          </div>))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "start" }}>
        {/* Active Contracts */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 className="font-heading" style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>Active Contracts</h2>
            <Link to="/dashboard/freelancer/contracts" className="btn btn-ghost btn-sm" style={{ fontSize: "0.78rem" }}>View all <ArrowRight size={13}/></Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {activeJobs.map(job => (<div key={job.id} className="card card-hover" style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <div className="font-heading" style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", marginBottom: "0.2rem" }}>{job.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "hsl(220 15% 55%)" }}>{job.employerName}</div>
                  </div>
                  <span className="badge badge-blue">{job.status.replace("_", " ")}</span>
                </div>

                {/* Milestones */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.875rem" }}>
                  {job.milestones.map(m => (<div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: m.status === "APPROVED" ? "hsl(145 65% 42% / 0.2)" : m.status === "IN_PROGRESS" ? "hsl(217 91% 55% / 0.2)" : "hsl(220 20% 16%)" }}>
                        {m.status === "APPROVED" ? <CheckCircle size={10} color="hsl(145 65% 50%)"/> :
                    m.status === "IN_PROGRESS" ? <Clock size={10} color="hsl(217 91% 65%)"/> :
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "hsl(220 15% 40%)" }}/>}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: m.status === "APPROVED" ? "hsl(145 65% 55%)" : m.status === "IN_PROGRESS" ? "white" : "hsl(220 15% 45%)", flex: 1 }}>{m.title}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: m.status === "APPROVED" ? "hsl(145 65% 50%)" : "hsl(220 15% 55%)" }}>{formatCurrency(m.amount)}</span>
                    </div>))}
                </div>

                {/* Escrow bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "hsl(220 15% 50%)" }}>Escrow Funded</span>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "hsl(145 65% 50%)" }}>{formatCurrency(job.escrow.funded)} / {formatCurrency(job.escrow.total)}</span>
                  </div>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${(job.escrow.funded / job.escrow.total) * 100}%` }}/>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.875rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "hsl(220 15% 45%)" }}>Deadline: {formatDate(job.deadline)}</span>
                  <Link to="/dashboard/freelancer/contracts" className="btn btn-primary btn-sm">Submit Work</Link>
                </div>
              </div>))}
            {activeJobs.length === 0 && (<div className="card" style={{ textAlign: "center", padding: "2rem" }}>
                <Briefcase size={32} color="hsl(220 15% 35%)" style={{ margin: "0 auto 0.75rem" }}/>
                <p style={{ color: "hsl(220 15% 45%)", fontSize: "0.875rem" }}>No active contracts yet</p>
                <Link to="/dashboard/freelancer/opportunities" className="btn btn-primary btn-sm" style={{ marginTop: "0.75rem", display: "inline-flex" }}>Browse Jobs</Link>
              </div>)}
          </div>

          {/* AI Match Banner */}
          <div style={{ marginTop: "1.25rem", background: "linear-gradient(135deg, hsl(217 91% 55% / 0.12), hsl(200 100% 60% / 0.06))", border: "1px solid hsl(217 91% 55% / 0.2)", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "hsl(217 91% 55% / 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Cpu size={18} color="hsl(217 91% 70%)"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "white" }}>3 new AI-matched jobs</div>
              <div style={{ fontSize: "0.78rem", color: "hsl(220 15% 55%)" }}>Based on your skills and delivery history. 94%+ match scores.</div>
            </div>
            <Link to="/dashboard/freelancer/opportunities" className="btn btn-primary btn-sm">View Matches <ArrowRight size={13}/></Link>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Recent payments */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
              <h2 className="font-heading" style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>Recent Payments</h2>
              <Link to="/dashboard/wallet" className="btn btn-ghost btn-sm" style={{ fontSize: "0.78rem" }}>See all</Link>
            </div>
            <div className="card" style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0" }}>
              {DEMO_TRANSACTIONS.slice(0, 3).map((tx, i) => (<div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.5rem", borderBottom: i < 2 ? "1px solid hsl(220 20% 12%)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "hsl(145 65% 42% / 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={14} color="hsl(145 65% 50%)"/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: "0.72rem", color: "hsl(220 15% 50%)" }}>{formatRelativeTime(tx.date)}</div>
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "hsl(145 65% 50%)" }}>+{formatCurrency(tx.amount)}</div>
                </div>))}
            </div>
          </div>

          {/* Kora Stats */}
          <div className="card" style={{ background: "hsl(200 100% 60% / 0.05)", borderColor: "hsl(200 100% 60% / 0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Globe size={15} color="hsl(200 100% 65%)"/>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "hsl(200 100% 65%)" }}>Kora Payment Stats</span>
            </div>
            {[
            { label: "Avg. Settlement", value: "8s" },
            { label: "FX Spread", value: "0.48%" },
            { label: "Savings vs Legacy", value: "82%" },
            { label: "Countries Active", value: "23" },
        ].map(({ label, value }) => (<div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid hsl(220 20% 12%)" }}>
                <span style={{ fontSize: "0.78rem", color: "hsl(220 15% 50%)" }}>{label}</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "white" }}>{value}</span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
