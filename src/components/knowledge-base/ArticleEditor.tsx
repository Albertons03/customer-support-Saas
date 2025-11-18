import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Eye, X, FileText, Tag, Globe } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

interface Article {
  id?: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
}

const CATEGORIES = [
  "Getting Started",
  "Tickets",
  "AI Assistant",
  "Team Management",
  "Billing",
  "API & Integrations",
  "Security",
  "Troubleshooting",
  "Other",
];

export function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [article, setArticle] = useState<Article>({
    title: "",
    content: "",
    category: "Getting Started",
    published: false,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      loadArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("knowledge_base_articles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setArticle({
          id: data.id,
          title: data.title,
          content: data.content,
          category: data.category,
          published: data.published,
        });
      }
    } catch (err) {
      console.error("Error loading article:", err);
      setError("Failed to load article");
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!article.title.trim() || !article.content.trim()) {
      setError("Title and content are required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const workspaceId = "00000000-0000-0000-0000-000000000001"; // Default workspace

      const articleData = {
        workspace_id: workspaceId,
        title: article.title.trim(),
        content: article.content.trim(),
        category: article.category,
        published: publish,
        created_by: user?.id,
      };

      if (isEditMode && article.id) {
        // Update existing article
        const { error } = await supabase
          .from("knowledge_base_articles")
          .update(articleData)
          .eq("id", article.id);

        if (error) throw error;

        setSuccessMessage(
          publish ? "Article published successfully!" : "Draft saved!"
        );
      } else {
        // Create new article
        const { data, error } = await supabase
          .from("knowledge_base_articles")
          .insert(articleData)
          .select()
          .single();

        if (error) throw error;

        setSuccessMessage(
          publish ? "Article published successfully!" : "Draft created!"
        );

        // Navigate to edit mode with the new article ID
        if (data) {
          navigate(`/knowledge-base/edit/${data.id}`, { replace: true });
        }
      }

      // Update local state
      setArticle((prev) => ({ ...prev, published: publish }));

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving article:", err);
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    const newPublishedState = !article.published;
    await handleSave(newPublishedState);
  };

  // Simple markdown preview renderer
  const renderMarkdown = (text: string) => {
    let html = text;

    // Headers
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-bold mb-4">$1</h1>'
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-2xl font-bold mb-3 mt-6">$1</h2>'
    );
    html = html.replace(
      /^### (.*$)/gim,
      '<h3 class="text-xl font-semibold mb-2 mt-4">$1</h3>'
    );

    // Bold
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>'
    );

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Code blocks
    html = html.replace(
      /```(.*?)```/gs,
      '<pre class="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>'
    );

    // Inline code
    html = html.replace(
      /`(.*?)`/g,
      '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>'
    );

    // Lists
    html = html.replace(/^- (.*$)/gim, '<li class="ml-6 mb-1">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-1">$1</li>');

    // Wrap lists
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-4">$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = '<p class="mb-4">' + html + "</p>";

    return html;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode
                ? "Update your knowledge base article"
                : "Add a new article to your knowledge base"}
            </p>
          </div>
          <button
            onClick={() => navigate("/knowledge-base")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>

          <button
            onClick={handlePublishToggle}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition disabled:opacity-50 ${
              article.published
                ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            }`}
          >
            <Globe className="w-4 h-4" />
            {article.published ? "Unpublish" : "Publish"}
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Edit" : "Preview"}
          </button>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            {article.published ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                Published
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {!showPreview ? (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                Article Title
              </label>
              <input
                type="text"
                value={article.title}
                onChange={(e) =>
                  setArticle({ ...article, title: e.target.value })
                }
                placeholder="e.g., How to Create Your First Ticket"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {article.title.length}/200 characters
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4" />
                Category
              </label>
              <select
                value={article.category}
                onChange={(e) =>
                  setArticle({ ...article, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Content (Markdown supported)</span>
                <span className="text-xs text-gray-500 font-normal">
                  Use # for headers, ** for bold, * for italic
                </span>
              </label>
              <textarea
                value={article.content}
                onChange={(e) =>
                  setArticle({ ...article, content: e.target.value })
                }
                placeholder="Write your article content here using Markdown...

Example:
# Main Title
## Subtitle
- Bullet point
**Bold text**
*Italic text*
`code`"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                rows={20}
              />
            </div>
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Tag className="w-4 h-4" />
                {article.category}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-0">
                {article.title || "Untitled Article"}
              </h1>
            </div>
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(article.content || "*No content yet*"),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
