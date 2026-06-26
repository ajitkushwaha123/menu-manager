"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Store, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function MigrationRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/zomato-to-swiggy");
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      } else {
        toast.error("Failed to load requests");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Processing</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Completed</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriceHandlingDisplay = (priceHandling) => {
    if (!priceHandling) return "N/A";
    const { type, value } = priceHandling;
    const isIncrease = value >= 0;
    const sign = isIncrease ? "+" : "";
    const suffix = type === "percent" ? "%" : "₹";
    return (
      <span className={`font-mono text-sm ${isIncrease ? "text-emerald-500" : "text-red-500"}`}>
        {sign}{value}{suffix}
      </span>
    );
  };

  const formatStep = (step) => {
    if (!step) return "-";
    return step.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Migration Requests</h2>
          <p className="text-muted-foreground">
            View and manage all Zomato to Swiggy menu migrations.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>A list of all queued menu migrations.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
              <Store className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No migration requests found
              </p>
              <p className="text-sm text-muted-foreground">
                Submit a new request from the migration tool.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left text-muted-foreground">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th scope="col" className="px-6 py-4">Restaurants (Z → S)</th>
                    <th scope="col" className="px-6 py-4">Price Rule</th>
                    <th scope="col" className="px-6 py-4">Access (Z/S)</th>
                    <th scope="col" className="px-6 py-4">Submitted By</th>
                    <th scope="col" className="px-6 py-4">Date</th>
                    <th scope="col" className="px-6 py-4">Step</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((req) => (
                    <tr key={req._id} className="bg-background border-b hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-red-500">{req.zomatoResName}</span>
                            <span className="text-xs text-muted-foreground">ID: {req.zomatoResId}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-orange-500">{req.swiggyResName}</span>
                            <span className="text-xs text-muted-foreground">ID: {req.swiggyResId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getPriceHandlingDisplay(req.priceHandling)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Badge variant="outline" className={req.zomatoAccess ? "text-emerald-500" : "text-red-500"}>
                            Z
                          </Badge>
                          <Badge variant="outline" className={req.swiggyAccess ? "text-emerald-500" : "text-red-500"}>
                            S
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">
                        {req.submittedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(req.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-muted-foreground">
                        {formatStep(req.currentStep)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/request/${req._id}`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            View <ArrowUpRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {requests.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, requests.length)}</span> of{" "}
                  <span className="font-medium">{requests.length}</span> results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(requests.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(requests.length / itemsPerPage)}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
