"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Store, User, MessageSquare, Tag, ChevronDown, ChevronUp, CheckCircle2, PlayCircle, RefreshCw, XCircle, ListTree } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

function AccordionItem({ title, isOpen, onToggle, children }) {
  return (
    <div className="border rounded-lg mb-4 bg-card text-card-foreground shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 font-semibold hover:bg-muted/50 transition-colors"
      >
        {title}
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isOpen && <div className="p-4 border-t bg-background">{children}</div>}
    </div>
  );
}

const STEPS = [
  { id: "ZOMATO_CREATE", label: "Create Zomato Profile" },
  { id: "ZOMATO_IMPORT", label: "Import Zomato Menu" },
  { id: "ZOMATO_AI", label: "Generate AI Descriptions (Zomato)" },
  { id: "ZOMATO_PRICE", label: "Apply Price Adjustments (Zomato)" },
  { id: "SWIGGY_CREATE", label: "Create Swiggy Profile" },
  { id: "SWIGGY_IMPORT", label: "Import Swiggy Menu" },
  { id: "SWIGGY_CLEAR", label: "Clear Existing Swiggy Menu (Action Required)" },
  { id: "SWIGGY_SYNC", label: "Queue Zomato Menu to Swiggy (Action Required)" },
  { id: "CHECK_IMAGES", label: "Check & Upload Rejected Images (Action Required)" },
  { id: "CHECK_ITEMS", label: "Update & Resubmit Rejected Items (Action Required)" },
  { id: "VALIDATE_APPROVAL", label: "Validate Final Approvals (Action Required)" },
];

export default function RequestDetailsPage({ params }) {
  const router = useRouter();
  const { requestId } = use(params);

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState("details");
  const [approving, setApproving] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const currentStepIndex = request ? STEPS.findIndex(s => s.id === request.currentStep) : -1;
  const hasZomatoMenu = request?.status === "completed" || (currentStepIndex !== -1 && currentStepIndex > 0);
  const hasSwiggyMenu = request?.status === "completed" || (currentStepIndex !== -1 && currentStepIndex > 4);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/zomato-to-swiggy/${requestId}`);
      const data = await res.json();
      if (data.success) {
        setRequest(data.data);
      } else {
        toast.error("Failed to load request");
        router.push("/requests");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg) => {
    setLogs((prev) => [...prev, { time: new Date(), msg }]);
  };

  const updateStatusAndStep = async (status, currentStep) => {
    try {
      await fetch(`/api/zomato-to-swiggy/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, currentStep })
      });
      setRequest(prev => ({ ...prev, status, currentStep }));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const executeStep = async (stepId) => {
    switch (stepId) {
      case "ZOMATO_CREATE":
        addLog(`Creating Zomato menu profile for ${request.zomatoResName} (${request.zomatoResId})...`);
        let zRes = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resId: request.zomatoResId, platform: "zomato", name: request.zomatoResName })
        });
        let zData = await zRes.json();
        if (!zRes.ok && zData.message !== "Menu for this restaurant and platform already exists") {
          throw new Error(`Zomato creation failed: ${zData.message}`);
        }
        addLog("Zomato profile ready.");
        return "ZOMATO_IMPORT";

      case "ZOMATO_IMPORT":
        addLog("Fetching menu from Zomato Import API...");
        let zImportRes = await fetch(`/api/menu/${request.zomatoResId}/zomato/import`);
        let zImportData = await zImportRes.json();
        if (!zImportData.success) throw new Error(`Zomato import failed: ${zImportData.message}`);
        addLog("Zomato menu imported successfully.");
        return "ZOMATO_AI";

      case "ZOMATO_AI":
        addLog("Generating AI descriptions for Zomato menu (this may take a minute)...");
        let aiDescRes = await fetch(`/api/menu/${request.zomatoResId}/ai/description`, {
          method: "POST"
        });
        let aiDescData = await aiDescRes.json();
        if (!aiDescData.success && aiDescData.message !== "No items found to process") {
           throw new Error(`AI Description failed: ${aiDescData.message}`);
        }
        addLog(aiDescData.message === "No items found to process" 
          ? "AI Descriptions skipped (all items already have descriptions)."
          : `AI Descriptions generated successfully for ${aiDescData.updated_items} items.`);
        return "ZOMATO_PRICE";

      case "ZOMATO_PRICE":
        if (request.priceHandling.value === 0) {
          addLog("Price adjustment skipped (value is 0).");
          return "SWIGGY_CREATE";
        }

        addLog(`Applying price adjustment of ${request.priceRaw} to Zomato menu...`);
        let aiPriceRes = await fetch(`/api/menu/${request.zomatoResId}/ai/price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: request.priceRaw })
        });
        let aiPriceData = await aiPriceRes.json();
        
        if (!aiPriceData.success) {
          throw new Error(`Price adjustment failed: ${aiPriceData.message}`);
        }
        
        addLog(`Price adjusted successfully for ${aiPriceData.updated_items} items (Rounded to nearest 9).`);
        return "SWIGGY_CREATE";

      case "SWIGGY_CREATE":
        addLog(`Creating Swiggy menu profile for ${request.swiggyResName} (${request.swiggyResId})...`);
        let sRes = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resId: request.swiggyResId, platform: "swiggy", name: request.swiggyResName })
        });
        let sData = await sRes.json();
        if (!sRes.ok && sData.message !== "Menu for this restaurant and platform already exists") {
          throw new Error(`Swiggy creation failed: ${sData.message}`);
        }
        addLog("Swiggy profile ready.");
        return "SWIGGY_IMPORT";

      case "SWIGGY_IMPORT":
        addLog("Fetching menu from Swiggy Import API...");
        let sImportRes = await fetch(`/api/menu/${request.swiggyResId}/swiggy/import`);
        let sImportData = await sImportRes.json();
        if (!sImportData.success) throw new Error(`Swiggy import failed: ${sImportData.message}`);
        addLog("Swiggy menu imported successfully.");
        return "SWIGGY_CLEAR";

      case "SWIGGY_CLEAR":
        addLog("Manual Step: Confirmed Swiggy menu is cleared.");
        return "SWIGGY_SYNC";

      case "SWIGGY_SYNC":
        addLog("Manual Step: Confirmed Zomato menu is queued to Swiggy.");
        return "CHECK_IMAGES";

      case "CHECK_IMAGES":
        addLog("Manual Step: Checked and uploaded rejected images.");
        return "CHECK_ITEMS";

      case "CHECK_ITEMS":
        addLog("Manual Step: Updated and resubmitted rejected items.");
        return "VALIDATE_APPROVAL";

      case "VALIDATE_APPROVAL":
        addLog("Manual Step: Validated final approvals. Migration Complete!");
        return "COMPLETED";

      default:
        throw new Error("Unknown step");
    }
  };

  const runMigration = async (approvedStepId = null) => {
    if (!request) return;
    setApproving(true);
    setOpenSection("progress");
    addLog(request.status === "failed" ? "Retrying migration..." : request.status === "action_required" ? "Resuming migration..." : "Starting migration process...");
    
    let currentStep = request.currentStep || "ZOMATO_CREATE";
    
    if (request.status !== "processing" && request.status !== "action_required") {
      await updateStatusAndStep("processing", currentStep);
    } else if (request.status === "action_required" && approvedStepId === currentStep) {
      await updateStatusAndStep("processing", currentStep);
    }

    try {
      while (currentStep !== "COMPLETED") {
        const manualSteps = ["SWIGGY_CLEAR", "SWIGGY_SYNC", "CHECK_IMAGES", "CHECK_ITEMS", "VALIDATE_APPROVAL"];
        
        if (manualSteps.includes(currentStep) && approvedStepId !== currentStep) {
           await updateStatusAndStep("action_required", currentStep);
           addLog(`Execution paused: User action required for ${currentStep}.`);
           return; // Break execution to wait for user
        }

        setActiveStep(currentStep);
        const nextStep = await executeStep(currentStep);
        currentStep = nextStep;
        await updateStatusAndStep(currentStep === "COMPLETED" ? "completed" : "processing", currentStep);
      }
      toast.success("Migration process completed!");
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      await updateStatusAndStep("failed", currentStep); 
      toast.error("Migration process failed. Check progress to retry.");
    } finally {
      setActiveStep(null);
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) return null;

  const isCompleted = request.status === "completed" || request.currentStep === "COMPLETED";

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/requests">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Request Details</h2>
          <p className="text-muted-foreground text-sm">
            {request._id} • {format(new Date(request.createdAt), "PPP p")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className={`capitalize px-3 py-1 ${
            request.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
            request.status === 'failed' ? 'bg-red-500/10 text-red-600 border-red-500/30' :
            request.status === 'processing' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
            'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
          }`}>
            {request.status}
          </Badge>
          {(request.status === "pending" || request.status === "failed") && (
            <Button onClick={runMigration} disabled={approving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : request.status === "failed" ? <RefreshCw className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              {approving ? "Processing..." : request.status === "failed" ? "Retry Migration" : "Approve & Import"}
            </Button>
          )}
        </div>
      </div>

      <AccordionItem 
        title={<span className="flex items-center gap-2"><Store className="w-4 h-4"/> Migration Information</span>}
        isOpen={openSection === "details"}
        onToggle={() => setOpenSection(openSection === "details" ? "" : "details")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Store className="w-4 h-4"/> Zomato Details</h4>
              <p className="font-medium">{request.zomatoResName}</p>
              <p className="text-sm text-muted-foreground font-mono">ID: {request.zomatoResId}</p>
              <Badge variant="outline" className={`mt-2 ${request.zomatoAccess ? "text-emerald-500" : "text-red-500"}`}>
                Access: {request.zomatoAccess ? "Verified" : "Missing"}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Store className="w-4 h-4"/> Swiggy Details</h4>
              <p className="font-medium">{request.swiggyResName}</p>
              <p className="text-sm text-muted-foreground font-mono">ID: {request.swiggyResId}</p>
              <Badge variant="outline" className={`mt-2 ${request.swiggyAccess ? "text-emerald-500" : "text-red-500"}`}>
                Access: {request.swiggyAccess ? "Verified" : "Missing"}
              </Badge>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><User className="w-4 h-4"/> Submitter</h4>
              <p className="font-medium">{request.submittedBy}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Tag className="w-4 h-4"/> Price Rule</h4>
              <div className="font-mono bg-muted p-2 rounded-md inline-block">
                {request.priceHandling.value >= 0 ? "+" : ""}{request.priceHandling.value}
                {request.priceHandling.type === "percent" ? "%" : "₹"}
              </div>
            </div>
            {request.remarks && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4"/> Remarks</h4>
                <p className="text-sm p-3 bg-muted/50 rounded-lg border">{request.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </AccordionItem>

      {(request.status !== "pending") && (
        <AccordionItem 
          title={
            <span className="flex items-center gap-2">
              <ListTree className={`w-4 h-4 ${request.status === 'failed' ? 'text-red-500' : ''}`}/> 
              Migration Progress {request.status === 'failed' && <span className="text-red-500 font-bold ml-2">FAILED</span>}
            </span>
          }
          isOpen={openSection === "progress"}
          onToggle={() => setOpenSection(openSection === "progress" ? "" : "progress")}
        >
          <div className="space-y-4 max-w-2xl">
            {STEPS.map((step, index) => {
              const isPast = isCompleted || (currentStepIndex !== -1 && index < currentStepIndex);
              const isCurrent = !isCompleted && step.id === request.currentStep;
              const isFailed = isCurrent && request.status === "failed";
              const isActive = isCurrent && request.status === "processing";

              return (
                <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    {isPast ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5 text-red-500" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                      </div>
                    )}
                    <span className={`font-medium ${isPast ? "text-slate-700" : isFailed ? "text-red-600" : isActive ? "text-blue-600" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {isFailed && !approving && (
                    <Button onClick={() => runMigration(step.id)} size="sm" variant="outline" className="h-8 gap-2 border-red-200 text-red-600 hover:bg-red-50">
                      <RefreshCw className="w-3 h-3" /> Retry
                    </Button>
                  )}
                  {(request.status === "action_required" && isCurrent && !approving) && (
                    <Button onClick={() => runMigration(step.id)} size="sm" className="h-8 gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                      <PlayCircle className="w-3 h-3" /> Mark as Completed
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionItem>
      )}


      {hasZomatoMenu && (
        <AccordionItem 
          title={<span className="flex items-center gap-2"><Store className="w-4 h-4"/> Zomato Menu Preview</span>}
          isOpen={openSection === "zomato"}
          onToggle={() => setOpenSection(openSection === "zomato" ? "" : "zomato")}
        >
          <div className="p-8 flex flex-col items-center justify-center bg-slate-50 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Click below to view and manage the fully migrated Zomato menu.</p>
            <Link href={`/menu/${request.zomatoResId}?platform=zomato`} target="_blank" rel="noopener noreferrer">
              <Button>Open Zomato Menu</Button>
            </Link>
          </div>
        </AccordionItem>
      )}

      {hasSwiggyMenu && (
        <AccordionItem 
          title={<span className="flex items-center gap-2"><Store className="w-4 h-4"/> Swiggy Menu Preview</span>}
          isOpen={openSection === "swiggy"}
          onToggle={() => setOpenSection(openSection === "swiggy" ? "" : "swiggy")}
        >
          <div className="p-8 flex flex-col items-center justify-center bg-slate-50 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Click below to view and manage the destination Swiggy menu.</p>
            <Link href={`/menu/${request.swiggyResId}?platform=swiggy`} target="_blank" rel="noopener noreferrer">
              <Button>Open Swiggy Menu</Button>
            </Link>
          </div>
        </AccordionItem>
      )}
    </div>
  );
}
