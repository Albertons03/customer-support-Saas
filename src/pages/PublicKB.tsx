import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Search,
  Filter,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  Home,
  BookOpen,
} from "lucide-react";
import { supabase } from "../lib/supabase";

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

export function PublicKB() {
  const { id } = useParams<{ id: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    } else {
      setSelectedArticle(null);
    }
  }, [id]);

  useEffect(() => {
    filterArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, articles]);

  const loadArticles = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("knowledge_base_articles")
        .select("*")
        .eq("published", true)
        .order("views", { ascending: false });

      if (error) throw error;

      setArticles((data as Article[]) || []);
    } catch (err) {
      console.error("Error loading articles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadArticle = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from("knowledge_base_articles")
        .select("*")
        .eq("id", articleId)
        .eq("published", true)
        .single();

      if (error) throw error;

      setSelectedArticle(data as Article);

      // Increment view count
      await supabase.rpc("increment_article_views", {
        article_id: articleId,
      });
    } catch (err) {
      console.error("Error loading article:", err);
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

  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(true);
    // In a real app, you'd save this feedback to the database
    console.log("Feedback:", helpful ? "helpful" : "not helpful");
  };

  const getExcerpt = (content: string, maxLength: number = 120) => {
    const plainText = content
      .replace(/[#*`\n]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    let html = text;

    // Headers
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 class="text-3xl font-bold mb-4 mt-6">$1</h1>'
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

  const groupedArticles = CATEGORIES.slice(1).reduce((acc, category) => {
    acc[category] = articles.filter((article) => article.category === category);
    return acc;
  }, {} as Record<string, Article[]>);

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Public Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                to="/kb"
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                <BookOpen className="w-6 h-6" />
                Knowledge Base
              </Link>
              <Link
                to="/kb"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to articles
              </Link>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <article className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 lg:p-12">
            {/* Article Header */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Tag className="w-4 h-4" />
                {selectedArticle.category}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {selectedArticle.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedArticle.views} views
                </span>
                <span>•</span>
                <span>
                  Updated{" "}
                  {new Date(selectedArticle.updated_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>

            {/* Article Body */}
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-indigo-600 prose-strong:text-gray-900"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(selectedArticle.content),
              }}
            />

            {/* Feedback Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center">
                {!feedbackGiven ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Was this article helpful?
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleFeedback(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-green-50 text-gray-700 hover:text-green-700 rounded-lg transition shadow-sm border border-gray-200 hover:border-green-300"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        Yes, helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-lg transition shadow-sm border border-gray-200 hover:border-red-300"
                      >
                        <ThumbsDown className="w-5 h-5" />
                        Not helpful
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-green-700">
                    <p className="text-lg font-semibold mb-2">
                      Thank you for your feedback! 🎉
                    </p>
                    <p className="text-sm">
                      We're constantly working to improve our knowledge base.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Related Articles */}
          {articles
            .filter(
              (a) =>
                a.category === selectedArticle.category &&
                a.id !== selectedArticle.id
            )
            .slice(0, 3).length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles
                  .filter(
                    (a) =>
                      a.category === selectedArticle.category &&
                      a.id !== selectedArticle.id
                  )
                  .slice(0, 3)
                  .map((article) => (
                    <Link
                      key={article.id}
                      to={`/kb/${article.id}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition p-5"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {getExcerpt(article.content)}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Article list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Public Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Knowledge Base
                </h1>
                <p className="text-sm text-gray-600">
                  Find answers to common questions
                </p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <Home className="w-4 h-4" />
              Home
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">How can we help you?</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-4 rounded-xl text-lg text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-300 shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-indigo-100 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Loading articles...</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No articles found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or browse by category
            </p>
          </div>
        )}

        {/* Filtered Results */}
        {!isLoading &&
          filteredArticles.length > 0 &&
          (searchQuery || selectedCategory !== "All") && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {searchQuery
                  ? `Search Results (${filteredArticles.length})`
                  : selectedCategory}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/kb/${article.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition p-6 group"
                  >
                    <div className="flex items-center gap-2 text-xs text-indigo-600 mb-3">
                      <Tag className="w-3 h-3" />
                      {article.category}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {getExcerpt(article.content)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3 h-3" />
                      {article.views} views
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        {/* Browse by Category */}
        {!isLoading &&
          !searchQuery &&
          selectedCategory === "All" &&
          articles.length > 0 && (
            <div className="space-y-12">
              {CATEGORIES.slice(1).map((category) => {
                const categoryArticles = groupedArticles[category];
                if (categoryArticles.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {category}
                      </h2>
                      <button
                        onClick={() => setSelectedCategory(category)}
                        className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryArticles.slice(0, 3).map((article) => (
                        <Link
                          key={article.id}
                          to={`/kb/${article.id}`}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition p-6 group"
                        >
                          <div className="flex items-center gap-2 text-xs text-indigo-600 mb-3">
                            <Tag className="w-3 h-3" />
                            {article.category}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {getExcerpt(article.content)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Eye className="w-3 h-3" />
                            {article.views} views
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>
              Still need help?{" "}
              <a
                href="/"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
