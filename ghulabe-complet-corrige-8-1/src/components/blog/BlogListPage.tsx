import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../../data/blogPosts';
import { Logo3DEye } from '../common/Logo3DEye';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const setMetaTag = (name: string, content: string) => {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

export const BlogListPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Blog Ghulabe — Cybersécurité pour PME africaines';
    setMetaTag(
      'description',
      "Conseils, guides et actualités sur la cybersécurité pour les PME africaines. Apprenez à protéger votre site web avec Ghulabe."
    );
  }, []);

  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-100">
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-[#0066FF]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="cursor-pointer">
            <Logo3DEye size="md" showText={true} />
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-300 hover:text-white transition-colors font-medium"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-2">
          Blog Ghulabe
        </h1>
        <p className="text-gray-400 mb-10">
          Cybersécurité, conseils pratiques et actualités pour les PME africaines.
        </p>

        <div className="space-y-6">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block p-5 sm:p-6 rounded-xl bg-[#0D1B2A]/60 border border-white/5 hover:border-[#0066FF]/40 transition-all group"
            >
              <h2 className="font-display font-bold text-xl text-white group-hover:text-[#0066FF] transition-colors mb-2">
                {post.title}
              </h2>
              <p className="text-sm text-gray-400 mb-4">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
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
                <span className="flex items-center gap-1 text-[#0066FF] ml-auto">
                  Lire <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default BlogListPage;
