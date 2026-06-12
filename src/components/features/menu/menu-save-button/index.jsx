import { Button } from "@/components/ui/button"
import { useMenu } from "@/store/hooks/useMenu"
import { History } from "lucide-react"

const MenuSaveButton = ({ resId }) => {
    const { menu, saveMenu } = useMenu(resId)
    return (
        <Button onClick={() => saveMenu(menu)}>
            <History />
            Save Changes
        </Button>
    )
}

export default MenuSaveButton