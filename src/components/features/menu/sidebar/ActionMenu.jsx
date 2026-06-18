import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, ListPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ActionMenu({
    onRename,
    onDelete,
    onQueue,
    triggerClassName = "",
    destructive = true,
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className={triggerClassName}
                >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-36 rounded-xl text-sm"
            >
                <DropdownMenuItem
                    onClick={onRename}
                    className="rounded-lg cursor-pointer py-1.5"
                >
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Rename
                </DropdownMenuItem>

                {onQueue && (
                    <DropdownMenuItem
                        onClick={onQueue}
                        className="rounded-lg cursor-pointer py-1.5 text-blue-600 focus:text-blue-700"
                    >
                        <ListPlus className="mr-2 h-3.5 w-3.5" />
                        Queue
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onClick={onDelete}
                    className={
                        destructive
                            ? "text-destructive hover:text-white focus:bg-destructive focus:text-destructive-foreground rounded-lg cursor-pointer py-1.5"
                            : "rounded-lg cursor-pointer py-1.5"
                    }
                >
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
