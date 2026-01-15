import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AuthorBio() {
    return (
        <Card className="bg-slate-900/50 border-slate-800 mt-12 mb-8">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <Avatar className="h-16 w-16 border-2 border-cyan-500/20">
                    <AvatarImage src="/icon-192x192.png" alt="TypeMasterAI Team" />
                    <AvatarFallback className="bg-cyan-900 text-cyan-200">TM</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">TypeMasterAI Editorial Team</h3>
                        <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs border border-cyan-500/20">Verified Expert</Badge>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Our team consists of competitive 150+ WPM typists, certified stenographers, and human-computer interaction (HCI) researchers. We are dedicated to providing the most authoritative data on touch typing mechanics, neuromuscular speed optimization, and keyboard ergonomics. Every guide is peer-reviewed by experts to ensure technical accuracy and peak performance recommendations.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
