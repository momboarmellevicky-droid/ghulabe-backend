import React, { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { getBlogPostBySlug } from '../../data/blogPosts';
import { Logo3DEye } from '../common/Logo3DEye';
import { Calendar, Clock, ArrowLeft, ShieldCheck } from 'lucide-react';

const setMetaTag = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — Blog Ghulabe`;
    setMetaTag('description', post.metaDescription);
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100">
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#0066FF]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="cursor-pointer">
            <Logo3DEye size="md" showText={true} />
          </Link>
          <Link
            to="/blog"
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Tous les articles
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-8">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.readingTimeMinutes} min de lecture
          </span>
        </div>

        <article
          className="prose prose-invert max-w-none text-gray-300 leading-relaxed [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-white [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-4 [&_code]:bg-[#0D1B2A] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#00FF88] [&_code]:text-sm"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <div className="mt-10 p-6 rounded-xl bg-[#0D1B2A]/70 border border-[#0066FF]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#00FF88] shrink-0" />
            <p className="text-sm text-gray-200">
              Vérifiez gratuitement la sécurité de votre site en quelques minutes.
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 px-5 py-2.5 rounded-lg bg-[#0066FF] text-white font-display font-bold text-sm hover:bg-[#0052cc] transition-colors"
          >
            Scanner mon site
          </Link>
        </div>
      </main>
    </div>
  );
};

export default BlogPostPage;
