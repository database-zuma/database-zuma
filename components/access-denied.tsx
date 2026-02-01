"use client";

/**
 * Access Denied Component
 * 
 * Displayed when a user attempts to access a restricted resource.
 * Provides helpful messaging and navigation options.
 */

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shield, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AccessDeniedProps {
  /**
   * Custom message to display
   */
  message?: string;
  
  /**
   * Description of what the user tried to access
   */
  resource?: string;
  
  /**
   * If true, show a back button
   * @default true
   */
  showBackButton?: boolean;
  
  /**
   * If true, show a home button
   * @default true
   */
  showHomeButton?: boolean;
  
  /**
   * Custom back button handler
   */
  onBack?: () => void;
  
  /**
   * Custom home button handler
   */
  onHome?: () => void;
}

/**
 * Access Denied page/component
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <AccessDenied />
 * 
 * // With custom message
 * <AccessDenied message="You don't have permission to edit transactions" />
 * 
 * // With resource context
 * <AccessDenied 
 *   resource="User Management" 
 *   message="Only administrators can access user management"
 * />
 * 
 * // Without navigation buttons
 * <AccessDenied showBackButton={false} showHomeButton={false} />
 * ```
 */
export function AccessDenied({
  message,
  resource,
  showBackButton = true,
  showHomeButton = true,
  onBack,
  onHome,
}: AccessDeniedProps) {
  const router = useRouter();
  const t = useTranslations("errors");

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      router.push("/");
    }
  };

  const defaultMessage = t("accessDenied.defaultMessage") || 
    "You don't have permission to access this resource.";
  const title = t("accessDenied.title") || "Access Denied";

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            {resource && (
              <p className="font-medium text-gray-900 mb-2">
                {resource}
              </p>
            )}
            {message || defaultMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="text-sm text-gray-500 text-center">
            <p>
              If you believe this is an error, please contact your administrator
              to request access.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center gap-3">
          {showBackButton && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("accessDenied.goBack") || "Go Back"}
            </Button>
          )}
          {showHomeButton && (
            <Button
              onClick={handleHome}
              className="flex items-center gap-2 bg-[#002A3A] hover:bg-[#003d52]"
            >
              <Home className="w-4 h-4" />
              {t("accessDenied.goHome") || "Go Home"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Full-page access denied component for use in pages
 * 
 * Usage in a page:
 * ```tsx
 * export default function ProtectedPage() {
 *   const { can } = usePermissions();
 *   
 *   if (!can('manage_users')) {
 *     return <AccessDeniedPage message="User management requires admin access" />;
 *   }
 *   
 *   return <UserManagement />;
 * }
 * ```
 */
export function AccessDeniedPage(props: Omit<AccessDeniedProps, "fullPage">) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AccessDenied {...props} />
    </div>
  );
}

/**
 * Inline access denied message for embedding in other components
 * 
 * Usage:
 * ```tsx
 * <div className="p-4">
 *   <AccessDeniedInline message="You cannot edit this transaction" />
 * </div>
 * ```
 */
export function AccessDeniedInline({ message }: { message?: string }) {
  const t = useTranslations("errors");
  
  return (
    <div className="flex items-center gap-2 text-red-600 text-sm">
      <Shield className="w-4 h-4" />
      <span>
        {message || t("accessDenied.inline") || "Access denied"}
      </span>
    </div>
  );
}
