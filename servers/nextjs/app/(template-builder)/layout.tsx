import "../globals.css";
import { ConfigurationInitializer } from "../ConfigurationInitializer";

export default function TemplateBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <ConfigurationInitializer>{children}</ConfigurationInitializer>
    </div>
  );
}

