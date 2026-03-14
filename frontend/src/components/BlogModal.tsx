import { useState } from "react"
import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlogModalProps {
    isOpen: boolean
    onClose: () => void
}

interface BlogPost {
    id: number
    title: string
    date: string
    excerpt: string
}

const blogPosts: BlogPost[] = [
    {
        id: 1,
        title: "Introducing JARVIS MODERN AI",
        date: "2024-01-15",
        excerpt: "Welcome to the future of AI assistance. JARVIS MODERN AI brings cutting-edge artificial intelligence to your fingertips."
    },
    {
        id: 2,
        title: "Features & Capabilities",
        date: "2024-01-20",
        excerpt: "Discover the powerful features of JARVIS MODERN AI including voice synthesis, smart conversations, and more."
    },
    {
        id: 3,
        title: "How It Works",
        date: "2024-02-01",
        excerpt: "Learn about the technology behind JARVIS MODERN AI and how it processes your requests."
    }
]

export function BlogModal({ isOpen, onClose }: BlogModalProps) {
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal content */}
            <div className="relative z-10 w-full max-w-2xl mx-4 p-6 rounded-lg glass-panel max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-cyan-glow tracking-wider">BLOG</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </Button>
                </div>

                {selectedPost ? (
                    <div className="space-y-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyan-400"
                            onClick={() => setSelectedPost(null)}
                        >
                            ← Back to posts
                        </Button>

                        <h3 className="text-lg font-semibold text-cyan-glow">
                            {selectedPost.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {selectedPost.date}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {selectedPost.excerpt}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            Latest updates and news from JARVIS MODERN AI
                        </p>

                        {blogPosts.map((post) => (
                            <div
                                key={post.id}
                                className="p-4 rounded-md bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedPost(post)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-cyan-glow">
                                            {post.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {post.date}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                    <ExternalLink size={14} className="text-cyan-400/50 ml-2 shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 mt-4 border-t border-cyan-500/20">
                    <p className="text-xs text-center text-muted-foreground">
                        More updates coming soon...
                    </p>
                </div>
            </div>
        </div>
    )
}
