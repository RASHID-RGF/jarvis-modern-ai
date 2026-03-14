import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AboutModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative z-10 w-full max-w-lg mx-4 p-6 rounded-lg glass-panel">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-cyan-glow tracking-wider">ABOUT</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </Button>
                </div>

                <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                        <span className="text-cyan-400 font-semibold">JARVIS MODERN AI</span> is an advanced
                        AI-powered assistant built with cutting-edge technologies.
                    </p>

                    <div className="py-2">
                        <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Version</h3>
                        <p>1.0.0</p>
                    </div>

                    <div className="py-2">
                        <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Built With</h3>
                        <ul className="space-y-1">
                            <li>• React + TypeScript</li>
                            <li>• Tailwind CSS</li>
                            <li>• OpenAI GPT-4 API</li>
                            <li>• Firebase Auth</li>
                            <li>• Python Backend</li>
                        </ul>
                    </div>

                    <div className="py-2">
                        <h3 className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Developer</h3>
                        <p>Raoq1p9w</p>
                    </div>

                    <div className="pt-4 border-t border-cyan-500/20">
                        <p className="text-xs text-center">
                            © 2024 JARVIS MODERN AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
