// ─── Afrizend Extended Store ──────────────────────────────────────────────────
// Extends the existing Zustand store with jobs, contracts, and escrow management
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useJobsStore = create()(persist((set, get) => ({
    jobs: [],
    addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs] })),
    updateJob: (id, patch) => set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    })),
    fundEscrow: async (jobId, employerId, freelancerId, amount, paymentCurrency = 'NGN', settlementCurrency = 'NGN') => {
        try {
            const res = await fetch("http://localhost:5000/api/escrow/lock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    job_id: jobId, employer_id: employerId, freelancer_id: freelancerId, agreed_amount: amount,
                    payment_currency: paymentCurrency, settlement_currency: settlementCurrency
                })
            });
            const data = await res.json();
            if (data.success && data.escrowResult?.checkoutUrl) {
                // Open Kora checkout in new tab for testing
                window.open(data.escrowResult.checkoutUrl, "_blank");
            }
            set((s) => ({
                jobs: s.jobs.map((j) => j.id === jobId
                    ? {
                        ...j,
                        escrow: {
                            ...j.escrow,
                            status: "FUNDED",
                            funded: amount || j.escrow.total,
                            koraTxId: data.escrowResult?.transactionId || `kora_${Date.now()}`,
                        },
                    }
                    : j),
            }));
        } catch (e) {
            console.error("Fund Escrow Failed", e);
        }
    },
    hireFreelancer: (jobId, freelancerId, freelancerName) => set((s) => ({
        jobs: s.jobs.map((j) => j.id === jobId
            ? {
                ...j,
                status: "IN_PROGRESS",
                freelancerId,
                freelancerName,
                milestones: j.milestones.map((m, i) => ({
                    ...m,
                    status: (i === 0 ? "IN_PROGRESS" : "LOCKED"),
                })),
            }
            : j),
    })),
    submitMilestone: (jobId, milestoneId, notes, files) => set((s) => ({
        jobs: s.jobs.map((j) => j.id === jobId
            ? {
                ...j,
                milestones: j.milestones.map((m) => m.id === milestoneId
                    ? {
                        ...m,
                        status: "UNDER_REVIEW",
                        submittedAt: new Date().toISOString(),
                        submissionNotes: notes,
                        submittedFiles: files,
                    }
                    : m),
            }
            : j),
    })),
    recordVerdict: (jobId, milestoneId, result) => set((s) => ({
        jobs: s.jobs.map((j) => j.id === jobId
            ? {
                ...j,
                milestones: j.milestones.map((m) => m.id === milestoneId
                    ? {
                        ...m,
                        status: result.verdict === "APPROVED"
                            ? "APPROVED"
                            : result.verdict === "NEEDS_REVISION"
                                ? "NEEDS_REVISION"
                                : "ESCALATED",
                        verificationResult: result,
                    }
                    : m),
            }
            : j),
    })),
    releaseMilestonePayment: async (jobId, milestoneId) => {
        try {
            const job = get().jobs.find(j => j.id === jobId);
            const contractId = job.escrow.koraTxId || "mock_contract";
            const res = await fetch("http://localhost:5000/api/escrow/payout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ milestone_id: milestoneId, contract_id: contractId })
            });
            await res.json();
            
            set((s) => ({
                jobs: s.jobs.map((j) => {
                    if (j.id !== jobId)
                        return j;
                    const milestone = j.milestones.find((m) => m.id === milestoneId);
                    if (!milestone)
                        return j;
                    const newReleased = j.escrow.released + milestone.amount;
                    const allApproved = j.milestones
                        .filter((m) => m.id !== milestoneId)
                        .every((m) => m.status === "APPROVED");
                    // Unlock next milestone
                    let nextUnlocked = false;
                    const newMilestones = j.milestones.map((m) => {
                        if (m.id === milestoneId)
                            return { ...m, paidAt: new Date().toISOString() };
                        if (!nextUnlocked && m.status === "LOCKED") {
                            nextUnlocked = true;
                            return { ...m, status: "IN_PROGRESS" };
                        }
                        return m;
                    });
                    return {
                        ...j,
                        status: allApproved ? "COMPLETED" : j.status,
                        milestones: newMilestones,
                        escrow: {
                            ...j.escrow,
                            released: newReleased,
                            status: newReleased >= j.escrow.total
                                ? "RELEASED"
                                : "PARTIAL_RELEASE",
                        },
                    };
                }),
            }));
        } catch (e) {
            console.error("Release Payout Failed", e);
        }
    },
    unlockDownload: (jobId, files) => set((s) => ({
        jobs: s.jobs.map((j) => j.id === jobId
            ? { ...j, downloadUnlocked: true, finalFiles: files }
            : j),
    })),
    getJobById: (id) => get().jobs.find((j) => j.id === id),
    getEmployerJobs: (employerId) => get().jobs.filter((j) => j.employerId === employerId),
    getFreelancerContracts: (freelancerId) => get().jobs.filter((j) => j.freelancerId === freelancerId),
}), { name: "Afrizend-jobs" }));
