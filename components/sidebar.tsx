"use client";

/**
 * Sidebar Navigation Component
 * 
 * Displays role-based navigation with filtered menu items based on
 * user's permissions and warehouse access.
 */

import { useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  mainNavigation,
  filterNavigationItems,
  NavigationItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

/**
 * Navigation item component with support for nested items
 */
function NavigationItemComponent({
  item,
  depth = 0,
}: {
  item: NavigationItem;
  depth?: number;
}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const toggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <Link
        href={item.href}
        onClick={hasChildren ? toggleExpand : undefined}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
          "hover:bg-gray-100 rounded-lg",
          isActive && "bg-[#002A3A]/10 text-[#002A3A]",
          !isActive && "text-gray-700",
          depth > 0 && "ml-4"
        )}
      >
        {Icon && (
          <Icon className={cn("w-5 h-5", isActive ? "text-[#00E273]" : "text-gray-500")} />
        )}
        <span className="flex-1">{item.label}</span>
        
        {item.badge && (
          <span className="px-2 py-0.5 text-xs bg-[#00E273] text-white rounded-full">
            {item.badge}
          </span>
        )}
        
        {hasChildren && (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )
        )}
      </Link>
      
      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-0.5">
          {item.children?.map((child) => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar component with role-based navigation
 */
export function Sidebar({ className }: SidebarProps) {
  const { can, hasRole, canAccessWarehouse, isLoading } = usePermissions();

  // Filter navigation items based on permissions
  const filteredNavigation = isLoading
    ? []
    : filterNavigationItems(
        mainNavigation,
        can,
        hasRole,
        canAccessWarehouse
      );

  return (
    <aside
      className={cn(
        "w-64 bg-white border-r border-gray-200 min-h-screen",
        className
      )}
    >
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
            Menu
          </h2>
          
          {isLoading ? (
            <div className="space-y-2 px-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : filteredNavigation.length > 0 ? (
            <nav className="space-y-0.5">
              {filteredNavigation.map((item) => (
                <NavigationItemComponent key={item.id} item={item} />
              ))}
            </nav>
          ) : (
            <p className="px-4 text-sm text-gray-500">
              No navigation items available
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
