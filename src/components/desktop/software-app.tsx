// @ts-nocheck
import { openWith } from './use-vfs';
import { useState } from 'react';
import {
  Search, Download, Trash2, Check, Star, ShieldCheck,
  Code, Palette, Film, BookOpen, FileText, Gamepad2, Bomb,
  Calculator, HardDrive, ShoppingBag, ArrowLeft
} from 'lucide-react';
import { CATALOG, useSoftware, type AppPackage } from '@/lib/software';

const ICONS: Record<string, any> = {
  Code, Palette, Film, BookOpen, FileText, Gamepad2, Bomb,
  Calculator, HardDrive, ShoppingBag
};

export function SoftwareApp({ setTitle }: { setTitle?: (t: string) => void }) {
  const { installed, install, uninstall, isInstalled } = useSoftware();
  const [activeTab, setActiveTab] = useState<'explore' | 'installed' | 'updates'>('explore');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [detailApp, setDetailApp] = useState<AppPackage | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const categories = ['All', 'Development', 'Productivity', 'Graphics & Media', 'Games', 'Utilities'];

  const filtered = CATALOG.filter(app => {
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    const matchesSearch = !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.summary.toLowerCase().includes(search.toLowerCase()) ||
      app.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const installedList = CATALOG.filter(app => isInstalled(app.id));

  const handleInstall = (app: AppPackage) => {
    setInstallingId(app.id);
    setTimeout(() => {
      install(app.id);
      setInstallingId(null);
    }, 1200);
  };

  const handleUninstall = (app: AppPackage) => {
    uninstall(app.id);
  };

  const renderIcon = (name: string, size = 28) => {
    const IconComponent = ICONS[name] || ShoppingBag;
    return <IconComponent size={size} />;
  };

  return (
    <div className="software-app">
      {/* Top Navbar */}
      <header className="software-header">
        <div className="software-tabs">
          <button
            className={`tab-btn ${activeTab === 'explore' && !detailApp ? 'active' : ''}`}
            onClick={() => { setActiveTab('explore'); setDetailApp(null); }}
          >
            Explore
          </button>
          <button
            className={`tab-btn ${activeTab === 'installed' && !detailApp ? 'active' : ''}`}
            onClick={() => { setActiveTab('installed'); setDetailApp(null); }}
          >
            Installed ({installedList.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'updates' && !detailApp ? 'active' : ''}`}
            onClick={() => { setActiveTab('updates'); setDetailApp(null); }}
          >
            Updates
          </button>
        </div>

        <div className="software-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search apps, tools and games..."
            value={search}
            onChange={e => { setSearch(e.target.value); setDetailApp(null); }}
          />
        </div>
      </header>

      {/* Main Body */}
      <main className="software-body">
        {detailApp ? (
          <div className="software-detail">
            <button className="back-btn" onClick={() => setDetailApp(null)}>
              <ArrowLeft size={16} /> Back to catalog
            </button>

            <div className="detail-hero">
              <div className="detail-icon">
                {renderIcon(detailApp.iconName, 48)}
              </div>
              <div className="detail-meta">
                <h2>{detailApp.name}</h2>
                <p className="detail-summary">{detailApp.summary}</p>
                <div className="detail-badges">
                  <span className="badge"><ShieldCheck size={13} /> {detailApp.developer}</span>
                  <span className="badge">{detailApp.category}</span>
                  <span className="badge"><Star size={13} fill="currentColor" /> {detailApp.rating} ({detailApp.reviewsCount})</span>
                </div>
              </div>

              <div className="detail-actions">
                {installingId === detailApp.id ? (
                  <button className="btn-installing" disabled>Installing...</button>
                ) : isInstalled(detailApp.id) ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-install" onClick={() => openWith({ app: detailApp.id })}>
                      Open
                    </button>
                    <button className="btn-uninstall" onClick={() => handleUninstall(detailApp)}>
                      <Trash2 size={15} /> Uninstall
                    </button>
                  </div>
                ) : (
                  <button className="btn-install" onClick={() => handleInstall(detailApp)}>
                    <Download size={15} /> Install ({detailApp.size})
                  </button>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>About this application</h3>
              <p>{detailApp.description}</p>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <small>Version</small>
                <strong>{detailApp.version}</strong>
              </div>
              <div className="detail-card">
                <small>License</small>
                <strong>{detailApp.license}</strong>
              </div>
              <div className="detail-card">
                <small>Download Size</small>
                <strong>{detailApp.size}</strong>
              </div>
              <div className="detail-card">
                <small>Delivery</small>
                <strong>Snap / Ubuntu deb</strong>
              </div>
            </div>
          </div>
        ) : activeTab === 'explore' ? (
          <div className="software-explore">
            {/* Banner */}
            {!search && (
              <div className="software-banner">
                <div className="banner-content">
                  <span className="pill">Featured App</span>
                  <h2>Visual Studio Code</h2>
                  <p>Code editing redefined. Built for modern web and cloud development.</p>
                  <button onClick={() => setDetailApp(CATALOG[0])}>Learn more</button>
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="category-chips">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* App Grid */}
            <div className="catalog-grid">
              {filtered.map(app => (
                <div key={app.id} className="app-card" onClick={() => setDetailApp(app)}>
                  <div className="app-card-icon">{renderIcon(app.iconName, 36)}</div>
                  <div className="app-card-info">
                    <h4>{app.name}</h4>
                    <p>{app.summary}</p>
                    <div className="app-card-footer">
                      <span className="app-card-cat">{app.category}</span>
                      {isInstalled(app.id) ? (
                        <span className="installed-tag"><Check size={12} /> Installed</span>
                      ) : (
                        <span className="rating-tag"><Star size={11} fill="currentColor" /> {app.rating}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'installed' ? (
          <div className="software-installed">
            <h3>Installed Applications ({installedList.length})</h3>
            <div className="installed-list">
              {installedList.map(app => (
                <div key={app.id} className="installed-row">
                  <div className="row-left" onClick={() => setDetailApp(app)}>
                    {renderIcon(app.iconName, 32)}
                    <div>
                      <strong>{app.name}</strong>
                      <small>{app.summary} • {app.size}</small>
                    </div>
                  </div>
                    <div className="row-right" style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-install" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => openWith({ app: app.id })}>
                        Open
                      </button>
                      <button className="row-btn-uninstall" onClick={() => handleUninstall(app)}>
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="software-updates">
            <div className="updates-empty">
              <Check size={40} className="updates-check" />
              <h3>All software is up to date</h3>
              <p>Your Ubuntu 26.04 system has verified all Snap and APT repositories.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
