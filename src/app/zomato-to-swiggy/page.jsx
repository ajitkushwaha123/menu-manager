"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Store,
  Phone,
  Tag,
  User,
  MessageSquare,
} from "lucide-react";

function parsePriceValue(raw) {
  const str = raw.trim();
  const pctMatch = str.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (pctMatch) return { type: "percent", value: parseFloat(pctMatch[1]) };
  const flatMatch = str.match(/^(-?\d+(?:\.\d+)?)$/);
  if (flatMatch) return { type: "flat", value: parseFloat(flatMatch[1]) };
  return null;
}

const ACCESS_NUMBER = "9311507651";

export default function ZomatoToSwiggyPage() {
  const [form, setForm] = useState({
    zomatoResId: "",
    zomatoResName: "",
    swiggyResId: "",
    swiggyResName: "",
    zomatoAccess: null,
    swiggyAccess: null,
    price: "",
    submittedBy: "",
    remarks: "",
  });
  const [priceError, setPriceError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "price") setPriceError("");
  };

  const handlePriceBlur = () => {
    if (form.price && !parsePriceValue(form.price)) {
      setPriceError("Invalid format. Use: 40 | -40 | 40% | -40%");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.zomatoResName.trim()) return toast.error("Zomato Res Name is required");
    if (!form.zomatoResId.trim()) return toast.error("Zomato Res ID is required");
    if (!form.swiggyResName.trim()) return toast.error("Swiggy Res Name is required");
    if (!form.swiggyResId.trim()) return toast.error("Swiggy Res ID is required");
    if (form.zomatoAccess === null) return toast.error("Select Zomato access status");
    if (form.swiggyAccess === null) return toast.error("Select Swiggy access status");
    if (!form.price.trim()) return toast.error("Price value is required");
    if (!form.submittedBy.trim()) return toast.error("Submitted By name is required");
    const parsed = parsePriceValue(form.price);
    if (!parsed) { setPriceError("Invalid format. Use: 40 | -40 | 40% | -40%"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/zomato-to-swiggy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zomatoResId: form.zomatoResId.trim(),
          zomatoResName: form.zomatoResName.trim(),
          swiggyResId: form.swiggyResId.trim(),
          swiggyResName: form.swiggyResName.trim(),
          zomatoAccess: form.zomatoAccess,
          swiggyAccess: form.swiggyAccess,
          priceHandling: parsed,
          priceRaw: form.price.trim(),
          submittedBy: form.submittedBy.trim(),
          remarks: form.remarks.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) { toast.success("Request submitted!"); setSubmitted(true); }
      else toast.error(data.message || "Something went wrong");
    } catch { toast.error("Failed to submit. Try again."); }
    finally { setSubmitting(false); }
  };

  const handleReset = () => {
    setForm({ zomatoResId: "", zomatoResName: "", swiggyResId: "", swiggyResName: "", zomatoAccess: null, swiggyAccess: null, price: "", submittedBy: "", remarks: "" });
    setPriceError(""); setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-emerald-100 blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-100 blur-3xl opacity-60" />

        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-12 max-w-md w-full text-center shadow-xl relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted!</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Your Zomato to Swiggy migration request has been queued. Our team will process it shortly.
          </p>
          <button onClick={handleReset} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:shadow-lg hover:opacity-95 transition-all">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  const pricePreview = form.price ? parsePriceValue(form.price) : null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-orange-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-50/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl z-10">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-white/60 border border-slate-200/60 rounded-full px-5 py-2 text-sm text-slate-600 backdrop-blur-md shadow-sm">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="font-medium">Menu Migration Tool</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#e23744" }}>Zomato</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-slate-400" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#fc8019" }}>Swiggy</span>
            </div>
          </div>
          <p className="text-slate-500 text-sm md:text-base">Fill in the details below to queue a menu migration</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-2xl border border-slate-200/60 rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">

          {/* Restaurant Details */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-orange-100 rounded-lg"><Store className="w-4 h-4 text-orange-600" /></div>
              <h3 className="text-slate-800 font-semibold text-sm uppercase tracking-widest">Restaurant Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="space-y-1.5">
                <label htmlFor="zomatoResName" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zomato Res Name <span className="text-red-500">*</span></label>
                <input id="zomatoResName" type="text" value={form.zomatoResName}
                  onChange={(e) => handleChange("zomatoResName", e.target.value)}
                  placeholder="e.g. Burger King"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="zomatoResId" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zomato Res ID <span className="text-red-500">*</span></label>
                <input id="zomatoResId" type="text" value={form.zomatoResId}
                  onChange={(e) => handleChange("zomatoResId", e.target.value)}
                  placeholder="e.g. 12345"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-400/10 transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="swiggyResName" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Swiggy Res Name <span className="text-red-500">*</span></label>
                <input id="swiggyResName" type="text" value={form.swiggyResName}
                  onChange={(e) => handleChange("swiggyResName", e.target.value)}
                  placeholder="e.g. Burger King"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="swiggyResId" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Swiggy Res ID <span className="text-red-500">*</span></label>
                <input id="swiggyResId" type="text" value={form.swiggyResId}
                  onChange={(e) => handleChange("swiggyResId", e.target.value)}
                  placeholder="e.g. 67890"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 transition-all" />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Platform Access */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg"><Phone className="w-4 h-4 text-indigo-600" /></div>
              <h3 className="text-slate-800 font-semibold text-sm uppercase tracking-widest">Platform Access</h3>
            </div>
            <p className="text-slate-500 text-xs mb-5 ml-9">
              Is access granted on{" "}
              <span className="text-slate-700 font-mono font-medium bg-slate-100 px-2 py-0.5 rounded-md">{ACCESS_NUMBER}</span>?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zomato Access</label>
                <div className="flex gap-2">
                  <button id="zomato-access-yes" type="button" onClick={() => handleChange("zomatoAccess", true)}
                    className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm " +
                      (form.zomatoAccess === true ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-4 ring-emerald-500/10" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                    <CheckCircle2 className="w-4 h-4" /> Yes
                  </button>
                  <button id="zomato-access-no" type="button" onClick={() => handleChange("zomatoAccess", false)}
                    className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm " +
                      (form.zomatoAccess === false ? "bg-red-50 border-red-300 text-red-700 ring-4 ring-red-500/10" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                    <XCircle className="w-4 h-4" /> No
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Swiggy Access</label>
                <div className="flex gap-2">
                  <button id="swiggy-access-yes" type="button" onClick={() => handleChange("swiggyAccess", true)}
                    className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm " +
                      (form.swiggyAccess === true ? "bg-emerald-50 border-emerald-300 text-emerald-700 ring-4 ring-emerald-500/10" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                    <CheckCircle2 className="w-4 h-4" /> Yes
                  </button>
                  <button id="swiggy-access-no" type="button" onClick={() => handleChange("swiggyAccess", false)}
                    className={"flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm " +
                      (form.swiggyAccess === false ? "bg-red-50 border-red-300 text-red-700 ring-4 ring-red-500/10" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50")}>
                    <XCircle className="w-4 h-4" /> No
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Price Handling */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-emerald-100 rounded-lg"><Tag className="w-4 h-4 text-emerald-600" /></div>
              <h3 className="text-slate-800 font-semibold text-sm uppercase tracking-widest">Price Handling</h3>
            </div>
            <p className="text-slate-500 text-xs mb-5 ml-9">
              Strict modifier —{" "}
              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1 py-0.5 rounded">40</span>,{" "}
              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1 py-0.5 rounded">-40</span>,{" "}
              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1 py-0.5 rounded">40%</span>,{" "}
              <span className="font-mono font-medium text-slate-700 bg-slate-100 px-1 py-0.5 rounded">-40%</span>
            </p>
            <div className="space-y-2">
              <div className="relative">
                <input id="price-field" type="text" value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  onBlur={handlePriceBlur}
                  placeholder="e.g. -40%"
                  className={"w-full bg-white border rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 text-sm font-mono shadow-sm focus:outline-none transition-all " +
                    (priceError ? "border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-400/10" : "border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10") +
                    (pricePreview ? " pr-44" : "")} />
                {pricePreview && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5 pointer-events-none">
                    <span className={"px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider " +
                      (pricePreview.value < 0 ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200")}>
                      {pricePreview.value < 0 ? "Decrease" : "Increase"}
                    </span>
                    <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {pricePreview.type === "percent" ? "Percent" : "Flat ₹"}
                    </span>
                  </div>
                )}
              </div>
              {priceError && <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3"/>{priceError}</p>}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {["-40%", "-20%", "0", "20%", "40%"].map((chip) => (
                <button key={chip} type="button"
                  onClick={() => { handleChange("price", chip); setPriceError(""); }}
                  className="px-4 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-sm">
                  {chip}
                </button>
              ))}
            </div>
          </section>

          <div className="border-t border-slate-100" />

          {/* Submitter Details & Remarks */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg"><User className="w-4 h-4 text-blue-600" /></div>
              <h3 className="text-slate-800 font-semibold text-sm uppercase tracking-widest">Additional Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="submittedBy" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Name <span className="text-red-500">*</span></label>
                <input id="submittedBy" type="text" value={form.submittedBy}
                  onChange={(e) => handleChange("submittedBy", e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="remarks" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remarks <span className="text-slate-400 normal-case font-normal">(Optional)</span></label>
                <input id="remarks" type="text" value={form.remarks}
                  onChange={(e) => handleChange("remarks", e.target.value)}
                  placeholder="Any extra notes..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm shadow-sm focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all" />
              </div>
            </div>
          </section>

          {/* Submit */}
          <div className="pt-4">
            <button id="submit-migration-form" type="submit" disabled={submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
              ) : (
                <>Submit Migration Request <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
