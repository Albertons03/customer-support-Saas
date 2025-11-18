import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Tag,
  Globe,
  FileEdit,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  "All",
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

export function ArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, articles]);

  const loadArticles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("knowledge_base_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setArticles((data as Article[]) || []);
    } catch (err) {
      console.error("Error loading articles:", err);
      setError("Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query)
      );
    }

    setFilteredArticles(filtered);
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("knowledge_base_articles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setArticles(articles.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting article:", err);
      alert("Failed to delete article");
    }
  };

  const getExcerpt = (content: string, maxLength: number = 150) => {
    const plainText = content
      .replace(/[#*`\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-gray-600 mt-1">
              Manage your help articles and documentation
            </p>
          </div>
          <button
            onClick={() => navigate("/knowledge-base/new")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Article
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-64 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {articles.length}
            </p>
            <p className="text-sm text-gray-600">Total Articles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {articles.filter((a) => a.published).length}
            </p>
            <p className="text-sm text-gray-600">Published</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {articles.filter((a) => !a.published).length}
            </p>
            <p className="text-sm text-gray-600">Drafts</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-4">Loading articles...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileEdit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No articles yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first knowledge base article to get started
          </p>
          <button
            onClick={() => navigate("/knowledge-base/new")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Article
          </button>
        </div>
      )}

      {/* No Results */}
      {!isLoading && articles.length > 0 && filteredArticles.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Articles Grid */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {article.category}
                  </span>
                  {article.published ? (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      Draft
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {getExcerpt(article.content)}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views} views
                  </span>
                  <span>{formatDate(article.updated_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 p-3 bg-gray-50 flex gap-2">
                <button
                  onClick={() => window.open(`/kb/${article.id}`, "_blank")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => navigate(`/knowledge-base/edit/${article.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded transition"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(article.id, article.title)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
