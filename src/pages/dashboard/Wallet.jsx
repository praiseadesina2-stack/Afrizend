"use client";
import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { DEMO_TRANSACTIONS, EARNINGS_DATA } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownRight, Zap, Shield, CheckCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function WalletPage() {
    const user = useAuthStore((s) => s.user);
    const fundWallet = useAuthStore((s) => s.fundWallet);
    const withdrawWallet = useAuthStore((s) => s.withdrawWallet);
    const issueVirtualWallet = useAuthStore((s) => s.issueVirtualWallet);
    const [filter, setFilter] = useState("ALL");
    const [fundingLoading, setFundingLoading] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [issuingAccount, setIssuingAccount] = useState(false);
    const isFreelancer = user?.role === "freelancer";

    const handleFund = async () => {
        const amount = prompt("Enter amount to deposit via Kora multi-currency links ($):");
        if (amount && !isNaN(amount)) {
            setFundingLoading(true);
            try {
                await fundWallet(Number(amount));
                alert(`Successfully deposited $${amount} via Kora Multi-Currency Gateway!`);
            } catch (err) { alert(err.message); }
            finally { setFundingLoading(false); }
        }
    };

    const handleWithdraw = async () => {
        const amount = prompt("Enter amount to withdraw to your local African bank/mobile account ($):");
        if (amount && !isNaN(amount)) {
            setWithdrawLoading(true);
            try {
                await withdrawWallet(Number(amount));
                alert(`Successfully withdrew $${amount} via Kora Payout & Settlement!`);
            } catch (err) { alert(err.message); }
            finally { setWithdrawLoading(false); }
        }
    };

    return (<div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 className="font-heading" style={{ fontSize: "1.5rem", fontWeight: 800, color: "white" }}>Kora Wallet</h1>
          <p style={{ color: "hsl(220 15% 55%)", fontSize: "0.875rem", marginTop: 4 }}>Manage your multi-currency balances and local settlements</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Main Balance Card */}
          <div className="card" style={{
            background: "linear-gradient(135deg, hsl(217 91% 55% / 0.15), hsl(200 100% 60% / 0.05))",
            border: "1px solid hsl(217 91% 55% / 0.3)",
            position: "relative",
            overflow: "hidden"
        }}>
            <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.1, pointerEvents: "none" }}/>
            
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Wallet size={16} color="hsl(217 91% 70%)"/>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "hsl(220 15% 75%)" }}>Available Balance (USD)</span>
                </div>
                <div className="font-heading" style={{ fontSize: "3rem", fontWeight: 800, color: "white", letterSpacing: "-0.04em", lineHeight: 1 }}>
                  {formatCurrency(user?.balance || 0)}
                </div>
                <div style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "hsl(220 20% 12%)", padding: "0.3rem 0.75rem", borderRadius: 99 }}>
                  <Zap size={14} color="hsl(200 100% 60%)"/>
                  <span style={{ fontSize: "0.75rem", color: "hsl(220 15% 65%)", fontFamily: "monospace" }}>
                    {user?.walletAddress || "@kora.afrizend.dev/user"}
                  </span>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button className="btn btn-primary" onClick={isFreelancer ? handleWithdraw : handleFund} disabled={fundingLoading || withdrawLoading} style={{ minWidth: 120 }}>
                  {isFreelancer ? (withdrawLoading ? "Withdrawing..." : "Withdraw") : (fundingLoading ? "Depositing..." : "Deposit")}
                </button>
                <button className="btn btn-ghost" onClick={() => alert("Kora Live virtual accounts securely managed by Afrizend. Standard API Mode.")} style={{ minWidth: 120 }}>View Keys</button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 className="font-heading" style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>
                {isFreelancer ? "Earnings Overview" : "Spend Overview"}
              </h2>
              <select className="input" style={{ width: "auto", padding: "0.3rem 0.75rem", fontSize: "0.8rem", background: "transparent" }}>
                <option>Last 6 Months</option>
                <option>This Year</option>
              </select>
            </div>
            
            <div style={{ height: 240, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EARNINGS_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217 91% 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(217 91% 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220 20% 16%)"/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(220 15% 55%)", fontSize: 12 }} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(220 15% 55%)", fontSize: 12 }} dx={-10} tickFormatter={(val) => `$${val}`}/>
                  <Tooltip contentStyle={{ background: "hsl(220 14% 10%)", border: "1px solid hsl(220 20% 16%)", borderRadius: 8 }} itemStyle={{ color: "white", fontWeight: 600 }}/>
                  <Area type="monotone" dataKey="earnings" stroke="hsl(217 91% 55%)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 className="font-heading" style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>Recent Transactions</h2>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column" }}>
              {DEMO_TRANSACTIONS.map((tx, i) => {
            const isIncoming = tx.type === "DEPOSIT";
            return (<div key={tx.id} style={{
                    display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0",
                    borderBottom: i < DEMO_TRANSACTIONS.length - 1 ? "1px solid hsl(220 20% 14%)" : "none"
                }}>
                    <div style={{
                    width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: isIncoming ? "hsl(145 65% 42% / 0.15)" : "hsl(220 20% 16%)",
                }}>
                      {isIncoming ? <ArrowDownRight size={18} color="hsl(145 65% 50%)"/> : <ArrowUpRight size={18} color="hsl(220 15% 65%)"/>}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "white", marginBottom: "0.2rem" }}>
                        {tx.description}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "hsl(220 15% 55%)" }}>
                        {isIncoming ? `From ${tx.from}` : `To ${tx.to}`} • {formatDate(tx.date)}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "right" }}>
                      <div className="font-heading" style={{ fontSize: "1rem", fontWeight: 700, color: isIncoming ? "hsl(145 65% 50%)" : "white" }}>
                        {isIncoming ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "hsl(217 91% 65%)" }}>{tx.txHash.slice(0, 12)}</span>
                    </div>
                  </div>);
        })}
            </div>
          </div>
          
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Kora Info */}
          <div className="card" style={{ background: "hsl(220 20% 10%)" }}>
            <h3 className="font-heading" style={{ fontSize: "1rem", color: "white", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={16} color="hsl(200 100% 65%)"/> Network Security
            </h3>
            <p style={{ fontSize: "0.8rem", color: "hsl(220 15% 65%)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Your funds are secured on the Kora network. Afrizend does not custody your funds outside of active Kora Escrow contracts.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderTop: "1px solid hsl(220 20% 16%)" }}>
              <span style={{ fontSize: "0.75rem", color: "hsl(220 15% 55%)" }}>Node Status</span>
              <span style={{ fontSize: "0.75rem", color: "hsl(145 65% 50%)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}><CheckCircle size={12}/> Connected</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderTop: "1px solid hsl(220 20% 16%)" }}>
              <span style={{ fontSize: "0.75rem", color: "hsl(220 15% 55%)" }}>Settlement Speed</span>
              <span style={{ fontSize: "0.75rem", color: "white", fontWeight: 600 }}>Instant</span>
            </div>
          </div>

          <div className="card">
            <h3 className="font-heading" style={{ fontSize: "1rem", color: "white", marginBottom: "0.75rem" }}>Linked Bank Accounts</h3>
            {user?.virtual_account_number ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "hsl(220 16% 12%)", borderRadius: 8, border: "1px solid hsl(220 20% 16%)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "black", fontWeight: 800, fontSize: "0.9rem" }}>K</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "white" }}>{user.virtual_bank_name || "Kora Bank NGN Account"}</div>
                  <div style={{ fontSize: "0.7rem", color: "hsl(220 15% 55%)" }}>{user.virtual_account_number}</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>Manage</button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem", background: "hsl(220 16% 12%)", borderRadius: 8, border: "1px dashed hsl(220 20% 25%)" }}>
                <p style={{ fontSize: "0.8rem", color: "hsl(220 15% 65%)", marginBottom: "0.75rem" }}>No local bank account linked.</p>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={async () => {
                    setIssuingAccount(true);
                    try {
                      await issueVirtualWallet();
                      alert("Virtual Bank Account Successfully Issued!");
                    } catch (err) {
                      alert(err.message);
                    } finally {
                      setIssuingAccount(false);
                    }
                  }} 
                  disabled={issuingAccount}
                  style={{ width: "100%", fontSize: "0.8rem" }}
                >
                  {issuingAccount ? "Issuing..." : "Issue Local Virtual Bank Account"}
                </button>
              </div>
            )}
            <button className="btn btn-outline" style={{ width: "100%", marginTop: "0.75rem" }}>
              + Link External Bank
            </button>
          </div>
        </div>
      </div>
    </div>);
}
