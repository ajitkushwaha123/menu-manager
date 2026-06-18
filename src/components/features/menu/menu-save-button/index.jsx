import { Button } from "@/components/ui/button"
import { useMenu } from "@/store/hooks/useMenu"
import { History, Save } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MenuSaveButton = ({ resId, currentPlatform = "swiggy" }) => {
    const { updated_menu, saveMenu } = useMenu(resId)
    const [open, setOpen] = useState(false)
    const [targetPlatform, setTargetPlatform] = useState(currentPlatform)
    const [targetResId, setTargetResId] = useState(resId || "")

    const handleSave = () => {
        if (!targetResId.trim() || !targetPlatform) {
            toast.error("Please provide both platform and Restaurant ID");
            return;
        }

        toast.promise(
            saveMenu({ resId: targetResId, platform: targetPlatform, payload: { "updated_menu": updated_menu } }),
            {
                loading: `Queuing changes to ${targetPlatform}...`,
                success: 'Changes queued successfully!',
                error: 'Failed to queue changes',
            }
        );
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <History size={16} />
                    Sync Changes
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sync Menu Changes</DialogTitle>
                    <DialogDescription>
                        Queue your recent menu changes to a specific platform and restaurant ID.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="platform">Target Platform</Label>
                        <Select value={targetPlatform} onValueChange={setTargetPlatform}>
                            <SelectTrigger id="platform">
                                <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="swiggy">Swiggy</SelectItem>
                                <SelectItem value="zomato">Zomato</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="targetResId">Target Restaurant ID</Label>
                        <Input
                            id="targetResId"
                            value={targetResId}
                            onChange={(e) => setTargetResId(e.target.value)}
                            placeholder="e.g. 12345"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save size={16} />
                        Confirm Sync
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default MenuSaveButton