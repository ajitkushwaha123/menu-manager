import { Button } from "@/components/ui/button"
import { useMenu } from "@/store/hooks/useMenu"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

const MenuSaveDBButton = ({ resId, currentPlatform = "swiggy" }) => {
    const { saveToDB } = useMenu(resId, currentPlatform)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveToDB();
            toast.success("Menu saved to database successfully!");
        } catch (error) {
            toast.error("Failed to save menu");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleSave} 
            disabled={isSaving}
        >
            <Save size={16} />
            Save Menu
        </Button>
    )
}

export default MenuSaveDBButton
