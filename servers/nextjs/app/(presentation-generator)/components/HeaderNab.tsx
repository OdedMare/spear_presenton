"use client";
import { LayoutDashboard, Settings, User, LogOut } from "lucide-react";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { RootState, AppDispatch } from "@/store/store";
import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "@/store/slices/auth";
import { logout as logoutApi } from "../services/api/auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const HeaderNav = () => {

  const canChangeKeys = useSelector((state: RootState) => state.userConfig.can_change_keys);
  const { isAuthenticated, username, sessionToken } = useSelector((state: RootState) => state.auth);
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH === "true";

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await logoutApi(sessionToken);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logoutAction());
      router.push("/login");
    }
  };

  return (
    <div className="flex items-center gap-2">

      <Link
        href="/dashboard"
        prefetch={false}
        className="flex items-center gap-2 px-3 py-2 text-white hover:bg-primary/80 rounded-md transition-colors outline-none"
        role="menuitem"
        onClick={() => trackEvent(MixpanelEvent.Navigation, { from: pathname, to: "/dashboard" })}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-sm font-medium font-inter">
         מסך ראשי
        </span>
      </Link>
      {canChangeKeys && (
        <Link
          href="/settings"
          prefetch={false}
          className="flex items-center gap-2 px-3 py-2 text-white hover:bg-primary/80 rounded-md transition-colors outline-none"
          role="menuitem"
          onClick={() => trackEvent(MixpanelEvent.Navigation, { from: pathname, to: "/settings" })}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium font-inter">
            הגדרות
          </span>
        </Link>
      )}

      {/* Username Display - Only show if auth is enabled and user is logged in */}
      {requireAuth && isAuthenticated && username && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 text-white hover:bg-primary/80 rounded-md transition-colors outline-none">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium font-inter">
                {username}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[200px] p-2">
            <div className="space-y-2">
              <div className="px-3 py-2 text-sm text-gray-700">
                <div className="font-semibold">מחובר כ:</div>
                <div className="text-gray-500">{username}</div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                התנתק
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default HeaderNav;
