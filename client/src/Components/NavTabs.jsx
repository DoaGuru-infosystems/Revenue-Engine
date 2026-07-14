import React, { useEffect, useState, useMemo } from "react";

export default function NavTabs({
  tabs = [],
  activeTab,
  onChange,
  fixedUnderHeader = true,
  persistKey,
  className = "",
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!persistKey) return;
    const saved = localStorage.getItem(persistKey);
    if (saved && tabs.some((t) => t.id === saved) && saved !== activeTab) {
      onChange(saved);
    }
  }, [persistKey]);

  useEffect(() => {
    if (!persistKey) return;
    if (activeTab) localStorage.setItem(persistKey, activeTab);
  }, [activeTab, persistKey]);

  const handleTabClick = (id) => {
    onChange?.(id);
    setMobileMenuOpen(false);
  };

  const containerStyles = useMemo(
    () =>
      fixedUnderHeader ? "fixed top-16 left-0 right-0 z-20" : "relative z-20",
    [fixedUnderHeader]
  );

  return (
    <>
      {/* Desktop Tabs (under header) */}
      <nav
        className={[
          "hidden lg:block",
          containerStyles,
          "h-12 backdrop-blur-xl",
          className,
        ].join(" ")}
        style={{
          backgroundColor: 'var(--bg-nav)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="h-full w-full px-3 lg:px-4">
          <div className="h-full overflow-x-auto no-scrollbar">
            <div className="h-full flex items-center justify-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={[
                      "flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium",
                      "whitespace-nowrap min-w-max transition-all duration-200",
                    ].join(" ")}
                    style={
                      isActive
                        ? {
                            backgroundColor: 'var(--tab-active-bg)',
                            color: 'var(--tab-active-text)',
                            boxShadow: 'inset 0 0 0 1px var(--tab-active-ring)',
                          }
                        : {
                            color: 'var(--tab-inactive-text)',
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--tab-inactive-hover-text)';
                        e.currentTarget.style.backgroundColor = 'var(--tab-inactive-hover-bg)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--tab-inactive-text)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={tab.label}
                  >
                    {Icon ? <Icon className="w-4 h-4 shrink-0" /> : null}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
