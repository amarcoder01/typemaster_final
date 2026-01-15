import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AuthPromptProps {
    className?: string;
    message?: string;
    tooltipTitle?: string;
    tooltipText?: string;
}

export function AuthPrompt({
    className,
    message = "save your results and compete on the leaderboard!",
    tooltipTitle = "Create Your Profile",
    tooltipText = "Track your progress, earn achievements, and compete with others on the global leaderboard.",
}: AuthPromptProps) {
    const { user } = useAuth();

    if (user) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card className={cn("p-3 sm:p-4 mt-4 sm:mt-6 bg-primary/5 border-primary/20 cursor-help", className)}>
                        <p className="text-center text-xs sm:text-sm">
                            <a href="/login" className="text-primary hover:underline font-medium">Sign in</a> to {message}
                        </p>
                    </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] p-3">
                    <p className="font-bold text-sm mb-1">{tooltipTitle}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
